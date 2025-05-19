import axios, { AxiosError } from 'axios';
import { API_ENDPOINTS } from './endpoints';

interface RefreshResponse {
  accessToken: string;
  message: string;
}

// Biến để theo dõi trạng thái refresh
let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];
let refreshFailedSubscribers: Array<(error: Error) => void> = [];
let refreshPromise: Promise<string> | null = null;
let lastRefreshTime = 0;

// Timeout setting
const REFRESH_TIMEOUT = 15000; // 15 seconds
const MIN_REFRESH_INTERVAL = 5000; // 5 seconds

// Rate limiting settings
const MAX_REFRESH_ATTEMPTS = 3;
const RATE_LIMIT_WINDOW = 60000; // 1 minute
let refreshAttempts: number[] = [];

/**
 * Kiểm tra và xử lý rate limiting cho refresh token
 */
const checkRateLimit = (): boolean => {
  const now = Date.now();
  
  // Xóa các attempts cũ hơn 1 phút
  refreshAttempts = refreshAttempts.filter(time => now - time < RATE_LIMIT_WINDOW);
  
  // Kiểm tra số lần refresh trong 1 phút
  if (refreshAttempts.length >= MAX_REFRESH_ATTEMPTS) {
    const oldestAttempt = refreshAttempts[0];
    const waitTime = RATE_LIMIT_WINDOW - (now - oldestAttempt);
    
    if (waitTime > 0) {
      console.warn(`Rate limit exceeded. Please wait ${Math.ceil(waitTime/1000)} seconds before trying again.`);
      return false;
    }
  }
  
  // Thêm attempt mới
  refreshAttempts.push(now);
  return true;
};

/**
 * Endpoint refresh token - Backend sẽ tự lấy refresh token từ HTTP-Only cookie
 */
export const refreshTokenEndpoint = API_ENDPOINTS.AUTH.REFRESH;

/**
 * Thực hiện gọi API refresh token
 * Backend sẽ đọc refresh token từ HTTP-Only cookie và cấp access token mới
 */
export const refreshAccessToken = async (): Promise<string> => {
  try {
    // Kiểm tra rate limit
    if (!checkRateLimit()) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }

    // Kiểm tra thời gian từ lần refresh cuối
    const now = Date.now();
    if (now - lastRefreshTime < MIN_REFRESH_INTERVAL) {
      // Nếu vừa refresh gần đây, đợi một chút
      await new Promise(resolve => setTimeout(resolve, MIN_REFRESH_INTERVAL));
    }

    // Sử dụng promise đã tồn tại nếu đang refresh
    if (refreshPromise) {
      return refreshPromise;
    }

    // Đánh dấu đang refresh
    isRefreshing = true;
    lastRefreshTime = now;

    // Tạo promise mới cho quá trình refresh
    refreshPromise = (async () => {
      try {
        // Tạo controller để có thể hủy request nếu timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), REFRESH_TIMEOUT);

        // Gọi API refresh token
        const response = await axios.post<RefreshResponse>(
          refreshTokenEndpoint, 
          {}, 
          {
            withCredentials: true,
            signal: controller.signal
          }
        );
        
        clearTimeout(timeoutId);
        
        // Thông báo cho các subscribers
        notifySubscribers(response.data.accessToken);
        
        // Trả về access token mới
        return response.data.accessToken;
      } catch (error) {
        // Thông báo lỗi cho các subscribers
        notifyFailureSubscribers(error instanceof Error ? error : new Error('Token refresh failed'));
        throw error;
      } finally {
        // Reset trạng thái
        isRefreshing = false;
        refreshPromise = null;
      }
    })();

    return refreshPromise;
  } catch (error) {
    const errorMessage = error instanceof AxiosError && error.response?.status === 401 
      ? 'Phiên đăng nhập đã hết hạn'
      : `Không thể refresh token: ${error instanceof Error ? error.message : 'Unknown error'}`;
    
    console.error(errorMessage);
    throw new Error(errorMessage);
  }
};

/**
 * Đăng ký một callback để thực thi sau khi refresh token thành công
 * @param callback Function sẽ được gọi với access token mới
 */
export const onTokenRefreshed = (callback: (token: string) => void): void => {
  refreshSubscribers.push(callback);
};

/**
 * Đăng ký một callback để thực thi khi refresh token thất bại
 * @param callback Function sẽ được gọi với lỗi
 */
export const onTokenRefreshFailed = (callback: (error: Error) => void): void => {
  refreshFailedSubscribers.push(callback);
};

/**
 * Thông báo cho tất cả subscribers về token mới
 * @param token Access token mới
 */
export const notifySubscribers = (token: string): void => {
  refreshSubscribers.forEach(callback => callback(token));
  refreshSubscribers = [];
};

/**
 * Thông báo cho tất cả subscribers về lỗi refresh token
 * @param error Lỗi khi refresh token
 */
export const notifyFailureSubscribers = (error: Error): void => {
  refreshFailedSubscribers.forEach(callback => callback(error));
  refreshFailedSubscribers = [];
};

/**
 * Lấy trạng thái refresh hiện tại
 */
export const getRefreshingStatus = (): boolean => {
  return isRefreshing;
};

/**
 * Xóa trạng thái refresh
 */
export const clearAuthHelperState = (): void => {
  isRefreshing = false;
  refreshPromise = null;
  refreshSubscribers = [];
  refreshFailedSubscribers = [];
  lastRefreshTime = 0;
}; 