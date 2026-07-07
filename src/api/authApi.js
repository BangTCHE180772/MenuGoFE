import axiosInstance from './axiosInstance';

// ─── TODO: BE chưa có các endpoint này ────────────────────────────────────
// Khi BE hoàn thiện auth, chỉ cần sửa URL tại đây, không đụng đến file khác.

/**
 * Đăng nhập
 * @param {{ email: string, password: string }} credentials
 * @returns {{ token: string, user: { id, name, email, role } }}
 */
export const login = (credentials) =>
  axiosInstance.post('/api/auth/login', credentials);

/**
 * Đăng xuất
 */
export const logout = () =>
  axiosInstance.post('/api/auth/logout');

/**
 * Lấy thông tin user đang đăng nhập (từ token)
 */
export const getProfile = () =>
  axiosInstance.get('/api/auth/profile');

/**
 * Lấy danh sách roles trong hệ thống
 */
export const getRoleRange = () =>
  axiosInstance.get('/api/Account/role-range');
