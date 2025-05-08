import { useState, useCallback } from 'react';
import useSWR from 'swr';
import { Favorite } from '@/types';
import { favoriteService, FavoriteResponse } from '@/lib/api/services/favoriteService';
import { toast } from 'react-hot-toast';
import { useApiCache } from './useApiCache';

export const useFavorites = () => {
  const { clearFavoritesCache, clearMoviesCache } = useApiCache();

  // SWR key for favorites
  const key = 'favorites';

  // Fetcher function for SWR
  const fetcher = useCallback(
    async () => {
      console.log('Fetching favorites list');
      try {
        const result = await favoriteService.getFavorites();
        console.log('Favorites fetched successfully:', result);
        return result;
      } catch (error) {
        console.error('Error fetching favorites:', error);
        return [];
      }
    },
    []
  );

  // Use SWR hook
  const { data, error, isLoading, isValidating, mutate } = useSWR<Favorite[]>(
    key,
    fetcher
  );

  // Add movie to favorites
  const addToFavorites = useCallback(
    async (movieId: string | number) => {
      try {
        console.log('Adding movie to favorites:', movieId);
        const response = await favoriteService.addToFavorites(movieId);
        console.log('Add favorite response:', response);
        await mutate();
        toast.success(response.message);
        return response.favorite;
      } catch (err) {
        console.error('Error adding to favorites:', err);
        toast.error('Không thể thêm vào danh sách yêu thích');
        return null;
      }
    },
    [mutate]
  );

  // Remove movie from favorites
  const removeFromFavorites = useCallback(
    async (movieId: string | number) => {
      try {
        console.log('Removing movie from favorites:', movieId);
        const response = await favoriteService.removeFromFavorites(movieId);
        console.log('Remove favorite response:', response);
        await mutate();
        toast.success(response.message);
        return true;
      } catch (err) {
        console.error('Error removing from favorites:', err);
        toast.error('Không thể xóa khỏi danh sách yêu thích');
        return false;
      }
    },
    [mutate]
  );

  // Check if movie is in favorites
  const isFavorite = useCallback(
    async (movieId: string | number) => {
      try {
        console.log('Checking if movie is favorite:', movieId);
        // Lấy danh sách yêu thích và kiểm tra movieId có trong danh sách không
        const result = await favoriteService.isFavorite(movieId);
        console.log('Is favorite result:', result);
        return result;
      } catch (err) {
        console.error('Error checking favorite status:', err);
        return false;
      }
    },
    []
  );

  // Toggle favorite status
  const toggleFavorite = useCallback(
    async (movieId: string | number) => {
      try {
        console.log('Toggling favorite for movie:', movieId);
        const result = await favoriteService.toggleFavorite(movieId);
        console.log('Toggle favorite result:', result);
        await mutate();
        toast.success(result.message);
        return result.favorited;
      } catch (err) {
        console.error('Error toggling favorite:', err);
        toast.error('Không thể thay đổi trạng thái yêu thích');
        return null;
      }
    },
    [mutate]
  );

  return {
    favorites: data || [],
    loading: isLoading,
    isValidating,
    error,
    addToFavorites,
    removeFromFavorites,
    isFavorite,
    toggleFavorite,
    refreshFavorites: mutate,
  };
};