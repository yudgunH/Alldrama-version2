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
const MIN_REFRESH_INTERVAL = 2000; // Reduced from 5s to 2s - less strict

// Rate limiting settings - more lenient since backend handles login rate limiting
const MAX_REFRESH_ATTEMPTS = process.env.NODE_ENV === 'development' ? 10 : 5; // Increased limits
const RATE_LIMIT_WINDOW = process.env.NODE_ENV === 'development' ? 30000 : 60000; // 30s dev, 60s prod
let refreshAttempts: number[] = [];

/**
 * Kiểm tra và xử lý rate limiting cho refresh token
 * Optimized for better UX since backend already handles auth rate limiting
 */
const checkRateLimit = (): boolean => {
  const now = Date.now();
  
  // Xóa các attempts cũ
  refreshAttempts = refreshAttempts.filter(time => now - time < RATE_LIMIT_WINDOW);
  
  // Kiểm tra số lần refresh trong window
  if (refreshAttempts.length >= MAX_REFRESH_ATTEMPTS) {
    const oldestAttempt = refreshAttempts[0];
    const waitTime = RATE_LIMIT_WINDOW - (now - oldestAttempt);
    
    if (waitTime > 0) {
      console.warn(`Refresh rate limit exceeded. Please wait ${Math.ceil(waitTime/1000)} seconds before trying again.`);
      return false;
    }
  }
  
  // Thêm attempt mới
  refreshAttempts.push(now);
  return true;
};

/**
 * Reset rate limit manually - useful for development and testing
 */
export const resetRefreshRateLimit = (): void => {
  refreshAttempts = [];
  console.log('Refresh token rate limit has been reset');
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
      throw new Error('Refresh rate limit exceeded. Please try again later.');
    }

    // Kiểm tra thời gian từ lần refresh cuối - reduced interval
    const now = Date.now();
    if (now - lastRefreshTime < MIN_REFRESH_INTERVAL) {
      // Nếu vừa refresh gần đây, đợi một chút
      await new Promise(resolve => setTimeout(resolve, MIN_REFRESH_INTERVAL - (now - lastRefreshTime)));
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