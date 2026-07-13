import axiosInstance from './axiosInstance';

// ─── Order ────────────────────────────────────────────────────────────────
export const getAllOrders = () =>
  axiosInstance.get('/api/Order');

export const getOrderById = (id) =>
  axiosInstance.get(`/api/Order/${id}`);

export const createOrder = (data) =>
  axiosInstance.post('/api/Order', data);

export const updateOrder = (data) =>
  axiosInstance.put('/api/Order', data);

export const deleteOrder = (id) =>
  axiosInstance.delete(`/api/Order/${id}`);

export const payOrder = (id) =>
  axiosInstance.post(`/api/Order/${id}/pay`);

// ─── Order Details ────────────────────────────────────────────────────────
export const getOrderDetails = (orderId) =>
  axiosInstance.get(`/api/Order/${orderId}/details`);

export const getOrderDetailById = (orderId, id) =>
  axiosInstance.get(`/api/Order/${orderId}/details/${id}`);

export const createOrderDetail = (orderId, data) =>
  axiosInstance.post(`/api/Order/${orderId}/details`, data);

export const updateOrderDetail = (orderId, id, data) =>
  axiosInstance.put(`/api/Order/${orderId}/details/${id}`, data);

export const deleteOrderDetail = (orderId, id) =>
  axiosInstance.delete(`/api/Order/${orderId}/details/${id}`);
