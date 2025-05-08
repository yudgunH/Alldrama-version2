import { Favorite } from '@/types';
import { apiClient } from '../apiClient';
import { API_ENDPOINTS } from '../endpoints';
import axios from 'axios';

export interface FavoriteResponse {
  message: string;
  favorite: Favorite;
}

export const favoriteService = {
  /**
   * Lấy danh sách phim yêu thích của người dùng hiện tại
   */
  async getFavorites(): Promise<Favorite[]> {
    try {
      console.log('Calling API to get favorites list');
      console.log('Endpoint:', API_ENDPOINTS.FAVORITES.LIST);
      const result = await apiClient.get<Favorite[]>(API_ENDPOINTS.FAVORITES.LIST);
      console.log('API response for getFavorites:', result);
      return result;
    } catch (error) {
      console.error('API error in getFavorites:', error);
      
      // Check if it's a network error and provide more helpful information
      if (axios.isAxiosError(error) && !error.response) {
        console.error('Network error detected in getFavorites. This might be due to:');
        console.error('1. CORS issues: The API server might not be allowing requests from your origin');
        console.error('2. Network connectivity: The API server might be down or unreachable');
        console.error('3. SSL/Certificate issues: There might be issues with the SSL certificate');
        console.error('4. Proxy configuration: The Next.js proxy might not be correctly configured');
        
        // Return empty array instead of throwing to avoid UI disruption
        return [];
      }
      
      throw error;
    }
  },

  /**
   * Thêm phim vào danh sách yêu thích
   * @param movieId ID của phim
   */
  async addToFavorites(movieId: string | number): Promise<FavoriteResponse> {
    try {
      console.log('Calling API to add favorite:', movieId);
      console.log('Endpoint:', API_ENDPOINTS.FAVORITES.ADD);
      const result = await apiClient.post<FavoriteResponse>(
        API_ENDPOINTS.FAVORITES.ADD,
        { movieId: String(movieId) }
      );
      console.log('API response for addToFavorites:', result);
      return result;
    } catch (error) {
      console.error('API error in addToFavorites:', error);
      throw error;
    }
  },

  /**
   * Xóa phim khỏi danh sách yêu thích
   * @param movieId ID của phim
   */
  async removeFromFavorites(movieId: string | number): Promise<{ message: string }> {
    try {
      console.log('Calling API to remove favorite:', movieId);
      console.log('Endpoint:', API_ENDPOINTS.FAVORITES.REMOVE(movieId));
      const result = await apiClient.delete<{ message: string }>(
        API_ENDPOINTS.FAVORITES.REMOVE(movieId)
      );
      console.log('API response for removeFromFavorites:', result);
      return result;
    } catch (error) {
      console.error('API error in removeFromFavorites:', error);
      throw error;
    }
  },

  /**
   * Kiểm tra phim có trong danh sách yêu thích của người dùng hay không
   * @param movieId ID của phim
   */
  async isFavorite(movieId: string | number): Promise<boolean> {
    try {
      console.log('Checking if movie is in favorites:', movieId);
      
      // No direct endpoint for checking favorites, so we use the list endpoint
      // Fallback to full list
      const favorites = await this.getFavorites();
      console.log('Favorites list for check:', favorites);
      const isFav = favorites.some(fav => String(fav.movieId) === String(movieId));
      console.log('Is favorite result:', isFav);
      return isFav;
    } catch (error) {
      console.error('Error in isFavorite:', error);
      // Return false in case of error to avoid UI breaking
      return false;
    }
  },

  /**
   * Toggle trạng thái yêu thích (thêm nếu chưa có, xóa nếu đã có)
   * @param movieId ID của phim
   */
  async toggleFavorite(movieId: string | number): Promise<{ favorited: boolean; message: string }> {
    try {
      console.log('Toggling favorite status for movie:', movieId);
      const isFav = await this.isFavorite(movieId);
      console.log('Current favorite status before toggle:', isFav);
      
      if (isFav) {
        console.log('Movie is already favorited, removing...');
        const response = await this.removeFromFavorites(movieId);
        return {
          favorited: false,
          message: response.message
        };
      } else {
        console.log('Movie is not favorited, adding...');
        const response = await this.addToFavorites(movieId);
        return {
          favorited: true,
          message: response.message
        };
      }
    } catch (error) {
      console.error('Error in toggleFavorite:', error);
      throw error;
    }
  },

  /**
   * Debug method to check authentication status and API connectivity
   */
  async checkAuthAndConnectivity(): Promise<{status: string, message: string}> {
    try {
      console.log('Checking API connectivity and authentication');
      
      // Try to make a simple authenticated request
      const result = await apiClient.get('/api/auth/me');
      console.log('Authentication check succeeded:', result);
      
      return {
        status: 'success',
        message: 'Authentication and API connectivity working properly'
      };
    } catch (error: any) {
      console.error('Authentication check failed:', error);
      
      const statusCode = error.response?.status;
      const errorMessage = error.response?.data?.message || error.message;
      
      return {
        status: 'error',
        message: `API Error (${statusCode}): ${errorMessage}`
      };
    }
  }
};