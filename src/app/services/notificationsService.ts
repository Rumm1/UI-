import { Notification, NotificationsResponse, NotificationFilters, NotificationSeverity } from '../types/notification';

// Mock данные уведомлений
const generateMockNotifications = (count: number): Notification[] => {
  const titles = [
    'Новая запись на приём',
    'Отмена записи',
    'Результаты анализов готовы',
    'Критическое состояние пациента',
    'Обновление медицинской карты',
    'Напоминание о приёме',
    'Подтверждение рецепта',
    'Запрос на консультацию',
  ];

  const bodies = [
    'Пациент Иванов И.И. записался на приём на 18 апреля в 14:00',
    'Запись на 19 апреля отменена пациентом',
    'Результаты анализов пациента Петрова П.П. готовы к просмотру',
    'Требуется срочное внимание к пациенту Сидоров С.С.',
    'Медицинская карта пациента обновлена врачом',
    'Напоминание о записи сегодня в 15:30',
    'Рецепт №12345 подтверждён аптекой',
    'Запрос на консультацию от врача-специалиста',
  ];

  const severities: NotificationSeverity[] = ['CRITICAL', 'HIGH', 'NORMAL', 'LOW'];
  const actionUrls = ['/appointments', '/patients', '/records', '/prescriptions'];

  return Array.from({ length: count }, (_, i) => {
    const date = new Date();
    date.setHours(date.getHours() - Math.floor(Math.random() * 72));

    return {
      id: `notification-${i + 1}`,
      title: titles[i % titles.length],
      body: bodies[i % bodies.length],
      action_url: actionUrls[i % actionUrls.length],
      severity: severities[i % severities.length],
      display_duration: Math.floor(Math.random() * 3) + 3, // 3-5 секунд
      is_read: Math.random() > 0.5,
      created_at: date.toISOString(),
    };
  });
};

let mockNotifications = generateMockNotifications(50);

// GET /api/v1/system-services/notification/notifications
export const getNotifications = async (filters?: NotificationFilters): Promise<NotificationsResponse> => {
  await new Promise(resolve => setTimeout(resolve, 300)); // Имитация задержки сети

  let filtered = [...mockNotifications];

  // Фильтрация
  if (filters?.is_read !== undefined && filters.is_read !== null) {
    filtered = filtered.filter(n => n.is_read === filters.is_read);
  }

  if (filters?.severity) {
    filtered = filtered.filter(n => n.severity === filters.severity);
  }

  if (filters?.search) {
    const search = filters.search.toLowerCase();
    filtered = filtered.filter(
      n => n.title.toLowerCase().includes(search) || n.body.toLowerCase().includes(search)
    );
  }

  if (filters?.from) {
    filtered = filtered.filter(n => new Date(n.created_at) >= new Date(filters.from!));
  }

  if (filters?.to) {
    filtered = filtered.filter(n => new Date(n.created_at) <= new Date(filters.to!));
  }

  // Сортировка по дате (новые первыми)
  filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // Пагинация
  const page = filters?.page || 1;
  const size = filters?.size || 20;
  const start = (page - 1) * size;
  const end = start + size;
  const items = filtered.slice(start, end);

  return {
    items,
    pagination: {
      page,
      size,
      total_items: filtered.length,
      total_pages: Math.ceil(filtered.length / size),
    },
  };
};

// GET /api/v1/system-services/notification/notifications/unread-count
export const getUnreadCount = async (): Promise<number> => {
  await new Promise(resolve => setTimeout(resolve, 100));
  return mockNotifications.filter(n => !n.is_read).length;
};

// PUT /api/v1/system-services/notification/notifications/{id}/read
export const markAsRead = async (id: string): Promise<void> => {
  await new Promise(resolve => setTimeout(resolve, 100));
  const notification = mockNotifications.find(n => n.id === id);
  if (notification) {
    notification.is_read = true;
  }
};

// PUT /api/v1/system-services/notification/notifications/read-all
export const markAllAsRead = async (): Promise<void> => {
  await new Promise(resolve => setTimeout(resolve, 200));
  mockNotifications.forEach(n => {
    n.is_read = true;
  });
};

// Добавить новое уведомление (для имитации WebSocket)
export const addNotification = (notification: Notification): void => {
  mockNotifications.unshift(notification);
};
