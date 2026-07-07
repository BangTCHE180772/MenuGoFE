import axiosInstance from './axiosInstance';

// ─── TODO: BE chưa có các endpoint này ────────────────────────────────────
// Cần thêm vào BE khi implement tính năng cấp quyền thiết bị

/**
 * Manager cấp quyền cho thiết bị hiện tại
 * @returns {{ deviceToken: string }}
 */
export const authorizeDevice = () =>
  axiosInstance.post('/api/device/authorize');

/**
 * Kiểm tra device_token có còn hợp lệ không
 * @param {string} token
 */
export const validateDevice = (token) =>
  axiosInstance.post('/api/device/validate', { token });

/**
 * Thu hồi quyền của thiết bị
 * @param {string} token
 */
export const revokeDevice = (token) =>
  axiosInstance.post('/api/device/revoke', { token });
