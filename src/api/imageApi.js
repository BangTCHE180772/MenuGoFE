import axiosInstance from './axiosInstance';

export const getAllImages = () =>
  axiosInstance.get('/api/Image');

export const createImage = (data) =>
  axiosInstance.post('/api/Image', data);
