import axiosInstance from './axiosInstance';

// Helper validator for mandatory branchId
const validateBranchId = (branchId) => {
  if (!branchId || branchId <= 0) {
    console.warn('[documentApi] Dừng thao tác: Thiếu branchId hợp lệ.', branchId);
    return false;
  }
  return true;
};

// ==========================================
// 1. IMPORT DOCUMENT (Type 1)
// ==========================================
export const getImportDocuments = async (branchId) => {
  if (!validateBranchId(branchId)) return [];
  const response = await axiosInstance.get('/api/Document/import', { params: { branchId } });
  return response.data;
};

export const createImportDocument = async (dto) => {
  const response = await axiosInstance.post('/api/Document/import', dto);
  return response.data;
};

export const deleteImportDocument = async (id) => {
  const response = await axiosInstance.delete(`/api/Document/import/${id}`);
  return response.data;
};

// ==========================================
// 2. EXPORT DELETE DOCUMENT (Type 2)
// ==========================================
export const getExportDeleteDocuments = async (branchId) => {
  if (!validateBranchId(branchId)) return [];
  const response = await axiosInstance.get('/api/Document/export-delete', { params: { branchId } });
  return response.data;
};

export const createExportDeleteDocument = async (dto) => {
  const response = await axiosInstance.post('/api/Document/export-delete', dto);
  return response.data;
};

export const deleteExportDeleteDocument = async (id) => {
  const response = await axiosInstance.delete(`/api/Document/export-delete/${id}`);
  return response.data;
};

// ==========================================
// 3. TRANSFER DOCUMENT (Type 3 & 7)
// ==========================================
export const getTransferDocuments = async (branchId) => {
  if (!validateBranchId(branchId)) return [];
  const response = await axiosInstance.get('/api/Document/transfer', { params: { branchId } });
  return response.data;
};

export const getReceiveTransferDocuments = async (branchId) => {
  if (!validateBranchId(branchId)) return [];
  const response = await axiosInstance.get('/api/Document/transfer/receive', { params: { branchId } });
  return response.data;
};

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

// ==========================================
// 4. RETURN DOCUMENT (Type 4)
// ==========================================
export const getReturnDocuments = async (branchId) => {
  if (!validateBranchId(branchId)) return [];
  const response = await axiosInstance.get('/api/Document/return', { params: { branchId } });
  return response.data;
};

export const getReturnDocumentById = async (id) => {
  if (!id || id <= 0) return null;
  const response = await axiosInstance.get(`/api/Document/return/${id}`);
  return response.data;
};

export const createReturnDocument = async (dto) => {
  const response = await axiosInstance.post('/api/Document/return', dto);
  return response.data;
};

export const deleteReturnDocument = async (id) => {
  const response = await axiosInstance.delete(`/api/Document/return/${id}`);
  return response.data;
};

// ==========================================
// 5. CHECK DOCUMENT (Type 5)
// ==========================================
export const getCheckDocuments = async (branchId) => {
  if (!validateBranchId(branchId)) return [];
  const response = await axiosInstance.get('/api/Document/check', { params: { branchId } });
  return response.data;
};

export const createCheckDocument = async (dto) => {
  const response = await axiosInstance.post('/api/Document/check', dto);
  return response.data;
};

export const deleteCheckDocument = async (id) => {
  const response = await axiosInstance.delete(`/api/Document/check/${id}`);
  return response.data;
};

// ==========================================
// 6. PRODUCTION DOCUMENT (Type 6)
// ==========================================
export const getProductionDocuments = async (branchId) => {
  if (!validateBranchId(branchId)) return [];
  const response = await axiosInstance.get('/api/Document/production', { params: { branchId } });
  return response.data;
};

export const createProductionDocument = async (dto) => {
  const response = await axiosInstance.post('/api/Document/production', dto);
  return response.data;
};

export const deleteProductionDocument = async (id) => {
  const response = await axiosInstance.delete(`/api/Document/production/${id}`);
  return response.data;
};

// ==========================================
// GENERIC DOCUMENT ENDPOINTS
// ==========================================
export const deleteDocument = async (id) => {
  const response = await axiosInstance.delete(`/api/Document/${id}`);
  return response.data;
};

export const getDocuments = async (branchId, type) => {
  if (!validateBranchId(branchId)) return [];
  const response = await axiosInstance.get('/api/Document', {
    params: { branchId, type }
  });
  return response.data;
};

export const getDocumentById = async (id) => {
  if (!id || id <= 0) return null;
  const response = await axiosInstance.get(`/api/Document/${id}`);
  return response.data;
};
