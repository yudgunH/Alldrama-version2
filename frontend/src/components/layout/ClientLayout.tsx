'use client';

import { useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { SWRConfig } from 'swr';
import { ThemeProvider } from 'next-themes';
import { useRouter } from 'next/navigation';
import { authService } from '@/lib/api';
import { refreshAccessToken, onTokenRefreshed, onTokenRefreshFailed } from '@/lib/api/authHelper';
import MainLayout from '@/components/layout/MainLayout';
import { useAuthStore } from '@/store/auth';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { isAuthenticated, token } = useAuthStore();

  // Xử lý refresh token khi cần thiết
  useEffect(() => {
    let isMounted = true;

    const handleTokenRefresh = async () => {
      if (!isRefreshing) {
        try {
          setIsRefreshing(true);
          
          // Sử dụng authHelper để refresh token
          const newToken = await refreshAccessToken();
          
          if (!isMounted) return;
          
          // Cập nhật access token
          authService.saveToken(newToken);
          
          // Refresh trang hiện tại
          router.refresh();
        } catch (error) {
          console.error('Failed to refresh token:', error);
          if (!isMounted) return;
          
          // Nếu refresh token thất bại, redirect đến trang login
          router.push('/login');
        } finally {
          if (isMounted) {
            setIsRefreshing(false);
          }
        }
      }
    };

    // Kiểm tra token và refresh nếu cần
    const checkAndRefreshToken = async () => {
      if (token && authService.isTokenExpired(token)) {
        await handleTokenRefresh();
      }
    };

    // Đăng ký các callback xử lý refresh token
    onTokenRefreshed((newToken) => {
      if (isMounted) {
        authService.saveToken(newToken);
        router.refresh();
      }
    });

    onTokenRefreshFailed((error) => {
      if (isMounted) {
        console.error('Token refresh failed:', error);
        router.push('/login');
      }
    });

    checkAndRefreshToken();

    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, [router, isRefreshing, token]);

  // Kiểm tra authentication khi component mount
  useEffect(() => {
    // Danh sách các route cần xác thực
    const protectedRoutes = ['/profile', '/watch'];
    
    // Chỉ redirect nếu đang ở route cần xác thực và chưa đăng nhập
    if (!isAuthenticated && 
        !window.location.pathname.includes('/login') &&
        protectedRoutes.some(route => window.location.pathname.startsWith(route))) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  return (
    <ThemeProvider 
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      storageKey="alldrama-theme"
      themes={['light', 'dark']}
      disableTransitionOnChange
    >
      <SWRConfig
        value={{
          provider: () => new Map(),
          revalidateOnFocus: false,
          errorRetryCount: 3,
          onError: (error) => {
            // Xử lý lỗi 401 (Unauthorized)
            if (error.status === 401) {
              router.refresh();
            }
          }
        }}
      >
        <MainLayout>
          {children}
        </MainLayout>
        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#2a2a3b',
              color: '#fff',
              padding: '14px 18px',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              borderLeft: '4px solid transparent',
              fontFamily: 'Inter, sans-serif',
              fontSize: '14px',
              animation: 'slideIn 0.3s ease-out',
            },
            success: {
              style: {
                borderLeftColor: '#22c55e'
              },
              iconTheme: {
                primary: '#22c55e',
                secondary: '#2a2a3b',
              },
            },
            error: {
              style: {
                borderLeftColor: '#ef4444'
              },
              iconTheme: {
                primary: '#ef4444',
                secondary: '#2a2a3b',
              },
            },
            loading: {
              style: {
                borderLeftColor: '#3b82f6'
              },
              iconTheme: {
                primary: '#3b82f6',
                secondary: '#2a2a3b',
              },
            },
          }}
        />
      </SWRConfig>
    </ThemeProvider>
  );
} 