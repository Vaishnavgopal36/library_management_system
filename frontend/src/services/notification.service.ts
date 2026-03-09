import { api } from './api';

export interface ApiNotification {
  id: string;
  message: string;
  type: string;       // "book_issued" | "fine_accrual" | "fine_settled" | "admin_notice" | "system"
  isRead: boolean;
  createdAt: string;  // ISO-8601 datetime string
}

interface NotificationListResponse {
  notifications: ApiNotification[];
  unreadCount: number;
}

export const notificationService = {
  /** GET /notification — returns notifications + unread count in one call. */
  async fetch(): Promise<NotificationListResponse> {
    return api.get<NotificationListResponse>('/notification');
  },

  /** Convenience: just the list. */
  async list(): Promise<ApiNotification[]> {
    const data = await notificationService.fetch();
    return data.notifications;
  },

  /** Convenience: just the unread count. */
  async unreadCount(): Promise<number> {
    const data = await notificationService.fetch();
    return data.unreadCount;
  },

  /** PUT /notification { id } — mark a single notification read. */
  async markRead(id: string): Promise<void> {
    return api.put<void>('/notification', { id });
  },

  /** PUT /notification {} — mark all user notifications read. */
  async markAllRead(): Promise<void> {
    return api.put<void>('/notification', {});
  },

  /** POST /notification — admin sends a notification to a user. */
  async adminSend(userId: string, message: string): Promise<void> {
    return api.post<void>('/notification', { userId, message });
  },
};
