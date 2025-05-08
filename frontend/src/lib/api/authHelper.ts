import axios, { AxiosError } from 'axios';
import { API_ENDPOINTS } from './endpoints';

interface RefreshResponse {
  accessToken: string;
  message: string;
}

// Biến để theo dõi trạng thái refresh
let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];
let refreshPromise: Promise<string> | null = null;
let refreshFailedSubscribers: Array<(error: Error) => void> = [];

// Timeout và retry settings
const REFRESH_TIMEOUT = 15000; // 15 seconds
const MAX_REFRESH_RETRIES = 2;
let currentRetryCount = 0;

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
    // Sử dụng promise đã tồn tại nếu đang refresh
    if (refreshPromise) {
      return refreshPromise;
    }

    // Tạo promise mới cho quá trình refresh
    refreshPromise = (async () => {
      try {
        // Tạo controller để có thể hủy request nếu timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), REFRESH_TIMEOUT);

        // Gọi API refresh token, không cần gửi refresh token (vì backend đọc từ cookie)
        const response = await axios.post<RefreshResponse>(
          refreshTokenEndpoint, 
          {}, 
          {
            withCredentials: true,
            signal: controller.signal
          }
        );
        
        clearTimeout(timeoutId);
        currentRetryCount = 0; // Reset retry counter on success
        
        // Trả về access token mới
        return response.data.accessToken;
      } catch (error) {
        // Retry logic
        if (currentRetryCount < MAX_REFRESH_RETRIES) {
          currentRetryCount++;
          console.log(`Retry refreshing token attempt ${currentRetryCount}/${MAX_REFRESH_RETRIES}`);
          
          // Clear the promise so we can create a new one
          refreshPromise = null;
          // Retry with exponential backoff
          await new Promise(resolve => setTimeout(resolve, 1000 * currentRetryCount));
          return refreshAccessToken();
        }
        
        // Reset retry counter after max retries
        currentRetryCount = 0;
        
        // Notify all failure subscribers
        notifyFailureSubscribers(error instanceof Error ? error : new Error('Token refresh failed'));
        throw error;
      } finally {
        // Clear the promise reference when done
        refreshPromise = null;
      }
    })();

    return refreshPromise;
  } catch (error) {
    const axiosError = error as AxiosError;
    const errorMessage = axiosError.response?.status === 401 
      ? 'Phiên đăng nhập đã hết hạn'
      : `Không thể refresh token: ${axiosError.message}`;
    
    console.error(errorMessage, axiosError);
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
 * @param error Lỗi xảy ra
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
 * Cập nhật trạng thái refresh
 */
export const setRefreshingStatus = (status: boolean): void => {
  isRefreshing = status;
};

/**
 * Xóa tất cả subscribers và reset trạng thái
 * Sử dụng khi logout hoặc clear auth state
 */
export const clearAuthHelperState = (): void => {
  refreshSubscribers = [];
  refreshFailedSubscribers = [];
  isRefreshing = false;
  refreshPromise = null;
  currentRetryCount = 0;
}; 