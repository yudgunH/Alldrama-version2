import { apiClient } from '../apiClient';
import { API_ENDPOINTS } from '../endpoints';

export const viewService = {
  /**
   * Tăng lượt xem cho phim
   * @param movieId ID của phim
   */
  async incrementMovieView(movieId: string | number): Promise<{ views: number }> {
    return apiClient.post<{ views: number }>(
      API_ENDPOINTS.VIEWS.INCREMENT_MOVIE(movieId)
    );
  },

  /**
   * Tăng lượt xem cho tập phim
   * @param episodeId ID của tập phim
   */
  async incrementEpisodeView(episodeId: string | number): Promise<{ views: number }> {
    return apiClient.post<{ views: number }>(
      API_ENDPOINTS.VIEWS.INCREMENT_EPISODE(episodeId)
    );
  },

  /**
   * Lấy tổng lượt xem của phim
   * @param movieId ID của phim
   */
  async getMovieViews(movieId: string | number): Promise<{ views: number }> {
    return apiClient.get<{ views: number }>(
      API_ENDPOINTS.VIEWS.GET_MOVIE_VIEWS(movieId)
    );
  },

  /**
   * Lấy tổng lượt xem của tập phim
   * @param episodeId ID của tập phim
   */
  async getEpisodeViews(episodeId: string | number): Promise<{ views: number }> {
    return apiClient.get<{ views: number }>(
      API_ENDPOINTS.VIEWS.GET_EPISODE_VIEWS(episodeId)
    );
  }
};