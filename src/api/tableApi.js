import axiosInstance from './axiosInstance';

export const getAllTables = () =>
  axiosInstance.get('/api/Table');

export const getTableById = (id) =>
  axiosInstance.get(`/api/Table/${id}`);

export const createTable = (data) =>
  axiosInstance.post('/api/Table', data);

export const updateTable = (data) =>
  axiosInstance.put('/api/Table', data);

export const deleteTable = (id) =>
  axiosInstance.delete(`/api/Table/${id}`);
