import { useAuthStore } from '../stores/auth';
import { toast } from '../stores/toast';

export interface NotificationData {
  id: string;
  type: 'comment' | 'rating' | 'follow' | 'favorite' | 'workflow_update' | 'system';
  title: string;
  message: string;
  userId: string;
  workflowId?: string;
  timestamp: string;
  read: boolean;
  metadata?: Record<string, unknown>;
}

export interface WebSocketMessage {
  type: 'notification' | 'activity' | 'presence' | 'workflow_update';
  data: unknown;
}

class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 5000;
  private listeners: Map<string, ((data: unknown) => void)[]> = new Map();
  private connected = false;
  private userId: string | null = null;

  constructor() {
    this.connect();
  }

  private connect() {
    try {
      const token = localStorage.getItem('auth_token');
      const wsUrl = `ws://localhost:4000/ws${token ? `?token=${token}` : ''}`;
      
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.connected = true;
        this.reconnectAttempts = 0;
        
        // Get current user for filtering notifications
        const { user } = useAuthStore.getState();
        this.userId = user?.id || null;

        // Send initial presence
        this.send({
          type: 'presence',
          data: { status: 'online', userId: this.userId }
        });
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.connected = false;
        this.scheduleReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.connected = false;
      };

    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      setTimeout(() => {
        this.reconnectAttempts++;
        console.log(`Reconnecting WebSocket (attempt ${this.reconnectAttempts})`);
        this.connect();
      }, this.reconnectInterval);
    }
  }

  private handleMessage(message: WebSocketMessage) {
    const listeners = this.listeners.get(message.type) || [];
    listeners.forEach(listener => listener(message.data));

    // Handle notifications automatically
    if (message.type === 'notification') {
      this.handleNotification(message.data as NotificationData);
    }
  }

  private handleNotification(notification: NotificationData) {
    // Only show notifications for the current user
    if (this.userId && notification.userId === this.userId) {
      // Show toast notification
      switch (notification.type) {
        case 'comment':
          toast.info(`💬 ${notification.title}`, notification.message);
          break;
        case 'rating':
          toast.success(`⭐ ${notification.title}`, notification.message);
          break;
        case 'follow':
          toast.info(`👥 ${notification.title}`, notification.message);
          break;
        case 'favorite':
          toast.success(`❤️ ${notification.title}`, notification.message);
          break;
        case 'workflow_update':
          toast.info(`🔄 ${notification.title}`, notification.message);
          break;
        default:
          toast.info(notification.title, notification.message);
      }
    }
  }

  public send(message: WebSocketMessage) {
    if (this.ws && this.connected) {
      this.ws.send(JSON.stringify(message));
    }
  }

  public subscribe(type: string, callback: (data: unknown) => void) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, []);
    }
    this.listeners.get(type)!.push(callback);

    // Return unsubscribe function
    return () => {
      const listeners = this.listeners.get(type);
      if (listeners) {
        const index = listeners.indexOf(callback);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      }
    };
  }

  public unsubscribe(type: string, callback: (data: unknown) => void) {
    const listeners = this.listeners.get(type);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  public disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.connected = false;
    }
  }

  public isConnected() {
    return this.connected;
  }

  // Utility methods for common actions
  public notifyCommentAdded(workflowId: string, commentData: unknown) {
    this.send({
      type: 'notification',
      data: {
        type: 'comment',
        workflowId,
        action: 'added',
        data: commentData
      }
    });
  }

  public notifyRatingAdded(workflowId: string, ratingData: unknown) {
    this.send({
      type: 'notification',
      data: {
        type: 'rating',
        workflowId,
        action: 'added',
        data: ratingData
      }
    });
  }

  public updatePresence(status: 'online' | 'away' | 'offline') {
    this.send({
      type: 'presence',
      data: { status, userId: this.userId }
    });
  }
}

// Create singleton instance
export const websocketService = new WebSocketService();

// Export hook for React components
export function useWebSocket() {
  return {
    isConnected: websocketService.isConnected(),
    subscribe: websocketService.subscribe.bind(websocketService),
    send: websocketService.send.bind(websocketService),
    notifyCommentAdded: websocketService.notifyCommentAdded.bind(websocketService),
    notifyRatingAdded: websocketService.notifyRatingAdded.bind(websocketService),
    updatePresence: websocketService.updatePresence.bind(websocketService),
  };
} 