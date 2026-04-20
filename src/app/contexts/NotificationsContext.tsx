import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Notification } from '../types/notification';
import { getUnreadCount, markAsRead, markAllAsRead, addNotification } from '../services/notificationsService';

interface NotificationsContextType {
  unreadCount: number;
  newNotification: Notification | null;
  refreshUnreadCount: () => Promise<void>;
  markNotificationAsRead: (id: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  clearNewNotification: () => void;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationsProvider');
  }
  return context;
};

interface NotificationsProviderProps {
  children: ReactNode;
}

export const NotificationsProvider = ({ children }: NotificationsProviderProps) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [newNotification, setNewNotification] = useState<Notification | null>(null);
  const [ws, setWs] = useState<WebSocket | null>(null);

  const refreshUnreadCount = useCallback(async () => {
    try {
      const count = await getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  }, []);

  const markNotificationAsRead = useCallback(async (id: string) => {
    try {
      await markAsRead(id);
      await refreshUnreadCount();
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }, [refreshUnreadCount]);

  const markAllNotificationsAsRead = useCallback(async () => {
    try {
      await markAllAsRead();
      await refreshUnreadCount();
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  }, [refreshUnreadCount]);

  const clearNewNotification = useCallback(() => {
    setNewNotification(null);
  }, []);

  // Имитация WebSocket подключения
  useEffect(() => {
    let reconnectTimeout: NodeJS.Timeout;

    const connectWebSocket = () => {
      // В реальном приложении здесь будет настоящее WebSocket подключение
      // const socket = new WebSocket('ws://your-server/ws/v1/system-services/notification/notifications');
      
      // Имитация WebSocket - генерируем случайные уведомления
      const simulateNewNotifications = () => {
        const interval = setInterval(() => {
          // Генерируем новое уведомление с вероятностью 20%
          if (Math.random() > 0.8) {
            const severities = ['CRITICAL', 'HIGH', 'NORMAL', 'LOW'] as const;
            const titles = [
              'Новая запись на приём',
              'Результаты анализов готовы',
              'Критическое состояние пациента',
              'Напоминание о приёме',
            ];
            const bodies = [
              'Пациент записался на приём',
              'Результаты анализов готовы к просмотру',
              'Требуется срочное внимание',
              'Напоминание о записи сегодня',
            ];

            const notification: Notification = {
              id: `notification-new-${Date.now()}`,
              title: titles[Math.floor(Math.random() * titles.length)],
              body: bodies[Math.floor(Math.random() * bodies.length)],
              action_url: '/appointments',
              severity: severities[Math.floor(Math.random() * severities.length)],
              display_duration: 5,
              is_read: false,
              created_at: new Date().toISOString(),
            };

            addNotification(notification);
            setNewNotification(notification);
            setUnreadCount(prev => prev + 1);
          }
        }, 30000); // Каждые 30 секунд проверяем

        return interval;
      };

      const interval = simulateNewNotifications();

      return () => {
        clearInterval(interval);
      };
    };

    const cleanup = connectWebSocket();

    return () => {
      if (cleanup) cleanup();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, []);

  // Загружаем начальное количество непрочитанных
  useEffect(() => {
    refreshUnreadCount();
  }, [refreshUnreadCount]);

  return (
    <NotificationsContext.Provider
      value={{
        unreadCount,
        newNotification,
        refreshUnreadCount,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        clearNewNotification,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
};
