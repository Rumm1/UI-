import { useEffect, useState } from 'react';
import { X, AlertCircle, AlertTriangle, Info, Bell } from 'lucide-react';
import { Notification, NotificationSeverity } from '../types/notification';
import { useNotifications } from '../contexts/NotificationsContext';
import { useNavigate } from 'react-router';

interface NotificationToastProps {
  notification: Notification;
}

const getSeverityConfig = (severity: NotificationSeverity) => {
  switch (severity) {
    case 'CRITICAL':
      return {
        bgColor: 'bg-red-50 border-red-200',
        iconColor: 'text-red-600',
        Icon: AlertCircle,
      };
    case 'HIGH':
      return {
        bgColor: 'bg-orange-50 border-orange-200',
        iconColor: 'text-orange-600',
        Icon: AlertTriangle,
      };
    case 'NORMAL':
      return {
        bgColor: 'bg-card border-border',
        iconColor: 'text-primary',
        Icon: Bell,
      };
    case 'LOW':
      return {
        bgColor: 'bg-muted border-border',
        iconColor: 'text-muted-foreground',
        Icon: Info,
      };
  }
};

export function NotificationToast({ notification }: NotificationToastProps) {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const { markNotificationAsRead, clearNewNotification } = useNotifications();
  const navigate = useNavigate();

  const { bgColor, iconColor, Icon } = getSeverityConfig(notification.severity);

  useEffect(() => {
    // Появление с анимацией
    const showTimer = setTimeout(() => setVisible(true), 100);

    // Автоматическое скрытие
    const hideTimer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => {
        setDismissed(true);
        clearNewNotification();
      }, 300);
    }, notification.display_duration * 1000);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [notification.display_duration, clearNewNotification]);

  const handleClick = async () => {
    await markNotificationAsRead(notification.id);
    if (notification.action_url) {
      navigate(notification.action_url);
    }
    setVisible(false);
    setTimeout(() => {
      setDismissed(true);
      clearNewNotification();
    }, 300);
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setVisible(false);
    setTimeout(() => {
      setDismissed(true);
      clearNewNotification();
    }, 300);
  };

  if (dismissed) return null;

  return (
    <div
      className={`fixed bottom-6 right-6 w-96 border rounded-xl shadow-lg overflow-hidden cursor-pointer transition-all duration-300 ${bgColor} ${
        visible ? 'translate-x-0 opacity-100' : 'translate-x-[120%] opacity-0'
      }`}
      onClick={handleClick}
      style={{ zIndex: 9999 }}
    >
      <div className="p-4 flex gap-3">
        <div className={`flex-shrink-0 ${iconColor}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-foreground mb-1">{notification.title}</h4>
          <p className="text-sm text-muted-foreground line-clamp-2">{notification.body}</p>
        </div>
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 p-1 hover:bg-background/50 rounded-lg transition-colors"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}
