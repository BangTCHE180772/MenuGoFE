import axiosInstance from './axiosInstance';

export const createPaymentLink = async (orderId) => {
    const response = await axiosInstance.post(`/api/Payment/create-payment-link/${orderId}`);
    return response.data;
};

export const checkPaymentStatus = async (orderId) => {
    const response = await axiosInstance.get(`/api/Payment/check-payment/${orderId}`);
    return response.data;
};
