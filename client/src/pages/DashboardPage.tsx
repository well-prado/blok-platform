import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Plus,
  Star,
  Download,
  Heart,
  TrendingUp as Trending,
  Activity,
  Search,
  MessageCircle,
  BarChart3,
  Settings,
  BookOpen,
  Zap
} from 'lucide-react';

import { workflowApi, type Workflow, type Activity as ActivityType } from '../lib/api';
import { useAuthStore } from '../stores/auth';
import { formatRelativeTime, truncateText } from '../lib/utils';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'workflows' | 'favorites' | 'activity'>('overview');

  // Fetch user's workflows
  const { data: userWorkflows } = useQuery({
    queryKey: ['user-workflows', user?.username],
    queryFn: () => workflowApi.getByUser({ username: user!.username }),
    enabled: !!user?.username,
  });

  // Fetch user's favorites (placeholder - will be implemented)
  const { data: favoriteWorkflows } = useQuery({
    queryKey: ['user-favorites', user?.username],
    queryFn: () => Promise.resolve({ workflows: [] as Workflow[] }),
    enabled: !!user?.username,
  });

  // Fetch personalized recommendations (placeholder - will be implemented)
  const { data: recommendations } = useQuery({
    queryKey: ['recommendations', user?.username],
    queryFn: () => Promise.resolve({ workflows: [] as Workflow[] }),
    enabled: !!user?.username,
  });

  // Fetch user activity (placeholder - will be implemented)
  const { data: userActivity } = useQuery({
    queryKey: ['user-activity', user?.username],
    queryFn: () => Promise.resolve({ activities: [] as ActivityType[] }),
    enabled: !!user?.username,
  });

  // Fetch recent workflows
  const { data: recentWorkflows } = useQuery({
    queryKey: ['recent-workflows'],
    queryFn: () => workflowApi.search({ sortBy: 'createdAt', sortOrder: 'desc', limit: 6 }),
  });

  const workflows = userWorkflows?.workflows || [];
  const favorites = favoriteWorkflows?.workflows || [];
  const activity = userActivity?.activities || [];
  const recent = recentWorkflows?.workflows || [];
  const suggested = recommendations?.workflows || [];

  // Calculate stats
  const totalDownloads = workflows.reduce((sum: number, w: Workflow) => sum + (w.downloadCount || 0), 0);
  const totalRating = workflows.reduce((sum: number, w: Workflow) => sum + (w.rating || 0), 0) / Math.max(workflows.length, 1);

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-secondary-900">
              Welcome back, {user?.first_name || user?.username}!
            </h1>
            <p className="mt-2 text-lg text-secondary-600">
              Here's what's happening with your workflows
            </p>
          </div>
          <Link to="/workflows/create" className="btn-primary flex items-center">
            <Plus className="h-5 w-5 mr-2" />
            Create Workflow
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BookOpen className="h-8 w-8 text-primary-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-secondary-500 truncate">
                    My Workflows
                  </dt>
                  <dd className="text-2xl font-semibold text-secondary-900">
                    {workflows.length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Download className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-secondary-500 truncate">
                    Total Downloads
                  </dt>
                  <dd className="text-2xl font-semibold text-secondary-900">
                    {totalDownloads.toLocaleString()}
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Star className="h-8 w-8 text-yellow-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-secondary-500 truncate">
                    Average Rating
                  </dt>
                  <dd className="text-2xl font-semibold text-secondary-900">
                    {totalRating.toFixed(1)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Heart className="h-8 w-8 text-red-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-secondary-500 truncate">
                    Favorites
                  </dt>
                  <dd className="text-2xl font-semibold text-secondary-900">
                    {favorites.length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="card mb-6">
          <div className="border-b border-secondary-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'overview', label: 'Overview', icon: BarChart3 },
                { id: 'workflows', label: `My Workflows (${workflows.length})`, icon: BookOpen },
                { id: 'favorites', label: `Favorites (${favorites.length})`, icon: Heart },
                { id: 'activity', label: 'Activity', icon: Activity },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as 'overview' | 'workflows' | 'favorites' | 'activity')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300'
                  }`}
                >
                  <tab.icon className="h-4 w-4 mr-2" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* Recommendations */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-secondary-900 flex items-center">
                      <Zap className="h-5 w-5 mr-2 text-yellow-500" />
                      Recommended for You
                    </h3>
                    <Link to="/workflows" className="text-primary-600 hover:text-primary-500 text-sm font-medium">
                      View all
                    </Link>
                  </div>
                  
                  {suggested.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                          {suggested.slice(0, 3).map((workflow) => (
                      <WorkflowCard key={workflow._id || workflow.id} workflow={workflow} />
                    ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-secondary-500">
                      <Search className="h-12 w-12 mx-auto mb-2" />
                      <p>Browse workflows to get personalized recommendations</p>
                      <Link to="/workflows" className="btn-primary mt-4">
                        Explore Workflows
                      </Link>
                    </div>
                  )}
                </div>

                {/* Recent Activity */}
                <div>
                  <h3 className="text-lg font-semibold text-secondary-900 mb-4 flex items-center">
                    <Activity className="h-5 w-5 mr-2 text-green-500" />
                    Recent Activity
                  </h3>
                  
                  {activity.length > 0 ? (
                    <div className="space-y-3">
                      {activity.slice(0, 5).map((activity) => (
                        <ActivityItem key={activity.id} activity={activity} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-secondary-500">
                      <Activity className="h-12 w-12 mx-auto mb-2" />
                      <p>No recent activity to show</p>
                    </div>
                  )}
                </div>

                {/* Latest Workflows */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-secondary-900 flex items-center">
                      <Trending className="h-5 w-5 mr-2 text-blue-500" />
                      Latest from Community
                    </h3>
                    <Link to="/workflows?sort=newest" className="text-primary-600 hover:text-primary-500 text-sm font-medium">
                      View all
                    </Link>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {recent.slice(0, 3).map((workflow: Workflow) => (
                      <WorkflowCard key={workflow.id} workflow={workflow} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* My Workflows Tab */}
            {activeTab === 'workflows' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-secondary-900">
                    My Workflows ({workflows.length})
                  </h3>
                  <Link to="/workflows/create" className="btn-primary flex items-center">
                    <Plus className="h-4 w-4 mr-2" />
                    Create New
                  </Link>
                </div>

                {workflows.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {workflows.map((workflow: Workflow) => (
                      <WorkflowCard key={workflow.id} workflow={workflow} isOwner />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-secondary-500">
                    <BookOpen className="h-16 w-16 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-secondary-900 mb-2">No workflows yet</h4>
                    <p className="mb-6">Create your first workflow to get started</p>
                    <Link to="/workflows/create" className="btn-primary">
                      Create Workflow
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Favorites Tab */}
            {activeTab === 'favorites' && (
              <div>
                <h3 className="text-lg font-semibold text-secondary-900 mb-6">
                  Favorite Workflows ({favorites.length})
                </h3>

                {favorites.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {favorites.map((workflow) => (
                      <WorkflowCard key={workflow.id} workflow={workflow} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-secondary-500">
                    <Heart className="h-16 w-16 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-secondary-900 mb-2">No favorites yet</h4>
                    <p className="mb-6">Browse workflows and favorite the ones you like</p>
                    <Link to="/workflows" className="btn-primary">
                      Browse Workflows
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Activity Tab */}
            {activeTab === 'activity' && (
              <div>
                <h3 className="text-lg font-semibold text-secondary-900 mb-6">
                  Recent Activity
                </h3>

                {activity.length > 0 ? (
                  <div className="space-y-4">
                    {activity.map((activity) => (
                      <ActivityItem key={activity.id} activity={activity} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-secondary-500">
                    <Activity className="h-16 w-16 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-secondary-900 mb-2">No activity yet</h4>
                    <p className="mb-6">Start interacting with workflows to see your activity</p>
                    <Link to="/workflows" className="btn-primary">
                      Explore Workflows
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface WorkflowCardProps {
  workflow: Workflow;
  isOwner?: boolean;
}

function WorkflowCard({ workflow, isOwner = false }: WorkflowCardProps) {
  return (
    <Link to={`/workflows/${workflow.id}`} className="card hover:shadow-lg transition-shadow duration-200">
      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <h4 className="text-lg font-semibold text-secondary-900 truncate pr-2">
            {workflow.name}
          </h4>
          <span className="badge-primary text-xs whitespace-nowrap">
            {workflow.category}
          </span>
        </div>
        
        <p className="text-secondary-600 text-sm mb-4 line-clamp-2">
          {truncateText(workflow.description, 100)}
        </p>
        
        <div className="flex items-center justify-between text-xs text-secondary-500">
          <div className="flex items-center space-x-4">
            <span className="flex items-center">
              <Download className="h-3 w-3 mr-1" />
              {workflow.downloadCount}
            </span>
            <span className="flex items-center">
              <Star className="h-3 w-3 mr-1" />
              {workflow.averageRating?.toFixed(1) || '0.0'}
            </span>
            <span className="flex items-center">
              <MessageCircle className="h-3 w-3 mr-1" />
              {workflow.commentCount || 0}
            </span>
          </div>
          
          {isOwner && (
            <div className="flex items-center space-x-2">
              <Link
                to={`/workflows/${workflow.id}/edit`}
                className="text-primary-600 hover:text-primary-700"
                onClick={(e) => e.stopPropagation()}
              >
                Edit
              </Link>
            </div>
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-secondary-200">
          <div className="flex items-center justify-between text-xs text-secondary-500">
            <span>By {workflow.createdBy}</span>
            <span>{formatRelativeTime(workflow.updatedAt)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

interface ActivityItemProps {
  activity: ActivityType;
}

function ActivityItem({ activity }: ActivityItemProps) {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'workflow_created':
        return <Plus className="h-4 w-4 text-green-500" />;
      case 'workflow_updated':
        return <Settings className="h-4 w-4 text-blue-500" />;
      case 'workflow_favorited':
        return <Heart className="h-4 w-4 text-red-500" />;
      case 'comment_added':
        return <MessageCircle className="h-4 w-4 text-purple-500" />;
      case 'rating_given':
        return <Star className="h-4 w-4 text-yellow-500" />;
      default:
        return <Activity className="h-4 w-4 text-secondary-500" />;
    }
  };

  const getActivityText = (type: string, metadata: Record<string, unknown>) => {
    switch (type) {
      case 'workflow_created':
        return `Created workflow "${metadata.workflowName}"`;
      case 'workflow_updated':
        return `Updated workflow "${metadata.workflowName}"`;
      case 'workflow_favorited':
        return `Favorited workflow "${metadata.workflowName}"`;
      case 'comment_added':
        return `Commented on workflow "${metadata.workflowName}"`;
      case 'rating_given':
        return `Rated workflow "${metadata.workflowName}" ${metadata.rating} stars`;
      default:
        return 'Unknown activity';
    }
  };

  return (
    <div className="flex items-start space-x-3 p-4 bg-secondary-50 rounded-lg">
      <div className="flex-shrink-0 mt-0.5">
        {getActivityIcon(activity.type)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-secondary-900">
          {getActivityText(activity.type, activity.metadata || {})}
        </p>
        <p className="text-xs text-secondary-500 mt-1">
          {formatRelativeTime(activity.created_at)}
        </p>
      </div>
    </div>
  );
} 