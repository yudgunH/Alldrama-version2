import { apiClient } from '../apiClient';
import { API_ENDPOINTS } from '../endpoints';

// Cache để throttle view increments
const viewIncrementCache = new Map<string, number>();
const THROTTLE_DURATION = 30000; // 30 giây

export interface ViewResponse {
  success: boolean;
  message: string;
  views?: number;
}

export interface ViewStats {
  views: number;
}

export const viewService = {
  /**
   * Tăng lượt xem cho phim với throttling
   * @param movieId ID của phim
   * @param progress Tiến độ xem (giây) 
   * @param duration Tổng thời lượng (giây)
   */
  async incrementMovieView(
    movieId: string | number, 
    progress: number = 0, 
    duration: number = 0
  ): Promise<ViewResponse> {
    const cacheKey = `movie_${movieId}`;
    const now = Date.now();
    const lastIncrement = viewIncrementCache.get(cacheKey);
    
    // Throttling: chỉ cho phép increment mỗi 30 giây
    if (lastIncrement && now - lastIncrement < THROTTLE_DURATION) {
      return {
        success: false,
        message: `Vui lòng đợi ${Math.ceil((THROTTLE_DURATION - (now - lastIncrement)) / 1000)} giây trước khi tăng lượt xem`,
      };
    }

    try {
      const response = await apiClient.post<ViewResponse>(
        API_ENDPOINTS.VIEWS.INCREMENT_MOVIE(movieId),
        { progress, duration }
      );
      
      // Cập nhật cache
      viewIncrementCache.set(cacheKey, now);
      
      return response;
    } catch (error) {
      console.error('Lỗi khi tăng lượt xem phim:', error);
      throw error;
    }
  },

  /**
   * Tăng lượt xem cho tập phim với throttling
   * @param episodeId ID của tập phim
   * @param movieId ID của phim
   * @param progress Tiến độ xem (giây)
   * @param duration Tổng thời lượng (giây)
   */
  async incrementEpisodeView(
    episodeId: string | number,
    movieId: string | number,
    progress: number = 0,
    duration: number = 0
  ): Promise<ViewResponse> {
    const cacheKey = `episode_${episodeId}`;
    const now = Date.now();
    const lastIncrement = viewIncrementCache.get(cacheKey);
    
    // Throttling: chỉ cho phép increment mỗi 30 giây
    if (lastIncrement && now - lastIncrement < THROTTLE_DURATION) {
      return {
        success: false,
        message: `Vui lòng đợi ${Math.ceil((THROTTLE_DURATION - (now - lastIncrement)) / 1000)} giây trước khi tăng lượt xem`,
      };
    }

    try {
      const response = await apiClient.post<ViewResponse>(
        API_ENDPOINTS.VIEWS.INCREMENT_EPISODE(episodeId),
        { movieId, progress, duration }
      );
      
      // Cập nhật cache
      viewIncrementCache.set(cacheKey, now);
      
      return response;
    } catch (error) {
      console.error('Lỗi khi tăng lượt xem tập phim:', error);
      throw error;
    }
  },

  /**
   * Lấy tổng lượt xem của phim từ database
   * @param movieId ID của phim
   */
  async getMovieViews(movieId: string | number): Promise<ViewStats> {
    try {
      return await apiClient.get<ViewStats>(
        API_ENDPOINTS.VIEWS.GET_MOVIE_VIEWS(movieId)
      );
    } catch (error) {
      console.error('Lỗi khi lấy lượt xem phim:', error);
      throw error;
    }
  },

  /**
   * Lấy tổng lượt xem của tập phim từ database
   * @param episodeId ID của tập phim
   */
  async getEpisodeViews(episodeId: string | number): Promise<ViewStats> {
    try {
      return await apiClient.get<ViewStats>(
        API_ENDPOINTS.VIEWS.GET_EPISODE_VIEWS(episodeId)
      );
    } catch (error) {
      console.error('Lỗi khi lấy lượt xem tập phim:', error);
      throw error;
    }
  },

  /**
   * Xóa cache throttling (dùng cho testing hoặc reset)
   */
  clearThrottleCache(): void {
    viewIncrementCache.clear();
  },

  /**
   * Kiểm tra xem có thể increment view không
   */
  canIncrementView(movieId?: string | number, episodeId?: string | number): boolean {
    const cacheKey = episodeId ? `episode_${episodeId}` : `movie_${movieId}`;
    const lastIncrement = viewIncrementCache.get(cacheKey);
    
    if (!lastIncrement) return true;
    
    const now = Date.now();
    return now - lastIncrement >= THROTTLE_DURATION;
  }
};