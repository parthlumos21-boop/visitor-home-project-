import api from './api';

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export const getNotifications = async (): Promise<AppNotification[]> => {
  const response = await api.get('/notifications');
  return response.data;
};
