import axiosInstance from './axiosInstance';

export const getLeftoverRecordsByBranch = (branchId, params = {}) =>
  axiosInstance.get(`/api/LeftoverRecord/branch/${branchId}`, { params });

export const createLeftoverRecord = (data) =>
  axiosInstance.post('/api/LeftoverRecord', data);

export const deleteLeftoverRecord = (id) =>
  axiosInstance.delete(`/api/LeftoverRecord/${id}`);
