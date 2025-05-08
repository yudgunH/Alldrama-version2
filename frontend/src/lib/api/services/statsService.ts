import { apiClient } from '../apiClient';
import { API_ENDPOINTS } from '../endpoints';

// Types based on the API documentation
export interface TopMovie {
  id: number;
  title: string;
  views: number;
  posterUrl: string;
}

export interface TopEpisode {
  id: number;
  episodeNumber: number;
  views: number;
  movieId: number;
  movie: {
    title: string;
    posterUrl: string;
  };
}

export interface MovieStats {
  movie: {
    id: number;
    title: string;
    totalViews: number;
  };
  episodeStats: Array<{
    id: number;
    episodeNumber: number;
    views: number;
  }>;
  totalEpisodeViews: number;
  dailyViews: Array<{
    date: string;
    count: string;
  }>;
}

export interface EpisodeStats {
  episode: {
    id: number;
    movieId: number;
    episodeNumber: number;
    title: string;
    totalViews: number;
  };
  dailyViews: Array<{
    date: string;
    count: string;
  }>;
  hourlyViews: Array<{
    hour: string;
    count: string;
  }>;
  percentOfMovieViews: number;
}

// For backward compatibility (until refactored)
export interface StatsTimeSeriesParams {
  startDate?: string;
  endDate?: string;
  metric?: string;
  timeRange?: 'day' | 'week' | 'month' | 'year';
}

export interface StatsTimeSeries {
  labels: string[];
  data: number[];
  total: number;
}

export interface StatsOverview {
  totalMovies: number;
  totalEpisodes: number;
  totalUsers: number;
  totalViews: number;
}

export const statsService = {
  /**
   * Lấy danh sách phim có nhiều lượt xem nhất
   * @param limit Số lượng phim muốn lấy (mặc định: 10)
   */
  async getTopMovies(limit: number = 10): Promise<TopMovie[]> {
    return apiClient.get<TopMovie[]>(`${API_ENDPOINTS.STATS.MOVIES_TOP}?limit=${limit}`);
  },

  /**
   * Lấy danh sách tập phim có nhiều lượt xem nhất
   * @param limit Số lượng tập phim muốn lấy (mặc định: 10)
   */
  async getTopEpisodes(limit: number = 10): Promise<TopEpisode[]> {
    return apiClient.get<TopEpisode[]>(`${API_ENDPOINTS.STATS.EPISODES_TOP}?limit=${limit}`);
  },

  /**
   * Lấy thống kê chi tiết lượt xem của một phim cụ thể
   * @param movieId ID của phim
   */
  async getMovieStats(movieId: string | number): Promise<MovieStats> {
    return apiClient.get<MovieStats>(API_ENDPOINTS.STATS.MOVIE_DETAIL(movieId));
  },

  /**
   * Lấy thống kê chi tiết lượt xem của một tập phim cụ thể
   * @param episodeId ID của tập phim
   */
  async getEpisodeStats(episodeId: string | number): Promise<EpisodeStats> {
    return apiClient.get<EpisodeStats>(API_ENDPOINTS.STATS.EPISODE_DETAIL(episodeId));
  },

  /**
   * Lấy thống kê tổng quan - Giữ lại cho khả năng tương thích ngược
   * Sẽ được loại bỏ khi tất cả các phần phụ thuộc được cập nhật
   */
  async getOverview(): Promise<StatsOverview> {
    return apiClient.get<StatsOverview>(API_ENDPOINTS.STATS.OVERVIEW);
  },

  /**
   * Lấy thống kê theo thời gian - Giữ lại cho khả năng tương thích ngược
   * Sẽ được loại bỏ khi tất cả các phần phụ thuộc được cập nhật
   * @param params Tham số thống kê
   */
  async getTimeSeries(params: StatsTimeSeriesParams): Promise<StatsTimeSeries> {
    return apiClient.get<StatsTimeSeries>(API_ENDPOINTS.STATS.TIME_SERIES, {
      params,
    });
  }
};