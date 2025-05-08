'use client'

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types';
import { authService } from '@/lib/api';

// Định nghĩa kiểu dữ liệu cho AuthState
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
}

// Tạo auth store với Zustand
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      token: null,

      // Hàm login sử dụng authService
      login: async (email: string, password: string) => {
        try {
          // Gọi API đăng nhập thật
          const response = await authService.login({ email, password });
          
          // Lưu token và cập nhật state
          authService.saveToken(response.accessToken);
          
          // Cập nhật state
          set({
            user: response.user,
            isAuthenticated: true,
            token: response.accessToken
          });
          
          return { success: true };
        } catch (error: any) {
          // Xử lý lỗi
          const errorMessage = error.response?.data?.message || 'Email hoặc mật khẩu không chính xác';
          return { 
            success: false, 
            message: errorMessage 
          };
        }
      },

      // Hàm logout sử dụng authService
      logout: async () => {
        try {
          // Gọi API đăng xuất
          await authService.logout();
        } catch (error) {
          console.error('Lỗi khi đăng xuất:', error);
        } finally {
          // Xóa token 
          authService.clearToken();
          
          // Cập nhật state
          set({
            user: null,
            isAuthenticated: false,
            token: null
          });
        }
      }
    }),
    {
      name: 'auth-storage', // Tên của storage item
      partialize: (state) => ({ 
        user: state.user, 
        isAuthenticated: state.isAuthenticated, 
        token: state.token 
      }), // Lưu một phần của state
    }
  )
); 