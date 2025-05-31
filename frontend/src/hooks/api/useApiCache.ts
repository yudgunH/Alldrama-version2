import { useSWRConfig } from 'swr';
import { useCallback } from 'react';

// Định nghĩa kiểu cho matcher của cache key
export type CacheMatcher = string | RegExp | ((key: string) => boolean);

/**
 * Hook quản lý cache của API
 */
export const useApiCache = () => {
  const { mutate } = useSWRConfig();
  
  /**
   * Xóa tất cả cache
   */
  const clearAllCache = useCallback(() => {
    // Xóa tất cả cache, không truyền key sẽ làm mới tất cả dữ liệu
    mutate(undefined, undefined, { revalidate: false });
  }, [mutate]);

  /**
   * Xóa cache theo key cụ thể hoặc theo function matcher
   * @param matcher Key cache cần xóa hoặc hàm kiểm tra key
   */
  const clearCache = useCallback((matcher: CacheMatcher) => {
    mutate(matcher as any, undefined, { revalidate: false });
  }, [mutate]);

  /**
   * Xóa tất cả cache liên quan đến movies
   */
  const clearMoviesCache = useCallback(() => {
    // Xóa cache với filter, làm mới tất cả key bắt đầu bằng 'movies'
    mutate((key) => typeof key === 'string' && key.startsWith('movies'), undefined, { revalidate: false });
  }, [mutate]);

  /**
   * Xóa tất cả cache liên quan đến một movie cụ thể
   * @param movieId ID của phim
   */
  const clearMovieCache = useCallback((movieId: string) => {
    // Xóa cache với filter, làm mới tất cả key chứa movieId
    mutate(
      (key) => typeof key === 'string' && key.includes(`movies`) && key.includes(movieId),
      undefined,
      { revalidate: false }
    );
  }, [mutate]);

  /**
   * Xóa tất cả cache liên quan đến episodes
   */
  const clearEpisodesCache = useCallback(() => {
    mutate((key) => typeof key === 'string' && key.startsWith('episodes'), undefined, { revalidate: false });
  }, [mutate]);

  /**
   * Xóa cache liên quan đến tất cả các favorites
   */
  const clearFavoritesCache = useCallback(() => {
    mutate((key) => typeof key === 'string' && key.startsWith('favorites'), undefined, { revalidate: false });
  }, [mutate]);

  /**
   * Xóa cache liên quan đến lịch sử xem
   */
  const clearWatchHistoryCache = useCallback(() => {
    mutate((key) => typeof key === 'string' && key.startsWith('watch-history'), undefined, { revalidate: false });
  }, [mutate]);

  /**
   * Xóa cache liên quan đến thống kê
   */
  const clearStatsCache = useCallback(() => {
    mutate((key) => typeof key === 'string' && key.startsWith('stats'), undefined, { revalidate: false });
  }, [mutate]);

  /**
   * Xóa cache liên quan đến lượt xem
   */
  const clearViewsCache = useCallback(() => {
    mutate((key) => typeof key === 'string' && key.startsWith('views'), undefined, { revalidate: false });
  }, [mutate]);

  /**
   * Làm mới dữ liệu công khai sau khi đăng xuất
   * Dữ liệu này có thể xem được mà không cần đăng nhập
   */
  const refreshPublicDataAfterLogout = useCallback(async () => {
    try {
      console.log('Refreshing public data after logout...');
      
      // Đợi một chút để đảm bảo cache đã được clear
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Refresh homepage data
      await mutate('homepage_data');
      
      // Refresh public movie lists
      await mutate((key) => typeof key === 'string' && (
        key.includes('movies') && !key.includes('user') ||
        key.includes('homepage') ||
        key.includes('popular') ||
        key.includes('trending') ||
        key.includes('newest') ||
        key.includes('featured')
      ));
      
      console.log('Public data refreshed successfully after logout');
    } catch (error) {
      console.error('Error refreshing public data after logout:', error);
    }
  }, [mutate]);

  /**
   * Làm mới dữ liệu người dùng sau khi đăng nhập
   */
  const refreshUserDataAfterLogin = useCallback(async () => {
    try {
      console.log('Refreshing user data after login...');
      
      // Đợi một chút để đảm bảo auth state đã ổn định
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
      
      console.log('User data refreshed successfully after login');
    } catch (error) {
      console.error('Error refreshing user data after login:', error);
    }
  }, [mutate]);

  /**
   * Clear toàn bộ cache và storage sau logout
   */
  const clearAllCacheAndStorage = useCallback(async () => {
    try {
      console.log('Clearing all cache and storage...');
      
      // 1. Clear SWR cache completely
      await mutate(() => true, undefined, { revalidate: false });
      
      // 2. Clear browser storage
      if (typeof window !== 'undefined') {
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
      }
      
      console.log('All cache and storage cleared successfully');
    } catch (error) {
      console.error('Error clearing cache and storage:', error);
    }
  }, [mutate]);

  return {
    clearAllCache,
    clearCache,
    clearMoviesCache,
    clearMovieCache,
    clearEpisodesCache,
    clearFavoritesCache,
    clearWatchHistoryCache,
    clearStatsCache,
    clearViewsCache,
    refreshPublicDataAfterLogout,
    refreshUserDataAfterLogin,
    clearAllCacheAndStorage,
  };
}; 