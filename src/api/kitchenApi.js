import axiosInstance from './axiosInstance';

/**
 * Lấy tất cả món ăn cần chế biến cho KDS (Kitchen Display System)
 */
export const getKitchenItems = () =>
  axiosInstance.get('/api/Order/kitchen-items');

/**
 * Cập nhật trạng thái chế biến (Waiting -> Accepted -> Cooking -> Ready/Done)
 */
export const updateCookingStatus = (detailId, cookingStatus) =>
  axiosInstance.put(`/api/Order/details/${detailId}/cooking-status`, { cookingStatus });

/**
 * Cập nhật trạng thái cho nhiều món cùng lúc (hỗ trợ Batch Processing - AF1)
 */
export const batchUpdateCookingStatus = async (detailIds, cookingStatus) => {
  const results = [];
  for (const id of detailIds) {
    results.push(await updateCookingStatus(id, cookingStatus));
  }
  return results;
};

/**
 * Hủy món ăn chi tiết từ KDS
 */
export const cancelOrderDetail = (detailId) =>
  axiosInstance.put(`/api/Order/details/${detailId}/cancel`);

/**
 * Gửi yêu cầu bếp (nước chấm, v.v.)
 */
export const requestRestock = (data) =>
  axiosInstance.post('/api/Kitchen/request-restock', data);
