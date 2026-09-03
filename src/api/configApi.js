import axiosInstance from './axiosInstance';

export const configApi = {
    getPointSystemConfig: async () => {
        const response = await axiosInstance.get('/Config/point-system');
        return response.data;
    }
};
