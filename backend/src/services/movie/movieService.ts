import { Movie } from '../../models/Movie';
import { Genre } from '../../models/Genre';
import { Episode } from '../../models/Episode';
import { cacheMovieData, getCachedMovieData, cacheSearchResults, getCachedSearchResults, CachedMovie } from '../redisService';
import { deleteAllMovieFiles } from '../media/r2Service';
import { Logger } from '../../utils/logger';

const logger = Logger.getLogger('MovieService');

/**
 * Interface cho tham số phân trang và sắp xếp
 */
export interface ListMoviesParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'ASC' | 'DESC';
}

/**
 * Interface cho dữ liệu phim
 */
export interface MovieData {
  title: string;
  description?: string;
  posterUrl?: string;
  backdropUrl?: string;
  trailerUrl?: string;
  releaseYear?: number;
  duration?: number;
  rating?: number;
  isFeatured?: boolean;
  isPublished?: boolean;
  genreIds?: number[];
  [key: string]: unknown;
}

/**
 * Service xử lý business logic cho Movie
 */
export class MovieService {
  /**
   * Lấy danh sách phim với phân trang và sắp xếp
   */
  public async getMovies(params: ListMoviesParams) {
    const {
      page = 1,
      limit = 10,
      sort = 'createdAt',
      order = 'DESC'
    } = params;

    // Tạo cache key dựa trên tham số truy vấn
    const cacheKey = `movies:${page}:${limit}:${sort}:${order}`;
    
    // Kiểm tra cache
    const cachedData = await getCachedSearchResults(cacheKey);
    if (cachedData) {
      logger.info(`Đã lấy dữ liệu phim từ cache với key: ${cacheKey}`);
      return cachedData;
    }
    
    // Tính offset cho phân trang
    const offset = (Number(page) - 1) * Number(limit);
    
    // Đảm bảo sort là một trường hợp lệ
    const validSortFields = ['title', 'rating', 'views', 'releaseYear', 'createdAt'];
    const sortField = validSortFields.includes(String(sort)) ? sort : 'createdAt';
    
    // Đảm bảo order là ASC hoặc DESC
    const sortOrder = order === 'ASC' ? 'ASC' : 'DESC';

    // Thực hiện truy vấn với phân trang
    const { count, rows: movies } = await Movie.findAndCountAll({
      include: [Genre],
      order: [[String(sortField), sortOrder]],
      limit: Number(limit),
      offset: offset
    });

    // Tính tổng số trang
    const totalPages = Math.ceil(count / Number(limit));
    
    // Kết quả trả về
    const result = {
      movies,
      pagination: {
        total: count,
        totalPages,
        currentPage: Number(page),
        limit: Number(limit)
      }
    };
    
    // Lưu vào cache
    await cacheSearchResults(cacheKey, result, 300);
    
    return result;
  }

  /**
   * Lấy chi tiết phim theo ID
   */
  public async getMovieById(id: number) {
    // Kiểm tra cache
    const cachedMovie = await getCachedMovieData(id);
    if (cachedMovie) {
      logger.info(`Đã lấy thông tin phim ID ${id} từ cache`);
      return cachedMovie;
    }
    
    // Không có trong cache, truy vấn database
    const movie = await Movie.findByPk(id, {
      include: [Genre]
    });
    
    if (movie) {
      // Lưu vào cache - movie có cấu trúc tương tự CachedMovie nên ép kiểu an toàn
      await cacheMovieData(id, movie.toJSON() as CachedMovie, 3600); // cache 1 giờ
    }
    
    return movie;
  }

  /**
   * Tạo phim mới
   */
  public async createMovie(movieData: MovieData) {
    // Loại bỏ trường genreIds khỏi dữ liệu trước khi tạo movie
    // vì trường này không tồn tại trong model Movie
    const { genreIds, ...movieDataWithoutGenres } = movieData;
    
    // Sử dụng MovieCreationAttributes thay vì any 
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const createdMovie = await Movie.create(movieDataWithoutGenres as any);
    
    // Nếu có genres, thêm vào bảng liên kết
    if (genreIds && genreIds.length > 0) {
      const genres = await Genre.findAll({
        where: {
          id: genreIds
        }
      });
      
      await createdMovie.$set('genres', genres);
    }
    
    // Lấy lại phim với thông tin genres
    return Movie.findByPk(createdMovie.id, {
      include: [Genre]
    });
  }

  /**
   * Cập nhật phim
   */
  public async updateMovie(id: number, movieData: MovieData) {
    const movie = await Movie.findByPk(id);
    
    if (!movie) {
      return null;
    }
    
    // Cập nhật thông tin phim
    await movie.update(movieData);
    
    // Nếu có genres, cập nhật bảng liên kết
    if (movieData.genreIds && movieData.genreIds.length > 0) {
      const genres = await Genre.findAll({
        where: {
          id: movieData.genreIds
        }
      });
      
      await movie.$set('genres', genres);
    }
    
    // Lấy lại phim với thông tin đã cập nhật
    return Movie.findByPk(id, {
      include: [Genre]
    });
  }

  /**
   * Xóa phim và tất cả các file liên quan trên R2
   */
  public async deleteMovie(id: number) {
    const movie = await Movie.findByPk(id, {
      include: [
        {
          model: Episode,
          attributes: ['id']
        }
      ]
    });
    
    if (!movie) {
      return false;
    }
    
    try {
      logger.info(`Bắt đầu xóa phim ${id} và tất cả file liên quan`);
      
      // 1. Xóa tất cả file trên R2 trước
      await deleteAllMovieFiles(id);
      logger.info(`Đã xóa tất cả file R2 cho phim ${id}`);
      
      // 2. Xóa các record trong database (episodes sẽ được xóa theo cascade)
      await movie.destroy();
      logger.info(`Đã xóa record database cho phim ${id}`);
      
      return true;
    } catch (error) {
      logger.error(`Lỗi khi xóa phim ${id}:`, error);
      throw error;
    }
  }
} 