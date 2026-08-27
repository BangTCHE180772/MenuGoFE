import axiosInstance from './axiosInstance';

export const getAllKitchenStations = () =>
  axiosInstance.get('/api/KitchenStation');

export const getKitchenStationsByBranchId = (branchId) =>
  axiosInstance.get(`/api/KitchenStation/branch/${branchId}`);

export const getKitchenStationById = (id) =>
  axiosInstance.get(`/api/KitchenStation/${id}`);

export const createKitchenStation = (data) =>
  axiosInstance.post('/api/KitchenStation', data);

export const updateKitchenStation = (data) =>
  axiosInstance.put('/api/KitchenStation', data);

export const deleteKitchenStation = (id) =>
  axiosInstance.delete(`/api/KitchenStation/${id}`);
