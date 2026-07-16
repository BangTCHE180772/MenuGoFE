import axiosInstance from './axiosInstance';

export const getAllShifts = () =>
  axiosInstance.get('/api/Shift');
