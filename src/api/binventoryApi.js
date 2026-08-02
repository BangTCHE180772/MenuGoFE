import axiosInstance from './axiosInstance';

export const getBInventories = async (branchId, search = '', docType = '', mode = null) => {
  try {
    const response = await axiosInstance.get(`/api/BInventory/${branchId}`);
    if (Array.isArray(response.data) && response.data.length > 0) {
      return response.data;
    }
  } catch (e) {
    console.warn('Fallback to branch query endpoint:', e);
  }

  const response = await axiosInstance.get(
    `/api/BInventory/branch/${branchId}?search=${encodeURIComponent(search || '')}`
  );
  return response.data;
};

export const getBInventoryLedger = async (binventoryId, page = 1, pageSize = 20) => {
  const response = await axiosInstance.get(
    `/api/BInventory/${binventoryId}/ledger?page=${page}&pageSize=${pageSize}`
  );
  return response.data;
};

export const getProductsByDate = async (branchId, date, search = '', productType = null) => {
  const response = await axiosInstance.get(
    `/api/BInventory/branch/${branchId}/products-by-date`,
    {
      params: {
        date: date ? new Date(date).toISOString() : undefined,
        search,
        productType: productType || undefined
      }
    }
  );
  return response.data;
};

export const getPreviousLedgerSnapshots = async (date, bInventoryIds = []) => {
  const response = await axiosInstance.post(`/api/BInventory/ledger-previous`, {
    date: date ? new Date(date).toISOString() : new Date().toISOString(),
    bInventoryIds
  });
  return response.data;
};
