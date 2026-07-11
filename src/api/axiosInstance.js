import axios from 'axios';

const BASE_URL = 'http://localhost:5067';

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// ─── Request Interceptor ───────────────────────────────────────────────────
// Tự động đính kèm JWT token vào mỗi request
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor ──────────────────────────────────────────────────
// Xử lý lỗi toàn cục: 401 → xóa token → về trang login
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const token = localStorage.getItem('access_token');
      // Chỉ redirect về login nếu user đang có token (tức là token hết hạn/không hợp lệ)
      // Tránh redirect vòng lặp khi user không đăng nhập gọi API public
      if (token) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
