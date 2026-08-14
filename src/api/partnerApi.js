import axiosInstance from './axiosInstance';

export const getSuppliers = async (branchId) => {
  const response = await axiosInstance.get(`/api/Partner/suppliers?branchId=${branchId}`);
  return response.data;
};

export const getExtraPartners = async (branchId) => {
  const response = await axiosInstance.get(`/api/Partner/extra-partners?branchId=${branchId}`);
  return response.data;
};

export const getPartnersByBranch = async (branchId, mode = null) => {
  const url = mode != null 
    ? `/api/Partner/branch/${branchId}/mode/${mode}` 
    : `/api/Partner/branch/${branchId}`;
  const response = await axiosInstance.get(url);
  return response.data;
};

export const createPartner = async (partnerData) => {
  const response = await axiosInstance.post('/api/Partner', partnerData);
  return response.data;
};

export const updatePartner = async (id, partnerData) => {
  const response = await axiosInstance.put(`/api/Partner/${id}`, partnerData);
  return response.data;
};

export const deletePartner = async (id) => {
  const response = await axiosInstance.delete(`/api/Partner/${id}`);
  return response.data;
};

