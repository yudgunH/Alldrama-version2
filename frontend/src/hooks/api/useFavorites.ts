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
    setFavorites, 
    addFavorite, 
    removeFavorite, 
    clearFavorites,
    isFavorite: isFavoriteInStore 
  } = useFavoritesStore();

  // Clear favorites when user logs out
  useEffect(() => {
    if (!isAuthenticated) {
      clearFavorites();
    }
  }, [isAuthenticated, clearFavorites]);

  // Fetch favorites from API
  const fetchFavorites = useCallback(async () => {
    if (!isAuthenticated) {
      clearFavorites();
      return [];
            }
    
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
    }
  }, [isAuthenticated, setFavorites, clearFavorites]);

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
      const result = await favoriteService.toggleFavorite(movieId);
      
      if (!result.favorited) {
        // Revert if failed
        fetchFavorites();
      } else {
        toast.success(currentStatus ? 'Đã xóa khỏi yêu thích' : 'Đã thêm vào yêu thích');
      }
      
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
    isLoading: false,
    isFavorite: isFavoriteInStore,
    toggleFavorite,
    removeFromFavorites,
    refreshFavorites: fetchFavorites,
    clearFavorites
  };
};