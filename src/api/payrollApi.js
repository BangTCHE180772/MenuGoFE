import axiosInstance from './axiosInstance';

export const getPayrolls = (params) =>
  axiosInstance.get('/api/Payroll', { params });

export const getMyPayrolls = (params) =>
  axiosInstance.get('/api/Payroll/my-payroll', { params });

export const getPayrollById = (id) =>
  axiosInstance.get(`/api/Payroll/${id}`);

export const createPayroll = (data) =>
  axiosInstance.post('/api/Payroll', data);

export const generatePayroll = (data) =>
  axiosInstance.post('/api/Payroll/generate', data);

export const generateBatchPayroll = (data) =>
  axiosInstance.post('/api/Payroll/generate-batch', data);

export const updatePayroll = (data) =>
  axiosInstance.put('/api/Payroll', data);

export const updatePayrollStatus = (id, status, paymentDate) =>
  axiosInstance.patch(`/api/Payroll/${id}/status`, null, {
    params: { status, paymentDate },
  });

export const deletePayroll = (id) =>
  axiosInstance.delete(`/api/Payroll/${id}`);
