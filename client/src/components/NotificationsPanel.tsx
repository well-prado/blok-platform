import { useEffect } from 'react';
import { Bell, X, Check, Trash2, Settings } from 'lucide-react';
import { useNotificationsStore, getNotificationIcon, getNotificationColor } from '../stores/notifications';
import { formatRelativeTime } from '../lib/utils';
import type { NotificationData } from '../lib/websocket';

export default function NotificationsPanel() {
  const {
    notifications,
    unreadCount,
    isVisible,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    toggleVisibility,
    setVisibility,
  } = useNotificationsStore();

  // For demo purposes, we'll simulate a connected state
  // In a real implementation, this would check the polling service status
  const isConnected = true;

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (isVisible && !target.closest('.notifications-panel')) {
        setVisibility(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isVisible, setVisibility]);

  const handleNotificationClick = (notification: NotificationData) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }

    // Navigate to related content if available
    if (notification.workflowId) {
      window.location.href = `/workflows/${notification.workflowId}`;
    }
  };

  return (
    <div className="relative notifications-panel">
      {/* Notification Bell Button */}
      <button
        onClick={toggleVisibility}
        className={`relative p-2 rounded-lg transition-colors ${
          isVisible
            ? 'bg-primary-100 text-primary-600'
            : 'text-secondary-500 hover:text-secondary-700 hover:bg-secondary-100'
        }`}
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
        {!isConnected && (
          <span className="absolute -bottom-1 -right-1 h-3 w-3 bg-yellow-500 rounded-full" />
        )}
      </button>

      {/* Notifications Panel */}
      {isVisible && (
        <div className="absolute right-0 mt-2 w-96 max-w-sm bg-white rounded-lg shadow-lg border border-secondary-200 z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-secondary-200">
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-semibold text-secondary-900">Notifications</h3>
              {!isConnected && (
                <span className="text-xs text-yellow-600 bg-yellow-100 px-2 py-1 rounded">
                  Offline
                </span>
              )}
            </div>
            <div className="flex items-center space-x-1">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="p-1 text-secondary-500 hover:text-primary-600 transition-colors"
                  title="Mark all as read"
                >
                  <Check className="h-4 w-4" />
                </button>
              )}
              {/* <button
                onClick={() => setVisibility(false)}
                className="p-1 text-secondary-500 hover:text-secondary-700 transition-colors"
              >
                <X className="h-4 w-4" />
              </button> */}
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-secondary-500">
                <Bell className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No notifications yet</p>
                <p className="text-xs mt-1">You'll see updates here when they happen</p>
              </div>
            ) : (
              <div className="divide-y divide-secondary-100">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 cursor-pointer transition-colors ${
                      !notification.read
                        ? 'bg-blue-50 hover:bg-blue-100'
                        : 'hover:bg-secondary-50'
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start space-x-3">
                      {/* Notification Icon */}
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm ${getNotificationColor(notification.type)}`}>
                        {getNotificationIcon(notification.type)}
                      </div>

                      {/* Notification Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <p className={`text-sm ${
                            !notification.read ? 'font-semibold text-secondary-900' : 'text-secondary-700'
                          }`}>
                            {notification.title}
                          </p>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeNotification(notification.id);
                            }}
                            className="flex-shrink-0 p-1 text-secondary-400 hover:text-red-500 transition-colors"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                        <p className="text-xs text-secondary-600 mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-secondary-400 mt-2">
                          {formatRelativeTime(notification.timestamp)}
                        </p>
                      </div>

                      {/* Unread indicator */}
                      {!notification.read && (
                        <div className="flex-shrink-0 w-2 h-2 bg-primary-500 rounded-full"></div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-secondary-200 bg-secondary-50">
              <div className="flex items-center justify-between">
                <button
                  onClick={clearAll}
                  className="text-xs text-secondary-600 hover:text-red-600 transition-colors flex items-center"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Clear all
                </button>
                <button
                  onClick={() => {
                    // TODO: Navigate to notifications settings
                    setVisibility(false);
                  }}
                  className="text-xs text-secondary-600 hover:text-primary-600 transition-colors flex items-center"
                >
                  <Settings className="h-3 w-3 mr-1" />
                  Settings
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 