'use client';

import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { SWRConfig } from 'swr';
import { ThemeProvider } from 'next-themes';
import { useRouter } from 'next/navigation';
import { authService } from '@/lib/api';
import MainLayout from '@/components/layout/MainLayout';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter();

  // Xử lý refresh token khi cần thiết
  useEffect(() => {
    const handleTokenRefresh = async () => {
      // Kiểm tra xem có cookie needsTokenRefresh hay không
      const needsRefresh = document.cookie.includes('needsTokenRefresh=true');
      
      if (needsRefresh) {
        try {
          // Xóa cookie needsTokenRefresh
          document.cookie = 'needsTokenRefresh=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
          
          // Gọi API refresh token
          await authService.refreshToken();
          
          // Lấy redirectTo từ cookie nếu có
          const redirectMatch = document.cookie.match(/redirectTo=([^;]+)/);
          if (redirectMatch && redirectMatch[1]) {
            const redirectPath = decodeURIComponent(redirectMatch[1]);
            // Xóa cookie redirectTo
            document.cookie = 'redirectTo=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; httpOnly';
            // Redirect đến path ban đầu
            router.push(redirectPath);
          } else {
            // Refresh trang hiện tại
            router.refresh();
          }
        } catch (error) {
          console.error('Failed to refresh token:', error);
          // Nếu refresh token thất bại, redirect đến trang login
          router.push('/login');
        }
      }
    };

    handleTokenRefresh();
  }, [router]);

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
              borderLeftColor: '#22c55e'  // xanh lá
            },
            iconTheme: {
              primary: '#22c55e',
              secondary: '#2a2a3b',
            },
          },
          error: {
            style: {
              borderLeftColor: '#ef4444'  // đỏ
            },
            iconTheme: {
              primary: '#ef4444',
              secondary: '#2a2a3b',
            },
          },
          loading: {
            style: {
              borderLeftColor: '#3b82f6'  // xanh dương
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