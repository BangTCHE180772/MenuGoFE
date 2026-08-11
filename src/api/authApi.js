import axiosInstance from './axiosInstance';

// ─── TODO: BE chưa có các endpoint này ────────────────────────────────────
// Khi BE hoàn thiện auth, chỉ cần sửa URL tại đây, không đụng đến file khác.

/**
 * Đăng nhập
 * @param {{ email: string, password: string }} credentials
 * @returns {{ token: string, user: { id, name, email, role } }}
 */
export const login = (credentials) =>
  axiosInstance.post('/api/Auth/login', credentials);

export const setup2FA = (accountId) =>
  axiosInstance.post('/api/Auth/setup-2fa', { accountId });

export const confirmSetup2FA = (data) =>
  axiosInstance.post('/api/Auth/confirm-setup-2fa', data);

export const verify2FA = (data) =>
  axiosInstance.post('/api/Auth/verify-2fa', data);

/**
 * Đăng xuất
 */
export const logout = () =>
  axiosInstance.post('/api/Auth/logout');

/**
 * Lấy thông tin user đang đăng nhập (từ token)
 */
export const getProfile = () =>
  axiosInstance.get('/api/Auth/profile');

/**
 * Lấy danh sách roles trong hệ thống
 */
export const getRoleRange = (branchId) =>
  axiosInstance.get('/api/Account/exclude-roles', { params: { branchId } });

/**
 * Quên mật khẩu & Reset password
 */
export const forgotPassword = (email) =>
  axiosInstance.post('/api/Auth/forgot-password', { email });

export const verifyResetOtp = (data) =>
  axiosInstance.post('/api/Auth/verify-reset-otp', data);

export const resetPassword = (data) =>
  axiosInstance.post('/api/Auth/reset-password', data);
