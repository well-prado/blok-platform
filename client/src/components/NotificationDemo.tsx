import { Bell, MessageCircle, Star, Heart, UserPlus } from 'lucide-react';
import { useNotificationsStore } from '../stores/notifications';
import { toast } from '../stores/toast';
import type { NotificationData } from '../lib/websocket';

export default function NotificationDemo() {
  const { addNotification } = useNotificationsStore();

  const triggerNotification = (type: NotificationData['type'], title: string, message: string) => {
    const notification: NotificationData = {
      id: `demo-${Date.now()}`,
      type,
      title,
      message,
      userId: 'current-user',
      workflowId: type === 'comment' || type === 'rating' ? 'demo-workflow-123' : undefined,
      timestamp: new Date().toISOString(),
      read: false,
    };

    addNotification(notification);
    toast.success('Test notification added!');
  };

  const testNotifications = [
    {
      type: 'comment' as const,
      title: 'New Comment',
      message: 'Someone commented on your workflow "Data Processing Pipeline"',
      icon: MessageCircle,
      color: 'bg-blue-500',
    },
    {
      type: 'rating' as const,
      title: 'New Rating',
      message: 'Your workflow received a 5-star rating!',
      icon: Star,
      color: 'bg-yellow-500',
    },
    {
      type: 'favorite' as const,
      title: 'Workflow Favorited',
      message: 'Your workflow "Slack Integration" was favorited by john_dev',
      icon: Heart,
      color: 'bg-red-500',
    },
    {
      type: 'follow' as const,
      title: 'New Follower',
      message: 'sarah_code started following you',
      icon: UserPlus,
      color: 'bg-green-500',
    },
  ];

  return (
    <div className="card p-6">
      <div className="flex items-center mb-4">
        <Bell className="h-5 w-5 mr-2 text-primary-600" />
        <h3 className="text-lg font-semibold text-secondary-900">Test Notifications</h3>
      </div>
      <p className="text-secondary-600 mb-6">
        Click the buttons below to test the notification system. Notifications will appear in the bell icon in the header.
      </p>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {testNotifications.map((notif, index) => (
          <button
            key={index}
            onClick={() => triggerNotification(notif.type, notif.title, notif.message)}
            className="p-4 border border-secondary-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-all text-left group"
          >
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 ${notif.color} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <notif.icon className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-secondary-900 group-hover:text-primary-600">
                  {notif.title}
                </h4>
                <p className="text-sm text-secondary-600 mt-1">
                  {notif.message}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>💡 Tip:</strong> In a real application, these notifications would be triggered by actual user interactions 
          like comments, ratings, and follows. This demo shows how the notification system works.
        </p>
      </div>
    </div>
  );
} 