import axiosInstance from './axiosInstance';

export const registerCustomer = (data) =>
  axiosInstance.post('/api/CustomerAuth/register', data);

export const loginCustomer = (data) =>
  axiosInstance.post('/api/CustomerAuth/login', data);

export const getCustomerProfile = () =>
  axiosInstance.get('/api/CustomerPortal/profile');

export const getCustomerReservations = () =>
  axiosInstance.get('/api/CustomerPortal/reservations');

export const createCustomerReservation = (data) =>
  axiosInstance.post('/api/CustomerPortal/reservations', data);

export const getCustomerNotifications = () =>
  axiosInstance.get('/api/CustomerPortal/notifications');

export const getCustomerConversations = () =>
  axiosInstance.get('/api/CustomerPortal/conversations');

export const openCustomerConversation = (data) =>
  axiosInstance.post('/api/CustomerPortal/conversations', data);

export const getCustomerConversationDetails = (id) =>
  axiosInstance.get(`/api/CustomerPortal/conversations/${id}`);

export const sendCustomerChatMessage = (id, content) =>
  axiosInstance.post(`/api/CustomerPortal/conversations/${id}/messages`, { content });
