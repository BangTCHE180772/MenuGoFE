import axiosInstance from './axiosInstance';

// ─── Menu ────────────────────────────────────────────────────────────────────
export const getAllMenus = () =>
  axiosInstance.get('/api/Menu');

export const getMenuById = (id) =>
  axiosInstance.get(`/api/Menu/${id}`);

export const getMenuProducts = (menuId) =>
  axiosInstance.get(`/api/Menu/${menuId}/products`);
