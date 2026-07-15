import axiosInstance from './axiosInstance';

export const getReservations = async () => {
  const response = await axiosInstance.get('/api/Reservation');
  return response.data;
};

export const createReservation = async (data) => {
  const response = await axiosInstance.post('/api/Reservation', data);
  return response.data;
};

export const checkInReservation = async (id) => {
  const response = await axiosInstance.put(`/api/Reservation/${id}/check-in`);
  return response.data;
};

export const cancelReservation = async (id) => {
  const response = await axiosInstance.put(`/api/Reservation/${id}/cancel`);
  return response.data;
};

export const searchCustomersOData = async (phoneStr) => {
  const response = await axiosInstance.get(`/odata/Customer?$filter=contains(Phone, '${phoneStr}')&$top=5`);
  return response.data;
};
