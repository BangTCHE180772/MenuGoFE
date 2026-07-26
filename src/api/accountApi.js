import axiosInstance from './axiosInstance';

export const getAccountById = (id) =>
  axiosInstance.get(`/api/Account/${id}`);

export const createAccount = (data) =>
  axiosInstance.post('/api/Account', data);

export const updateAccount = (data) =>
  axiosInstance.put('/api/Account', data);

export const deleteAccount = (id) =>
  axiosInstance.delete(`/api/Account/${id}`);

export const getRoleRange = (branchId) =>
  axiosInstance.get('/api/Account/exclude-roles', {
    params: branchId ? { branchId } : {},
  });

export const getManagerAccounts = () =>
  axiosInstance.get('/api/Account/managers');
