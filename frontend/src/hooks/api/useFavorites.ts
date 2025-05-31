import { useCallback, useEffect } from 'react';
import { Favorite } from '@/types';
import { favoriteService } from '@/lib/api/services/favoriteService';
import { toast } from 'react-hot-toast';
import { useFavoritesStore } from '@/store/favoritesStore';
import { useAuthStore } from '@/store/auth';

export const useFavorites = () => {
  const { isAuthenticated } = useAuthStore();
  const { 
    favorites, 
    isLoading,
    setFavorites, 
    addFavorite, 
    removeFavorite, 
    clearFavorites,
    setLoading,
    shouldRefetch,
    isFavorite: isFavoriteInStore 
  } = useFavoritesStore();

  // Auto-fetch favorites when user logs in
  useEffect(() => {
    if (!isAuthenticated) {
      clearFavorites();
      return;
    }

    // Only fetch if we should refetch (cache expired or no data)
    if (shouldRefetch()) {
      fetchFavorites();
    }
  }, [isAuthenticated, clearFavorites, shouldRefetch]);

  // Fetch favorites from API
  const fetchFavorites = useCallback(async () => {
    if (!isAuthenticated) {
      clearFavorites();
      return [];
            }
    
    setLoading(true);
    try {
      const result = await favoriteService.getFavorites();
      setFavorites(result);
      return result;
    } catch (error: any) {
      // Ignore cancellation errors during logout
      if (error?.message?.includes('Cancel request because user is logging out')) {
        return [];
        }
      console.error('Error fetching favorites:', error);
      toast.error('Không thể tải danh sách yêu thích');
      return [];
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, setFavorites, clearFavorites, setLoading]);

  // Toggle favorite status with optimistic updates
  const toggleFavorite = useCallback(async (movieId: string | number) => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để thêm vào yêu thích', {
        duration: 4000,
        icon: '🔒'
      });
      return false;
  }

    const currentStatus = isFavoriteInStore(movieId);
    
    // Optimistic update
    if (currentStatus) {
      removeFavorite(movieId);
    } else {
      addFavorite({ 
        id: Date.now(), // Temporary ID
          movieId,
          favoritedAt: new Date().toISOString()
        } as Favorite);
    }
    
    try {
      // Use direct API calls instead of going through favoriteService.toggleFavorite
      // to avoid calling isFavorite again
      let result;
      if (currentStatus) {
        await favoriteService.removeFromFavorites(movieId);
        result = { favorited: false, message: 'Đã xóa khỏi yêu thích' };
      } else {
        await favoriteService.addToFavorites(movieId);
        result = { favorited: true, message: 'Đã thêm vào yêu thích' };
      }
      
      toast.success(result.message);
        return result.favorited;
    } catch (error: any) {
      // Ignore cancellation errors during logout
      if (error?.message?.includes('Cancel request because user is logging out')) {
        return false;
      }
      console.error('Error toggling favorite:', error);
      // Revert on error
      fetchFavorites();
      return false;
    }
  }, [isAuthenticated, isFavoriteInStore, addFavorite, removeFavorite, fetchFavorites]);
  
  // Remove from favorites
  const removeFromFavorites = useCallback(async (movieId: string | number) => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để thực hiện thao tác này', {
        duration: 4000,
        icon: '🔒'
      });
      return false;
    }
    
    // Optimistic update
    removeFavorite(movieId);
    
    try {
        await favoriteService.removeFromFavorites(movieId);
      toast.success('Đã xóa khỏi danh sách yêu thích', {
        duration: 2000
      });
        return true;
    } catch (error: any) {
      // Ignore cancellation errors during logout
      if (error?.message?.includes('Cancel request because user is logging out')) {
        return false;
      }
      console.error('Error removing favorite:', error);
      // Revert on error
      fetchFavorites();
      toast.error('Không thể xóa khỏi danh sách yêu thích');
      return false;
    }
  }, [isAuthenticated, removeFavorite, fetchFavorites]);

  return {
    data: favorites,
    isLoading: isLoading,
    isFavorite: isFavoriteInStore,
    toggleFavorite,
    removeFromFavorites,
    refreshFavorites: fetchFavorites,
    clearFavorites
  };
};