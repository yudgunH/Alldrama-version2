'use client'

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User } from '@/types';
import { authService } from '@/lib/api';
import { AxiosError } from 'axios';

// Định nghĩa kiểu dữ liệu cho AuthState
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;
  sessionId: string | null;
  
  // Các hàm xử lý đăng nhập/đăng xuất
  login: (credentials: { email: string, password: string }) => Promise<boolean | { success: boolean; message?: string }>;
  logout: () => Promise<void>;
  
  // Các hàm setter đơn giản
  setUser: (user: User | null) => void;
  setAuthenticated: (isAuthenticated: boolean) => void;
  setToken: (token: string | null) => void;
}

// Định nghĩa interface cho window
interface CustomWindow extends Window {
  _isHandlingLogout?: boolean;
  isLoggingOut?: boolean;
}

// Interface cho error response
interface ErrorResponse {
  response?: {
    data?: {
      message?: string;
    };
  };
}

// Tạo auth store với Zustand
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      token: null,
      sessionId: null,

      // Các setter cơ bản
      setUser: (user) => set({ user }),
      setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
      setToken: (token) => set({ token }),

      // Hàm login sử dụng authService
      login: async (credentials) => {
        try {
          // Gọi API đăng nhập thật
          const response = await authService.login(credentials);
          
          // Tạo session ID mới
          const sessionId = crypto.randomUUID();
          
          // Lưu token và cập nhật state
          authService.saveToken(response.accessToken);
          
          // Cập nhật state
          set({
            user: response.user,
            isAuthenticated: true,
            token: response.accessToken,
            sessionId
          });

          // Broadcast sự kiện đăng nhập thành công
          if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('auth:login', {
            detail: { sessionId }
          }));
          }
          
          return { success: true };
        } catch (error: unknown) {
          // Xử lý lỗi
          const axiosError = error as AxiosError & ErrorResponse;
          const errorMessage = axiosError.response?.data?.message || 'Email hoặc mật khẩu không chính xác';
          return { 
            success: false, 
            message: errorMessage 
          };
        }
      },

      // Hàm logout sử dụng authService
      logout: async () => {
        try {
          // Đặt cờ đang xử lý logout
          if (typeof window !== 'undefined') {
            const customWindow = window as CustomWindow;
            customWindow._isHandlingLogout = true;
            customWindow.isLoggingOut = true;
          }
          
          try {
            // Gọi API đăng xuất
            await authService.logout();
          } catch (error) {
            console.error('Lỗi khi đăng xuất:', error);
          }
          
          // Xóa token 
          authService.clearToken();
          
          // Cập nhật state
          set({
            user: null,
            isAuthenticated: false,
            token: null,
            sessionId: null
          });

          // Clear all caches after logout
          if (typeof window !== 'undefined') {
            try {
              // Import dynamically to avoid SSR issues
              const { mutate } = await import('swr');
              const { cacheManager } = await import('@/lib/cache/cacheManager');
              
              console.log('Clearing all caches after logout...');
              
              // 1. Clear SWR cache
              await mutate(() => true, undefined, { revalidate: false });
              
              // 2. Clear manual cache
              cacheManager.clearAllCache();
              
              // 3. Clear specific storage items
              try {
                sessionStorage.removeItem('auth-storage');
                localStorage.removeItem('favorites-cache');
                localStorage.removeItem('auth_last_toast_time');
                
                // Clear SWR cache keys from localStorage
                Object.keys(localStorage).forEach(key => {
                  if (key.startsWith('swr-cache-') || key.startsWith('cache-')) {
                    localStorage.removeItem(key);
                  }
                });
                
                // Clear sessionStorage cache keys
                Object.keys(sessionStorage).forEach(key => {
                  if (key.startsWith('swr-cache-') || key.startsWith('cache-')) {
                    sessionStorage.removeItem(key);
                  }
                });
              } catch (storageError) {
                console.error('Error clearing storage:', storageError);
              }
              
              console.log('All caches cleared successfully after logout');
            } catch (cacheError) {
              console.error('Error clearing caches after logout:', cacheError);
            }
          }

          // Broadcast logout event for other tabs and components
          if (typeof window !== 'undefined') {
            const customWindow = window as CustomWindow;
            
            // Broadcast to other tabs
            if (window && !window.opener) {
              window.dispatchEvent(new CustomEvent('auth:logout', {
                detail: { 
                  clearCache: true,
                  timestamp: Date.now()
                }
              }));
            }
            
            // Reset flags after operation
            setTimeout(() => {
              customWindow._isHandlingLogout = false;
              customWindow.isLoggingOut = false;
            }, 2000);
          }
        } catch (error) {
          console.error('Lỗi trong quá trình đăng xuất:', error);
          
          // Đảm bảo reset cờ ngay cả khi có lỗi
          if (typeof window !== 'undefined') {
            const customWindow = window as CustomWindow;
            setTimeout(() => {
              customWindow._isHandlingLogout = false;
              customWindow.isLoggingOut = false;
            }, 2000);
          }
        }
      }
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => {
        return typeof window !== 'undefined' ? sessionStorage : {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {}
        };
      }),
      partialize: (state) => ({ 
        user: state.user, 
        isAuthenticated: state.isAuthenticated, 
        token: state.token,
        sessionId: state.sessionId
      }),
    }
  )
);

// Lắng nghe sự kiện storage để đồng bộ giữa các tab
if (typeof window !== 'undefined') {
  // Đặt cờ để tránh vòng lặp vô hạn khi đăng xuất
  const customWindow = window as CustomWindow;
  customWindow._isHandlingLogout = false;
  
  window.addEventListener('storage', (event) => {
    if (event.key === 'auth-storage') {
      const newState = JSON.parse(event.newValue || '{}');
      const currentState = useAuthStore.getState();

      // Chỉ cập nhật nếu sessionId khác nhau
      if (newState.sessionId !== currentState.sessionId) {
        useAuthStore.setState(newState);
      }
    }
  });

  // Lắng nghe sự kiện đăng nhập/đăng xuất từ các tab khác
  window.addEventListener('auth:login', ((event: CustomEvent) => {
    const { sessionId } = event.detail;
    const currentState = useAuthStore.getState();
    
    // Nếu sessionId khác, cập nhật state
    if (sessionId !== currentState.sessionId) {
      useAuthStore.setState(currentState);
    }
  }) as EventListener);

  // Sửa phần lắng nghe sự kiện đăng xuất để tránh vòng lặp vô hạn
  window.addEventListener('auth:logout', async (event: any) => {
    const customWindow = window as CustomWindow;
    // Kiểm tra xem đã đang xử lý logout chưa - tránh vòng lặp vô hạn
    if (!customWindow._isHandlingLogout) {
      // Đặt cờ để đánh dấu đang xử lý logout
      customWindow._isHandlingLogout = true;
      
      try {
        console.log('Processing logout event from another tab...');
        
        // Clear all caches if requested
        if (event.detail?.clearCache) {
          try {
            const { mutate } = await import('swr');
            const { cacheManager } = await import('@/lib/cache/cacheManager');
            
            // Clear SWR cache
            await mutate(() => true, undefined, { revalidate: false });
            
            // Clear manual cache
            cacheManager.clearAllCache();
            
            console.log('Cache cleared from logout event');
          } catch (cacheError) {
            console.error('Error clearing cache from logout event:', cacheError);
          }
        }
        
        // Clear auth service token
        const { authService } = await import('@/lib/api/services/authService');
        authService.clearToken();
        
        // Update store state directly
        const store = useAuthStore.getState();
        useAuthStore.setState({
          ...store,
          user: null,
          isAuthenticated: false,
          token: null,
          sessionId: null
        });
        
        console.log('Logout event processed successfully');
      } catch (error) {
        console.error('Error processing logout event:', error);
      }
      
      // Đặt lại cờ sau khi hoàn thành
      setTimeout(() => {
        customWindow._isHandlingLogout = false;
      }, 500);
    }
  });
} 