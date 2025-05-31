import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import { toast } from 'react-hot-toast';
import { ErrorResponse } from '@/types';
import {
  getRefreshingStatus,
  refreshAccessToken,
  onTokenRefreshed,
  onTokenRefreshFailed,
  notifySubscribers,
  clearAuthHelperState
} from './authHelper';
import { useAuthStore } from '@/store/auth';
import { authService } from './services/authService';

// In development, use relative URLs to leverage Next.js API proxy
// In production, can use absolute URLs
const isProduction = process.env.NODE_ENV === 'production';
const API_URL = isProduction 
  ? (process.env.NEXT_PUBLIC_API_URL || 'https://alldramaz.com')
  : '';  // Empty string makes axios use relative URLs

// Log the API URL being used
console.log('API client using baseURL:', API_URL || 'Relative URLs (using Next.js proxy)');

// Mở rộng InternalAxiosRequestConfig để hỗ trợ _retry property
interface ExtendedAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
  _retryCount?: number;
}

class ApiClient {
  private client: AxiosInstance;
  private static instance: ApiClient;
  private readonly MAX_RETRIES = 3;

  private constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 15000, // 15 giây timeout
      withCredentials: true, // Đảm bảo cookies được gửi trong mọi request
    });

    // Thêm interceptors
    this.setupInterceptors();
  }

  public static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient();
    }
    return ApiClient.instance;
  }

  private setupInterceptors(): void {
    // Request interceptor - thêm token cho mỗi request
    this.client.interceptors.request.use(
      (config) => {
        // Kiểm tra xem đang trong quá trình đăng xuất không
        if (typeof window !== 'undefined' && (window as any).isLoggingOut) {
          // Cho phép refresh data requests sau logout
          const isRefreshingAfterLogout = (window as any).isRefreshingAfterLogout;
          
          // Cho phép một số requests cần thiết cho refresh data sau logout
          const allowedDuringLogout = [
            '/movies',
            '/homepage', 
            '/popular',
            '/trending',
            '/newest',
            '/featured'
          ];
          
          const isAllowedRequest = allowedDuringLogout.some(path => 
            config.url?.includes(path) && !config.url?.includes('user')
          );
          
          // Nếu đang refresh data sau logout hoặc là allowed request, cho phép
          if (isRefreshingAfterLogout || isAllowedRequest) {
            // Allow the request
          } else {
            // Nếu request không được phép trong quá trình logout, hủy nó
            const error = new Error('Cancel request because user is logging out');
            return Promise.reject(error);
          }
        }
        
        // Lấy token từ authStore hoặc cookie
        const token = authService.getToken();
        
        // Bỏ qua debug logging với môi trường production
        if (process.env.NODE_ENV !== 'production') {
          console.log(`API Request:`, {
            url: config.url, 
            baseURL: config.baseURL || '(none)',
            fullUrl: config.baseURL ? `${config.baseURL}${config.url}` : config.url,
            hasToken: !!token,
            timestamp: new Date().toISOString()
          });
        }
        
        // Thêm token vào header nếu có
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        return config;
      },
      (error) => {
        console.error('Request error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor - xử lý lỗi chung và refresh token
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as ExtendedAxiosRequestConfig;
        
        if (!originalRequest) {
          console.error('Original request configuration is undefined', error);
          return Promise.reject(error);
        }

        // Xử lý lỗi 429 Too Many Requests
        if (error.response?.status === 429) {
          const retryAfter = error.response.headers['retry-after'];
          const rateLimitRemaining = error.response.headers['ratelimit-remaining'];
          const rateLimitReset = error.response.headers['ratelimit-reset'];
          
          // Tính toán thời gian chờ
          let delay = 5000; // Default 5 seconds
          if (retryAfter) {
            delay = parseInt(retryAfter) * 1000;
          } else if (rateLimitReset) {
            const resetTime = parseInt(rateLimitReset) * 1000;
            delay = Math.max(resetTime - Date.now(), 1000);
          }
          
          // Log thông tin rate limit
          console.warn('Rate limit exceeded:', {
            remaining: rateLimitRemaining,
            reset: rateLimitReset,
            retryAfter: retryAfter,
            delay: delay/1000 + 's'
          });
          
          // Hiển thị thông báo cho user
          toast.error(`Quá nhiều request. Vui lòng thử lại sau ${Math.ceil(delay/1000)} giây.`);
          
          // Đợi thời gian được chỉ định
          await new Promise(resolve => setTimeout(resolve, delay));
          
          // Thử lại request
          return this.client(originalRequest);
        }

        // Khởi tạo số lần retry nếu chưa có
        if (originalRequest._retryCount === undefined) {
          originalRequest._retryCount = 0;
        }
        
        // Xử lý lỗi 401 Unauthorized
        const isUnauthorized = error.response?.status === 401;
        const canRetry = originalRequest._retryCount < this.MAX_RETRIES;
        const isRefreshUrl = originalRequest.url?.includes('/auth/refresh');

        // Skip refresh token attempt if the failing request is the refresh endpoint itself
        if (isUnauthorized && !isRefreshUrl && originalRequest && canRetry) {
          originalRequest._retryCount++;
          
          try {
            // Lưu trữ thời gian hiện tại để tránh race conditions
            const refreshStartTime = Date.now();
            
            // Nếu đang refresh token, đợi quá trình hoàn tất
            if (getRefreshingStatus()) {
              console.log('Another refresh is in progress, waiting...');
              
              try {
                // Đợi token mới từ quá trình refresh đang diễn ra
                const newToken = await Promise.race([
                  new Promise<string>((resolve, reject) => {
                    const timeoutId = setTimeout(() => {
                      reject(new Error('Refresh token timeout'));
                    }, 10000); // 10 second timeout
                    
                    onTokenRefreshed(token => {
                      clearTimeout(timeoutId);
                      resolve(token);
                    });
                    
                    onTokenRefreshFailed(error => {
                      clearTimeout(timeoutId);
                      reject(error);
                    });
                  }),
                  // Additional timeout to prevent hanging indefinitely
                  new Promise<string>((_, reject) => 
                    setTimeout(() => reject(new Error('Global refresh token timeout')), 12000)
                  )
                ]);
                
                // Cập nhật token cho request hiện tại
                if (originalRequest.headers) {
                  originalRequest.headers.Authorization = `Bearer ${newToken}`;
                }
                
                // Thử lại request với token mới
                return this.client(originalRequest);
              } catch (waitError) {
                console.error('Error waiting for token refresh:', waitError);
                // Fall through to refresh attempt if waiting failed
              }
            }
            
            console.log('Attempting to refresh access token...');
            // Nếu chưa refresh, thực hiện refresh token
            // Add timeout to prevent hanging
            const newToken = await Promise.race([
              refreshAccessToken(),
              new Promise<string>((_, reject) => 
                setTimeout(() => reject(new Error('Refresh token operation timeout')), 15000)
              )
            ]);
            
            // Cập nhật token cho request hiện tại
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
            }
            
            // Thử lại request với token mới
            return this.client(originalRequest);
          } catch (refreshError) {
            console.error('Token refresh failed:', refreshError);
            // Xử lý khi refresh token thất bại
            this.handleTokenRefreshFailed();
            return Promise.reject(refreshError);
          }
        }

        // Xử lý các lỗi network hoặc timeout - có thể retry
        if (error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK') {
          if (canRetry) {
            // Thử lại với exponential backoff
            const delay = Math.pow(2, originalRequest._retryCount) * 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
            return this.client(originalRequest);
          }
        }

        // Xử lý các lỗi khác
        const errorResponse = error.response?.data as ErrorResponse;
        
        // Kiểm tra xem đang trong quá trình đăng xuất không
        const isLoggingOut = typeof window !== 'undefined' && (window as any).isLoggingOut;
        const isLoginPage = typeof window !== 'undefined' && window.location.pathname.includes('/login');
        
        // Hiển thị thông báo lỗi (trừ lỗi 401 đã xử lý và trừ khi đang đăng xuất)
        if (!isUnauthorized && !isLoggingOut && !isLoginPage) {
          const errorMessage = errorResponse?.message || 'Đã xảy ra lỗi không xác định';
          toast.error(errorMessage);
        }

        return Promise.reject(error);
      }
    );
  }

  /**
   * Xử lý khi refresh token thất bại (refresh token hết hạn hoặc không hợp lệ)
   */
  private handleTokenRefreshFailed(): void {
    // Xóa token trong store
    useAuthStore.getState().logout();
    
    // Xóa toàn bộ trạng thái auth helper
    clearAuthHelperState();
    
    // Tránh hiển thị nhiều thông báo khi đang trong quá trình đăng xuất
    // Kiểm tra xem đang ở trang login hay không
    if (typeof window !== 'undefined') {
      // Nếu đang ở trang login hoặc đang chuyển hướng đến trang login, không hiển thị thông báo
      if (window.location.pathname.includes('/login')) {
        return;
      }
    }
    
    // Hiển thị thông báo không chặn trải nghiệm
    toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại khi cần thiết.');
  }

  // Phương thức get generic
  public async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  // Phương thức post generic
  public async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  // Phương thức put generic
  public async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  // Phương thức delete generic
  public async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }

  // Phương thức patch generic
  public async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.patch<T>(url, data, config);
    return response.data;
  }

  // Hỗ trợ hủy request với AbortController
  public createAbortController(): AbortController {
    return new AbortController();
  }

  // Reset instance cho testing hoặc hot reload
  public static resetInstance(): void {
    ApiClient.instance = undefined as any;
  }
}

// Export API client
export const apiClient = ApiClient.getInstance(); 