import axiosInstance from './axiosInstance';

export const getTableOrderSummary = (tableId) =>
  axiosInstance.get(`/api/Order/by-table/${tableId}`);

export const confirmOrderItem = (orderDetailId) =>
  axiosInstance.put(`/api/Order/details/${orderDetailId}/confirm`);

export const updateCookingStatus = (orderDetailId, status) =>
  axiosInstance.put(`/api/Order/details/${orderDetailId}/cooking-status`, { cookingStatus: status });
