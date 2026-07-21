import axiosInstance from './axiosInstance';

export const getAllAccounts = () =>
  axiosInstance.get('/api/Account/role-range');

export const getAccountById = (id) =>
  axiosInstance.get(`/api/Account/${id}`);

export const createAccount = (data) =>
  axiosInstance.post('/api/Account', data);

export const updateAccount = (data) =>
  axiosInstance.put('/api/Account', data);

export const deleteAccount = (id) =>
  axiosInstance.delete(`/api/Account/${id}`);

export const getRoleRange = () =>
  axiosInstance.get('/api/Account/role-range');
