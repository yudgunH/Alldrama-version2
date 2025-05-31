'use client';

import { useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { SWRConfig, useSWRConfig } from 'swr';
import { ThemeProvider } from 'next-themes';
import { useRouter, usePathname } from 'next/navigation';
import { authService } from '@/lib/api';
import { refreshAccessToken, onTokenRefreshed, onTokenRefreshFailed } from '@/lib/api/authHelper';
import MainLayout from '@/components/layout/MainLayout';
import { useAuth } from '@/hooks/api/useAuth';
import CacheDebug from "@/components/debug/CacheDebug";
import { cacheManager } from '@/lib/cache/cacheManager';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { isAuthenticated, token } = useAuth();
  const { mutate } = useSWRConfig();

  // Monitor authentication state changes and clear cache when user logs out
  const [previousAuthState, setPreviousAuthState] = useState<boolean | null>(null);
  
  useEffect(() => {
    // Skip on first render
    if (previousAuthState === null) {
      setPreviousAuthState(isAuthenticated);
      return;
    }
    
    // If user was authenticated but now is not (logged out), clear all cache
    if (previousAuthState === true && isAuthenticated === false) {
      console.log('Authentication state changed: user logged out, clearing all cache and refreshing page data');
      
      const clearCacheAndRefresh = async () => {
        try {
          // 1. Clear SWR cache completely
          await mutate(() => true, undefined, { revalidate: false });
          
          // 2. Clear manual cache
          cacheManager.clearAllCache();
          
          // 3. Clear browser storage
          try {
            sessionStorage.removeItem('auth-storage');
            localStorage.removeItem('favorites-cache');
            localStorage.removeItem('auth_last_toast_time');
            
            // Clear all cache-related items
            Object.keys(localStorage).forEach(key => {
              if (key.startsWith('swr-cache-') || key.startsWith('cache-') || key.includes('cache')) {
                localStorage.removeItem(key);
              }
            });
            
            Object.keys(sessionStorage).forEach(key => {
              if (key.startsWith('swr-cache-') || key.startsWith('cache-') || key.includes('cache')) {
                sessionStorage.removeItem(key);
              }
            });
          } catch (storageError) {
            console.error('Error clearing storage:', storageError);
          }
          
          // 4. Force refresh of public data after a short delay
          setTimeout(async () => {
            try {
              console.log('Refreshing public data after logout...');
              
              // Đặt flag để cho phép refresh requests
              if (typeof window !== 'undefined') {
                (window as any).isRefreshingAfterLogout = true;
              }
              
              // Refresh homepage data
              await mutate('homepage_data');
              
              // Refresh movie lists that should be public
              await mutate((key) => typeof key === 'string' && (
                key.includes('movies') || 
                key.includes('homepage') ||
                key.includes('popular') ||
                key.includes('trending') ||
                key.includes('newest')
              ));
              
              console.log('Public data refreshed successfully after logout');
            } catch (refreshError) {
              console.error('Error refreshing public data after logout:', refreshError);
            } finally {
              // Clear refresh flag sau khi hoàn tất
              if (typeof window !== 'undefined') {
                (window as any).isRefreshingAfterLogout = false;
              }
            }
          }, 800); // Giảm delay xuống vì không cần đợi isLoggingOut flag nữa
          
          console.log('Cache cleared and data refresh initiated after logout');
        } catch (error) {
          console.error('Error clearing cache after logout:', error);
        }
      };
      
      clearCacheAndRefresh();
    }
    
    // If user was not authenticated but now is (logged in), revalidate user-specific data
    if (previousAuthState === false && isAuthenticated === true) {
      console.log('Authentication state changed: user logged in, refreshing user-specific data');
      
      const refreshUserData = async () => {
        try {
          // Small delay to ensure auth state is fully settled
          await new Promise(resolve => setTimeout(resolve, 300));
          
          // Refresh user-specific data
          await mutate('favorites');
          await mutate('watch-history');
          await mutate((key) => typeof key === 'string' && (
            key.includes('favorites') || 
            key.includes('watch-history') ||
            key.includes('user-profile') ||
            key.includes('user-')
          ));
          
          // Also refresh homepage to show personalized content
          await mutate('homepage_data');
          
          console.log('User-specific data refreshed successfully after login');
        } catch (error) {
          console.error('Error refreshing user data after login:', error);
        }
      };
      
      refreshUserData();
    }
    
    setPreviousAuthState(isAuthenticated);
  }, [isAuthenticated, mutate, previousAuthState]);

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  // Token refresh logic
  useEffect(() => {
    if (!isAuthenticated || !token) return;

    const checkTokenExpiry = async () => {
      try {
        // Check if token is expired instead of validateToken
        const isExpired = authService.isTokenExpired(token);
        if (isExpired && !isRefreshing) {
          setIsRefreshing(true);
          await refreshAccessToken();
          setIsRefreshing(false);
        }
      } catch (error) {
        console.error('Token validation failed:', error);
        setIsRefreshing(false);
        router.push('/login');
      }
    };

    // Check token validity on mount and periodically
    checkTokenExpiry();
    const interval = setInterval(checkTokenExpiry, 5 * 60 * 1000); // Check every 5 minutes

    return () => clearInterval(interval);
  }, [isAuthenticated, token, router, isRefreshing]);

  // Token refresh event handlers
  useEffect(() => {
    const handleTokenRefreshed = () => {
      setIsRefreshing(false);
    };

    const handleTokenRefreshFailed = () => {
      setIsRefreshing(false);
      router.push('/login');
    };

    onTokenRefreshed(handleTokenRefreshed);
    onTokenRefreshFailed(handleTokenRefreshFailed);

    return () => {
      // Cleanup listeners if needed
    };
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
          revalidateOnFocus: false,
          revalidateOnReconnect: false,
          dedupingInterval: 10000,
          errorRetryCount: 2,
          errorRetryInterval: 5000,
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
        <CacheDebug />
      </SWRConfig>
    </ThemeProvider>
  );
} 