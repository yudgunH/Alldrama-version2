import { Genre, Movie, MovieListResponse } from '@/types';
import { GenreStat } from '@/types/stats';
import { apiClient } from '../apiClient';
import { API_ENDPOINTS } from '../endpoints';

interface GenreMoviesResponse {
  genre: Genre;
  movies: Movie[];
}

interface CreateGenreResponse {
  message: string;
  genre: Genre;
}

interface UpdateGenreResponse {
  message: string;
  genre: Genre;
}

interface DeleteGenreResponse {
  message: string;
}

export const genreService = {
  /**
   * Lấy danh sách tất cả thể loại
   */
  async getAllGenres(): Promise<Genre[]> {
    return apiClient.get<Genre[]>(API_ENDPOINTS.GENRES.LIST);
  },

  /**
   * Lấy thông tin chi tiết thể loại
   * @param genreId ID của thể loại
   */
  async getGenreById(genreId: string | number): Promise<Genre> {
    return apiClient.get<Genre>(API_ENDPOINTS.GENRES.DETAIL(genreId));
  },

  /**
   * Lấy danh sách phim theo thể loại
   * @param genreId ID của thể loại
   */
  async getMoviesByGenreId(genreId: string | number): Promise<GenreMoviesResponse> {
    return apiClient.get<GenreMoviesResponse>(API_ENDPOINTS.GENRES.MOVIES(genreId));
  },

  /**
   * Tạo thể loại mới (chỉ Admin)
   * @param name Tên thể loại
   */
  async createGenre(name: string): Promise<CreateGenreResponse> {
    return apiClient.post<CreateGenreResponse>(API_ENDPOINTS.GENRES.CREATE, { name });
  },

  /**
   * Cập nhật thể loại (chỉ Admin)
   * @param genreId ID của thể loại
   * @param name Tên thể loại mới
   */
  async updateGenre(genreId: string | number, name: string): Promise<UpdateGenreResponse> {
    return apiClient.put<UpdateGenreResponse>(API_ENDPOINTS.GENRES.UPDATE(genreId), { name });
  },

  /**
   * Xóa thể loại (chỉ Admin)
   * @param genreId ID của thể loại
   */
  async deleteGenre(genreId: string | number): Promise<DeleteGenreResponse> {
    return apiClient.delete<DeleteGenreResponse>(API_ENDPOINTS.GENRES.DELETE(genreId));
  },

  /**
   * Lấy thống kê về thể loại phim
   * @returns Danh sách thống kê thể loại
   */
  async getGenreStats(): Promise<GenreStat[]> {
    return apiClient.get<GenreStat[]>(`${API_ENDPOINTS.STATS.OVERVIEW}/genres`);
  }
};