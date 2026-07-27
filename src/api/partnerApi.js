import axiosInstance from './axiosInstance';

export const getSuppliers = async (branchId) => {
  const response = await axiosInstance.get(`/api/Partner/suppliers?branchId=${branchId}`);
  return response.data;
};
