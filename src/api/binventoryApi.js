import axiosInstance from './axiosInstance';

export const getBInventories = async (branchId, search = '', docType = 'IMPORT', mode = 1) => {
  const response = await axiosInstance.get(
    `/api/BInventory/branch/${branchId}?search=${encodeURIComponent(search)}&docType=${docType}&mode=${mode}`
  );
  return response.data;
};
