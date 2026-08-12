import axiosInstance from './axiosInstance';

export const getAllWorkSchedules = () =>
  axiosInstance.get('/api/WorkSchedule');

export const getWorkScheduleById = (id) =>
  axiosInstance.get(`/api/WorkSchedule/${id}`);

export const createWorkSchedule = (data) =>
  axiosInstance.post('/api/WorkSchedule', data);

export const updateWorkSchedule = (data) =>
  axiosInstance.put('/api/WorkSchedule', data);

export const deleteWorkSchedule = (id) =>
  axiosInstance.delete(`/api/WorkSchedule/${id}`);

export const assignWorkSchedules = (data) =>
  axiosInstance.post('/api/WorkSchedule/assign', data);

export const getMyWorkSchedules = () =>
  axiosInstance.get('/api/WorkSchedule/mine');

export const requestLeave = (data) =>
  axiosInstance.post('/api/WorkSchedule/leave-request', data);

export const requestShiftSwap = (data) =>
  axiosInstance.post('/api/WorkSchedule/shift-swap', data);

