import axiosInstance from './axiosInstance';

// Import Document (1)
export const createImportDocument = async (dto) => {
  const response = await axiosInstance.post('/api/Document/import', dto);
  return response.data;
};

export const deleteImportDocument = async (id) => {
  const response = await axiosInstance.delete(`/api/Document/import/${id}`);
  return response.data;
};

// Export Delete Document (2)
export const createExportDeleteDocument = async (dto) => {
  const response = await axiosInstance.post('/api/Document/export-delete', dto);
  return response.data;
};

export const deleteExportDeleteDocument = async (id) => {
  const response = await axiosInstance.delete(`/api/Document/export-delete/${id}`);
  return response.data;
};

// Transfer Document (3)
export const createTransferDocument = async (dto) => {
  const response = await axiosInstance.post('/api/Document/transfer', dto);
  return response.data;
};

export const receiveTransferDocument = async (dto) => {
  const response = await axiosInstance.post('/api/Document/transfer/receive', dto);
  return response.data;
};

export const deleteTransferDocument = async (id) => {
  const response = await axiosInstance.delete(`/api/Document/transfer/${id}`);
  return response.data;
};

// Return Document (4)
export const createReturnDocument = async (dto) => {
  const response = await axiosInstance.post('/api/Document/return', dto);
  return response.data;
};

export const deleteReturnDocument = async (id) => {
  const response = await axiosInstance.delete(`/api/Document/return/${id}`);
  return response.data;
};

// Check Document (5)
export const createCheckDocument = async (dto) => {
  const response = await axiosInstance.post('/api/Document/check', dto);
  return response.data;
};

export const deleteCheckDocument = async (id) => {
  const response = await axiosInstance.delete(`/api/Document/check/${id}`);
  return response.data;
};

// Production Document (6)
export const createProductionDocument = async (dto) => {
  const response = await axiosInstance.post('/api/Document/production', dto);
  return response.data;
};

export const deleteProductionDocument = async (id) => {
  const response = await axiosInstance.delete(`/api/Document/production/${id}`);
  return response.data;
};

// Generic Delete
export const deleteDocument = async (id) => {
  const response = await axiosInstance.delete(`/api/Document/${id}`);
  return response.data;
};

// Get Documents
export const getDocuments = async (branchId, type) => {
  const response = await axiosInstance.get('/api/Document', {
    params: { branchId, type }
  });
  return response.data;
};
