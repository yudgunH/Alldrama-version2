import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import { toast } from 'react-hot-toast';
import { ErrorResponse } from '@/types';
import {
  getRefreshingStatus,
  setRefreshingStatus,
  refreshAccessToken,
  onTokenRefreshed,
  onTokenRefreshFailed,
  notifySubscribers,
  clearAuthHelperState
} from './authHelper';
import { useAuthStore } from '@/store/authStore';

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
        // Lấy token từ authStore
        const token = useAuthStore.getState().token;
        
        // Bỏ qua debug logging với môi trường production
        if (process.env.NODE_ENV !== 'production') {
          console.log(`API Request:`, {
            url: config.url, 
            baseURL: config.baseURL || '(none)',
            fullUrl: config.baseURL ? `${config.baseURL}${config.url}` : config.url,
            hasToken: !!token
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

        // Khởi tạo số lần retry nếu chưa có
        if (originalRequest._retryCount === undefined) {
          originalRequest._retryCount = 0;
        }
        
        // Chỉ xử lý lỗi 401 và request chưa quá số lần retry tối đa
        const isUnauthorized = error.response?.status === 401;
        const canRetry = originalRequest._retryCount < this.MAX_RETRIES;

        if (isUnauthorized && originalRequest && canRetry) {
          originalRequest._retryCount++;
          
          // Nếu đang refresh token, chờ quá trình hoàn thành
          if (getRefreshingStatus()) {
            try {
              // Đợi token mới từ quá trình refresh đang diễn ra
              const newToken = await new Promise<string>((resolve, reject) => {
                onTokenRefreshed((token) => {
                  resolve(token);
                });
                
                // Xử lý khi refresh thất bại
                onTokenRefreshFailed((error) => {
                  reject(error);
                });
              });
              
              // Cập nhật token mới cho request hiện tại
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
              }
              
              // Retry request với token mới
              return this.client(originalRequest);
            } catch (refreshError) {
              return this.handleTokenRefreshFailed();
            }
          }
          
          // Bắt đầu quá trình refresh token
          setRefreshingStatus(true);
          
          try {
            // Gọi API refresh token
            const newToken = await refreshAccessToken();
            
            // Lưu token mới vào store
            useAuthStore.getState().setToken(newToken);
            
            // Cập nhật token cho request hiện tại
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
            }
            
            // Thông báo cho các request đang đợi
            notifySubscribers(newToken);
            
            // Kết thúc quá trình refresh
            setRefreshingStatus(false);
            
            // Retry request với token mới
            return this.client(originalRequest);
          } catch (refreshError) {
            // Xử lý khi refresh token thất bại
            return this.handleTokenRefreshFailed();
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
        const status = error.response?.status;

        // Hiển thị thông báo lỗi
        const errorMessage = errorResponse?.message || 'Đã xảy ra lỗi không xác định';
        
        // Chỉ hiển thị toast cho các lỗi không phải 401
        if (!isUnauthorized) {
          toast.error(errorMessage);
        }

        return Promise.reject(error);
      }
    );
  }

  /**
   * Xử lý khi refresh token thất bại (refresh token hết hạn hoặc không hợp lệ)
   */
  private handleTokenRefreshFailed(): Promise<never> {
    // Xóa token trong store
    useAuthStore.getState().logout();
    
    // Xóa toàn bộ trạng thái auth helper
    clearAuthHelperState();
    
    // Hiển thị thông báo
    toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
    
    // Chuyển hướng đến trang đăng nhập
    window.location.href = '/login';
    
    return Promise.reject(new Error('Phiên đăng nhập đã hết hạn'));
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