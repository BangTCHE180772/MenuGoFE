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
// Xử lý lỗi toàn cục và chuẩn hóa thông điệp lỗi
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    let detailedMessage = '';

    if (error.response?.data) {
      const data = error.response.data;
      // 1. Khớp chuẩn ProblemDetails (trường detail)
      if (data.detail) {
        detailedMessage = data.detail;
      }
      // 2. Khớp lỗi custom cũ (trường message hoặc title)
      else if (data.message) {
        detailedMessage = data.message;
      } else if (data.title) {
        detailedMessage = data.title;
      }
      // 3. Khớp lỗi ModelState validation (trường errors)
      else if (data.errors && typeof data.errors === 'object') {
        const firstErrorList = Object.values(data.errors)[0];
        detailedMessage = Array.isArray(firstErrorList) ? firstErrorList[0] : String(firstErrorList);
      }
    }

    if (detailedMessage) {
      error.message = detailedMessage;
      // Gán vào error.response.data.message để các catch block cũ nhận diện được ngay
      if (error.response.data && typeof error.response.data === 'object') {
        error.response.data.message = detailedMessage;
      }
    } else if (error.response) {
      // 4. Nếu không có thông điệp chi tiết từ Backend, dịch các mã lỗi HTTP phổ biến sang tiếng Việt
      const status = error.response.status;
      let fallbackMsg = '';
      if (status === 400) {
        fallbackMsg = 'Yêu cầu không hợp lệ hoặc dữ liệu sai định dạng (400).';
      } else if (status === 404) {
        fallbackMsg = 'Không tìm thấy tài nguyên hoặc đường dẫn yêu cầu (404).';
      } else if (status === 409) {
        fallbackMsg = 'Dữ liệu bị trùng lặp hoặc xung đột với dữ liệu hiện có (409).';
      } else if (status === 500) {
        fallbackMsg = 'Máy chủ gặp sự cố nội bộ. Vui lòng thử lại sau (500).';
      } else if (status >= 502 && status <= 504) {
        fallbackMsg = 'Không thể kết nối tới máy chủ hoặc máy chủ đang bảo trì (Gateway Error).';
      }

      if (fallbackMsg) {
        error.message = fallbackMsg;
        if (!error.response.data) error.response.data = {};
        if (typeof error.response.data === 'object') {
          error.response.data.message = fallbackMsg;
        }
      }
    }

    // Xử lý lỗi toàn cục: 401 → xóa token → về trang login
    if (error.response?.status === 401) {
      const token = localStorage.getItem('access_token');
      // Chỉ redirect về login nếu user đang có token (tức là token hết hạn/không hợp lệ)
      // Tránh redirect vòng lặp khi user không đăng nhập gọi API public
      if (token) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    } else if (error.response?.status === 403) {
      window.location.href = '/unauthorized';
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
