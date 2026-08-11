import axiosInstance from './axiosInstance';

export const getUnreadCount = () => {
  return axiosInstance.get('/api/Notification/unread-count');
};

export const getRecentNotifications = () => {
  return axiosInstance.get('/api/Notification/recent');
};

export const markAsRead = (id) => {
  return axiosInstance.put(`/api/Notification/${id}/read`);
};
