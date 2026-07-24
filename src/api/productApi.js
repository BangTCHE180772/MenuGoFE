import axiosInstance from './axiosInstance';

export const getAllProducts = (type) => {
  const url = type ? `/api/Product?type=${type}` : '/api/Product';
  return axiosInstance.get(url);
};

export const getProductById = (id, type) => {
  const url = type ? `/api/Product/${id}?type=${type}` : `/api/Product/${id}`;
  return axiosInstance.get(url);
};

export const createProduct = (data) =>
  axiosInstance.post('/api/Product', data);

export const updateProduct = (data) =>
  axiosInstance.put('/api/Product', data);

export const deleteProduct = (id) =>
  axiosInstance.delete(`/api/Product/${id}`);
