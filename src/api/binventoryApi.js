import axiosInstance from './axiosInstance';

export const getBInventories = async (branchId, search = '', docType = '', mode = null) => {
  const response = await axiosInstance.get(`/api/BInventory/branch/${branchId}`, {
    params: {
      search: search || undefined,
      mode: mode !== null && mode !== undefined ? mode : undefined
    }
  });
  return response.data;
};

export const getBInventoryDetail = async (id) => {
  const response = await axiosInstance.get(`/api/BInventory/detail/${id}`);
  return response.data;
};

export const getBInventoryLedger = async (binventoryId, page = 1, pageSize = 20) => {
  const response = await axiosInstance.get(
    `/api/BInventory/${binventoryId}/ledger?page=${page}&pageSize=${pageSize}`
  );
  return response.data;
};

export const getProductsByDate = async (branchId, date, search = '', productType = null, mode = null) => {
  const response = await axiosInstance.get(
    `/api/BInventory/branch/${branchId}/products-by-date`,
    {
      params: {
        date: date ? new Date(date).toISOString() : undefined,
        search: search || undefined,
        productType: productType || undefined,
        mode: mode || undefined
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

export const getConsumptionReport = async (branchId, startDate, endDate) => {
  const response = await axiosInstance.get(`/api/BInventory/branch/${branchId}/consumption-report`, {
    params: {
      startDate: startDate ? startDate.toISOString() : undefined,
      endDate: endDate ? endDate.toISOString() : undefined,
    }
  });
  return response.data;
};

export const getTransactionLedger = async (branchId, startDate, endDate) => {
  const response = await axiosInstance.get(`/api/BInventory/branch/${branchId}/transaction-ledger`, {
    params: {
      startDate: startDate ? startDate.toISOString() : undefined,
      endDate: endDate ? endDate.toISOString() : undefined,
    }
  });
  return response.data;
};
