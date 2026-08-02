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

// Specialized Product APIs
export const createProcessedProduct = (data) =>
  axiosInstance.post('/api/ProcessedProduct', data);
export const updateProcessedProduct = (data) =>
  axiosInstance.put('/api/ProcessedProduct', data);

export const createManufacturedProduct = (data) =>
  axiosInstance.post('/api/ManufacturedProduct', data);
export const updateManufacturedProduct = (data) =>
  axiosInstance.put('/api/ManufacturedProduct', data);

export const createRegularProduct = (data) =>
  axiosInstance.post('/api/RegularProduct', data);
export const updateRegularProduct = (data) =>
  axiosInstance.put('/api/RegularProduct', data);

export const createIngredientProduct = (data) =>
  axiosInstance.post('/api/IngredientProduct', data);
export const updateIngredientProduct = (data) =>
  axiosInstance.put('/api/IngredientProduct', data);

export const createToolProduct = (data) =>
  axiosInstance.post('/api/ToolProduct', data);
export const updateToolProduct = (data) =>
  axiosInstance.put('/api/ToolProduct', data);
