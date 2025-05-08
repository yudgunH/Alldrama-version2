import { Movie, MovieListResponse, MovieSearchParams, CreateMovieDto, UpdateMovieDto } from '@/types';
import { apiClient } from '../apiClient';
import { API_ENDPOINTS } from '../endpoints';

export const movieService = {
  /**
   * Lấy danh sách phim với phân trang và lọc
   * @param params Tham số tìm kiếm và phân trang
   */
  async getMovies(params?: Partial<MovieSearchParams>): Promise<MovieListResponse> {
    const queryParams: Record<string, string> = {};
    
    if (params) {
      if (params.page) queryParams.page = String(params.page);
      if (params.limit) queryParams.limit = String(params.limit);
      if (params.sort) queryParams.sort = params.sort;
      if (params.order) queryParams.order = params.order;
    }
    
    return apiClient.get<MovieListResponse>(API_ENDPOINTS.MOVIES.LIST, { params: queryParams });
  },

  /**
   * Lấy chi tiết phim theo ID
   * @param movieId ID của phim
   */
  async getMovieById(movieId: string | number): Promise<Movie> {
    return apiClient.get<Movie>(API_ENDPOINTS.MOVIES.DETAIL(movieId));
  },

  /**
   * Tìm kiếm phim theo từ khóa, thể loại, năm phát hành
   * @param params Tham số tìm kiếm và phân trang
   */
  async searchMovies(params: Partial<MovieSearchParams>): Promise<MovieListResponse> {
    const queryParams: Record<string, string> = {};
    
    if (params.q) queryParams.q = params.q;
    if (params.genre) queryParams.genre = String(params.genre);
    if (params.year) queryParams.year = String(params.year);
    if (params.page) queryParams.page = String(params.page);
    if (params.limit) queryParams.limit = String(params.limit);
    if (params.sort) queryParams.sort = params.sort;
    if (params.order) queryParams.order = params.order;
    
    return apiClient.get<MovieListResponse>(API_ENDPOINTS.MOVIES.SEARCH, {
      params: queryParams
    });
  },

  /**
   * Tạo phim mới (chỉ Admin)
   * @param movieData Dữ liệu phim mới
   */
  async createMovie(movieData: CreateMovieDto): Promise<Movie> {
    return apiClient.post<Movie>(API_ENDPOINTS.MOVIES.CREATE, movieData);
  },

  /**
   * Cập nhật phim (chỉ Admin)
   * @param movieId ID của phim
   * @param movieData Dữ liệu cập nhật
   */
  async updateMovie(movieId: string | number, movieData: UpdateMovieDto): Promise<Movie> {
    return apiClient.patch<Movie>(API_ENDPOINTS.MOVIES.UPDATE(movieId), movieData);
  },

  /**
   * Xóa phim (chỉ Admin)
   * @param movieId ID của phim
   */
  async deleteMovie(movieId: string | number): Promise<void> {
    return apiClient.delete(API_ENDPOINTS.MOVIES.DELETE(movieId));
  },

  /**
   * Lấy phim phổ biến (dựa trên rating và views)
   * Sử dụng API LIST với tham số sort
   * @param limit Số lượng phim trả về
   */
  async getPopularMovies(limit: number = 10): Promise<MovieListResponse> {
    return this.getMovies({
      sort: 'views',
      order: 'DESC',
      limit
    });
  },

  /**
   * Lấy phim mới nhất
   * Sử dụng API LIST với tham số sort
   * @param limit Số lượng phim trả về
   */
  async getNewestMovies(limit: number = 10): Promise<MovieListResponse> {
    return this.getMovies({
      sort: 'createdAt',
      order: 'DESC',
      limit
    });
  },

  /**
   * Lấy phim theo thể loại
   * Sử dụng API search với tham số genre
   * @param genreId ID của thể loại
   * @param limit Số lượng phim trả về
   */
  async getMoviesByGenre(genreId: number, limit: number = 10): Promise<MovieListResponse> {
    return this.searchMovies({
      genre: genreId,
      limit
    });
  }
};