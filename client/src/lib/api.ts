import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Types
export interface User {
  id: string;
  email: string;
  username: string;
  first_name?: string;
  last_name?: string;
  profile_image_url?: string;
  bio?: string;
  location?: string;
  website?: string;
  github_username?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Workflow {
  _id: string;
  id: string;
  name: string;
  description: string;
  version: string;
  trigger: object;
  steps: unknown[];
  nodes: object;
  category: string;
  tags: string[];
  isPublic: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  downloadCount: number;
  rating: number;
  ratingCount: number;
  averageRating?: number;
  commentCount?: number;
}

export interface Comment {
  id: string;
  workflow_id: string;
  user_id: string;
  parent_comment_id?: string;
  content: string;
  is_edited: boolean;
  created_at: string;
  updated_at: string;
  username: string;
  first_name?: string;
  last_name?: string;
  profile_image_url?: string;
}

export interface Rating {
  id: string;
  workflow_id: string;
  user_id: string;
  rating: number;
  review_text?: string;
  created_at: string;
  updated_at: string;
  username: string;
  first_name?: string;
  last_name?: string;
  profile_image_url?: string;
}

export interface Activity {
  id: string;
  user_id: string;
  activity_type: string;
  type: string;
  target_type: string;
  target_id: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  username: string;
  first_name?: string;
  last_name?: string;
  profile_image_url?: string;
}

// Auth API
export const authApi = {
  register: async (data: {
    email: string;
    username: string;
    password: string;
    firstName: string;
    lastName: string;
  }) => {
    const response = await api.post('/auth-register', data);
    return response.data;
  },

  login: async (credentials: { email: string; password: string }) => {
    const response = await api.post('/auth-login', credentials);
    return response.data;
  },

  verifyToken: async (token: string) => {
    const response = await api.post('/auth-verify', { token });
    return response.data;
  },

  refreshToken: async (refreshToken: string) => {
    const response = await api.post('/auth-refresh', { refreshToken });
    return response.data;
  },
};

// Profile API
export const profileApi = {
  getProfile: async () => {
    const response = await api.get('/profile-get');
    return response.data;
  },

  updateProfile: async (data: Partial<User>) => {
    const response = await api.put('/profile-update', data);
    return response.data;
  },

  changePassword: async (data: {
    currentPassword: string;
    newPassword: string;
  }) => {
    const response = await api.post('/profile-password-change', data);
    return response.data;
  },

  getPublicProfile: async (userId: string) => {
    const response = await api.get(`/profile-public?userId=${userId}`);
    return response.data;
  },
};

// Utility to transform backend workflow data
const transformWorkflow = (workflow: Omit<Workflow, 'id'>): Workflow => ({
  ...workflow,
  id: workflow._id, // Map _id to id for frontend compatibility
});

// Workflow API
export const workflowApi = {
  create: async (data: {
    name: string;
    description: string;
    category: string;
    tags: string[];
    isPublic: boolean;
    trigger: object;
    steps: unknown[];
    nodes: object;
    version?: string;
  }) => {
    const response = await api.post('/workflow-create', data);
    return response.data;
  },

  get: async (workflowId: string) => {
    const response = await api.get('/workflow-get', {
      params: { operation: 'get', workflowId },
    });
    return response.data;
  },

  update: async (workflowId: string, data: Partial<Workflow>) => {
    const response = await api.put('/workflow-update', {
      operation: 'update',
      workflowId,
      ...data,
    });
    return response.data;
  },

  delete: async (workflowId: string) => {
    const response = await api.delete('/workflow-delete', {
      data: { operation: 'delete', workflowId },
    });
    return response.data;
  },

  list: async (params: {
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}) => {
    const response = await api.get('/workflow-list', {
      params,
    });
    const data = response.data;
    return {
      ...data,
      workflows: data.workflows?.map(transformWorkflow) || [],
    };
  },

  search: async (params: {
    query?: string;
    category?: string;
    tags?: string[];
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) => {
    const response = await api.get('/workflow-search', {
      params,
    });
    const data = response.data;
    return {
      ...data,
      workflows: data.workflows?.map(transformWorkflow) || [],
    };
  },

  getByUser: async (params: {
    username?: string;
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) => {
    const response = await api.get('/my-workflows', {
      params: { operation: 'get-by-user', ...params },
    });
    return response.data;
  },
};

// Community API
export const communityApi = {
  // Comments
  addComment: async (data: {
    workflowId: string;
    content: string;
    parentCommentId?: string;
  }) => {
    const response = await api.post('/comment-add', data);
    return response.data;
  },

  getComments: async (workflowId: string, params: {
    limit?: number;
    offset?: number;
  } = {}) => {
    const response = await api.get('/comments-get', {
      params: { workflowId, ...params },
    });
    return response.data;
  },

  // Ratings
  rateWorkflow: async (data: {
    workflowId: string;
    rating: number;
    reviewText?: string;
  }) => {
    const response = await api.post('/workflow-rate', data);
    return response.data;
  },

  getWorkflowRating: async (workflowId: string) => {
    const response = await api.get('/workflow-rating-get', {
      params: { workflowId },
    });
    return response.data;
  },

  // Follow system
  followUser: async (targetUserId: string) => {
    const response = await api.post('/user-follow', { targetUserId });
    return response.data;
  },

  unfollowUser: async (targetUserId: string) => {
    const response = await api.post('/user-unfollow', { targetUserId });
    return response.data;
  },

  getFollowers: async (userId: string, params: {
    limit?: number;
    offset?: number;
  } = {}) => {
    const response = await api.get('/user-followers', {
      params: { userId, ...params },
    });
    return response.data;
  },

  getFollowing: async (userId: string, params: {
    limit?: number;
    offset?: number;
  } = {}) => {
    const response = await api.get('/user-following', {
      params: { userId, ...params },
    });
    return response.data;
  },

  // Favorites
  favoriteWorkflow: async (workflowId: string) => {
    const response = await api.post('/workflow-favorite', { workflowId });
    return response.data;
  },

  unfavoriteWorkflow: async (workflowId: string) => {
    const response = await api.post('/workflow-unfavorite', { workflowId });
    return response.data;
  },

  getFavorites: async (params: {
    limit?: number;
    offset?: number;
  } = {}) => {
    const response = await api.get('/user-favorites', { params });
    return response.data;
  },

  // Activity feed
  getActivityFeed: async (params: {
    limit?: number;
    offset?: number;
  } = {}) => {
    const response = await api.get('/activity-feed', { params });
    return response.data;
  },
};

// AI API
export const aiApi = {
  generateWorkflow: async (prompt: string, context?: Record<string, unknown>) => {
    const response = await api.post('/ai/generate-workflow', { 
      prompt, 
      context,
      options: {
        temperature: 0.7,
        max_tokens: 2000,
      }
    });
    return response.data;
  },

  chatComplete: async (messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>) => {
    const response = await api.post('/ai/chat', { 
      messages,
      options: {
        temperature: 0.7,
        max_tokens: 1000,
      }
    });
    return response.data;
  },

  semanticSearch: async (query: string, filters?: Record<string, unknown>) => {
    const response = await api.post('/ai/semantic-search', { 
      query, 
      filters,
      limit: 10,
    });
    return response.data;
  },
};

export default api; 