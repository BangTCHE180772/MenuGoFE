import axiosInstance from './axiosInstance';

// ─── Order ────────────────────────────────────────────────────────────────
export const getAllOrders = () =>
  axiosInstance.get('/api/Order');

export const getPaidInvoices = (branchId) =>
  axiosInstance.get('/api/Order/invoices', { params: { branchId } });

export const getOrderById = (id) =>
  axiosInstance.get(`/api/Order/${id}`);

export const createOrder = (data) =>
  axiosInstance.post('/api/Order', data);

export const updateOrder = (data) =>
  axiosInstance.put('/api/Order', data);

export const deleteOrder = (id) =>
  axiosInstance.delete(`/api/Order/${id}`);

export const payOrder = (id, data) =>
  axiosInstance.post(`/api/Order/${id}/pay`, data);

export const mergeOrder = (data) =>
  axiosInstance.post('/api/Order/merge', data);

export const unmergeOrder = (id) =>
  axiosInstance.delete(`/api/Order/${id}/unmerge`);

export const moveOrder = (id, data) =>
  axiosInstance.post(`/api/Order/${id}/move`, data);

// ─── Order Details ────────────────────────────────────────────────────────
export const getOrderDetails = (orderId) =>
  axiosInstance.get(`/api/Order/${orderId}/details`);

export const getOrderDetailById = (orderId, id) =>
  axiosInstance.get(`/api/Order/${orderId}/details/${id}`);

export const createOrderDetail = (orderId, data) =>
  axiosInstance.post(`/api/Order/${orderId}/details`, data);

export const createBulkOrderDetail = (orderId, data) =>
  axiosInstance.post(`/api/Order/${orderId}/details/bulk`, data);

export const updateOrderDetail = (orderId, id, data) =>
  axiosInstance.put(`/api/Order/${orderId}/details/${id}`, data);

export const updateCookingStatus = (orderDetailId, data) =>
  axiosInstance.put(`/api/Order/details/${orderDetailId}/cooking-status`, data);

export const deleteOrderDetail = (orderId, id) =>
  axiosInstance.delete(`/api/Order/${orderId}/details/${id}`);

export const cancelOrder = (id) =>
  axiosInstance.put(`/api/Order/${id}/cancel`);

export const cancelOrderDetail = (id) =>
  axiosInstance.put(`/api/Order/details/${id}/cancel`);
