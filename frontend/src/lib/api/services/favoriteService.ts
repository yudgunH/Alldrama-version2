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
      const result = await apiClient.get<Favorite[]>(API_ENDPOINTS.FAVORITES.LIST);
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
      const result = await apiClient.post<FavoriteResponse>(
        API_ENDPOINTS.FAVORITES.ADD,
        { movieId: String(movieId) }
      );
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
      const result = await apiClient.delete<{ message: string }>(
        API_ENDPOINTS.FAVORITES.REMOVE(movieId)
      );
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
      // No direct endpoint for checking favorites, so we use the list endpoint
      // Fallback to full list
      const favorites = await this.getFavorites();
      const isFav = favorites.some(fav => String(fav.movieId) === String(movieId));
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
   * @param currentStatus Trạng thái hiện tại (optional, để tránh gọi isFavorite)
   */
  async toggleFavorite(movieId: string | number, currentStatus?: boolean): Promise<{ favorited: boolean; message: string }> {
    try {
      // Use provided status or check current status
      const isFav = currentStatus !== undefined ? currentStatus : await this.isFavorite(movieId);
      
      if (isFav) {
        const response = await this.removeFromFavorites(movieId);
        return {
          favorited: false,
          message: response.message
        };
      } else {
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
  }
};