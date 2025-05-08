import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import { toast } from 'react-hot-toast';
import { ErrorResponse } from '@/types';
import {
  getRefreshingStatus,
  setRefreshingStatus,
  refreshAccessToken,
  onTokenRefreshed,
  notifySubscribers
} from './authHelper';
import { useAuthStore } from '@/store/authStore';

// Cấu hình môi trường
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://alldramaz.com';

// Mở rộng InternalAxiosRequestConfig để hỗ trợ _retry property
interface ExtendedAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

class ApiClient {
  private client: AxiosInstance;
  private static instance: ApiClient;

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
        
        // Chỉ xử lý lỗi 401 và request chưa được retry
        if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
          originalRequest._retry = true;
          
          // Nếu đang refresh token, thêm request hiện tại vào hàng đợi
          if (getRefreshingStatus()) {
            try {
              // Tạo promise đợi token mới
              const newToken = await new Promise<string>((resolve) => {
                // Đăng ký callback để nhận token mới khi refresh xong
                onTokenRefreshed((token) => {
                  resolve(token);
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
            
            // Lưu token mới
            localStorage.setItem('token', newToken);
            
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

        // Xử lý các lỗi khác
        const errorResponse = error.response?.data as ErrorResponse;
        const status = error.response?.status;

        // Hiển thị thông báo lỗi
        const errorMessage = errorResponse?.message || 'Đã xảy ra lỗi không xác định';
        
        // Chỉ hiển thị toast cho các lỗi không phải 401
        if (status !== 401) {
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
    // Xóa token trong localStorage
    localStorage.removeItem('token');
    
    // Đặt lại trạng thái refresh
    setRefreshingStatus(false);
    
    // Hiển thị thông báo
    toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
    
    // Chuyển hướng đến trang đăng nhập (nếu không sử dụng SPA, có thể cần reload)
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
}

// Export API client
export const apiClient = ApiClient.getInstance(); 