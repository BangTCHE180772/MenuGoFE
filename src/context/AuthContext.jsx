import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { login as loginApi, logout as logoutApi, getProfile } from '../api/authApi';

// ─── Danh sách roles ───────────────────────────────────────────────────────
export const ROLES = {
  ADMIN: 'Admin',
  OWNER: 'Owner',
  MANAGER: 'Manager',
  CASHIER: 'Cashier',
  CHEF: 'Chef',
  WAITER: 'Waiter',
};

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    // Khởi tạo user từ localStorage nếu có (để không bị mất khi refresh trang)
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('access_token'));
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!token;
  // BE trả về user.roles (mảng), lấy phần tử đầu làm role chính
  const roles = user?.roles ?? [];
  const role = roles.length > 0 ? roles[0] : null;

  /**
   * Kiểm tra user có role được phép không
   * @param {...string} allowedRoles - Danh sách roles cho phép
   */
  const hasRole = useCallback((...allowedRoles) =>
    roles.some(r => allowedRoles.includes(r)), [roles]);

  // Khi app khởi động: kiểm tra token còn hợp lệ không
  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          // TODO: Bỏ comment dòng dưới khi BE có endpoint /api/auth/profile
          // const res = await getProfile();
          // setUser(res.data);
          // localStorage.setItem('user', JSON.stringify(res.data));
        } catch {
          // Token không hợp lệ → đăng xuất
          localStorage.removeItem('access_token');
          localStorage.removeItem('user');
          setToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    };
    initAuth();
  }, []);

  /**
   * Lưu Token sau khi hoàn tất đăng nhập/2FA
   */
  const setAuth = (newToken, userData) => {
    localStorage.setItem('access_token', newToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
  };

  /**
   * Đăng xuất
   */
  const logout = async () => {
    try {
      await logoutApi();
    } catch {
      // Bỏ qua lỗi khi logout (token đã hết hạn, ...)
    }
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    localStorage.removeItem('activeShiftBranchId');
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    role,
    roles,
    isAuthenticated,
    isLoading,
    setAuth,
    logout,
    hasRole,
    ROLES,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth phải được dùng bên trong <AuthProvider>');
  }
  return context;
};
