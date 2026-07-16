import axiosInstance from './axiosInstance';

export const getAllUnits = () =>
  axiosInstance.get('/api/Unit');
