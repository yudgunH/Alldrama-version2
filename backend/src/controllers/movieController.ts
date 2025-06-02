import { Logger } from '../utils/logger';
import { Request, Response } from 'express';
import { Movie } from '../models/Movie';
import { Genre } from '../models/Genre';
import { Op } from 'sequelize';
import { cacheMovieData, getCachedMovieData, cacheSearchResults, getCachedSearchResults } from '../services/redisService';
import { getMovieService } from '../services';
import { deleteMovieMedia as deleteMovieMediaFromR2, deleteAllMovieFiles } from '../services/media/r2Service';

const logger = Logger.getLogger('movieController');

// Lấy danh sách phim
export const getMovies = async (req: Request, res: Response) => {
  try {
    const movieService = getMovieService();
    
    const params = {
      page: req.query.page ? Number(req.query.page) : 1,
      limit: req.query.limit ? Number(req.query.limit) : 10,
      sort: req.query.sort as string,
      order: (req.query.order as 'ASC' | 'DESC') || 'DESC'
    };
    
    const result = await movieService.getMovies(params);
    
    res.status(200).json(result);
  } catch (error) {
    logger.error('Error fetching movies:', error);
    res.status(500).json({ message: 'Lỗi khi lấy danh sách phim' });
  }
};

// Lấy chi tiết phim theo ID
export const getMovieById = async (req: Request, res: Response) => {
  try {
    const movieService = getMovieService();
    const { id } = req.params;
    
    const movie = await movieService.getMovieById(Number(id));
    
    if (!movie) {
      return res.status(404).json({ message: 'Không tìm thấy phim' });
    }
    
    res.status(200).json(movie);
  } catch (error) {
    logger.error('Error fetching movie:', error);
    res.status(500).json({ message: 'Lỗi khi lấy thông tin phim' });
  }
};

// Tạo phim mới
export const createMovie = async (req: Request, res: Response) => {
  try {
    const movieService = getMovieService();
    const movieData = req.body;
    
    const movie = await movieService.createMovie(movieData);
    
    res.status(201).json(movie);
  } catch (error) {
    logger.error('Error creating movie:', error);
    res.status(500).json({ message: 'Lỗi khi tạo phim mới' });
  }
};

// Cập nhật phim
export const updateMovie = async (req: Request, res: Response) => {
  try {
    const movieService = getMovieService();
    const { id } = req.params;
    const movieData = req.body;
    
    const updatedMovie = await movieService.updateMovie(Number(id), movieData);
    
    if (!updatedMovie) {
      return res.status(404).json({ message: 'Không tìm thấy phim' });
    }
    
    res.status(200).json(updatedMovie);
  } catch (error) {
    logger.error('Error updating movie:', error);
    res.status(500).json({ message: 'Lỗi khi cập nhật phim' });
  }
};

// Xóa phim
export const deleteMovie = async (req: Request, res: Response) => {
  try {
    const movieService = getMovieService();
    const { id } = req.params;
    
    const success = await movieService.deleteMovie(Number(id));
    
    if (!success) {
      return res.status(404).json({ message: 'Không tìm thấy phim' });
    }
    
    res.status(200).json({ message: 'Xóa phim thành công' });
  } catch (error) {
    logger.error('Error deleting movie:', error);
    res.status(500).json({ message: 'Lỗi khi xóa phim' });
  }
};

// Tìm kiếm phim
export const searchMovies = async (req: Request, res: Response) => {
  try {
    const { 
      q, // từ khóa tìm kiếm
      genre, // id thể loại
      year, // năm phát hành 
      page = 1, // trang hiện tại
      limit = 10, // số lượng kết quả mỗi trang
      sort = 'createdAt', // trường để sắp xếp
      order = 'DESC' // thứ tự sắp xếp (ASC hoặc DESC)
    } = req.query;

    // Tạo cache key dựa trên tham số tìm kiếm
    const cacheKey = `search:${q || ''}:${genre || ''}:${year || ''}:${page}:${limit}:${sort}:${order}`;
    
    // Kiểm tra cache
    const cachedResults = await getCachedSearchResults(cacheKey);
    if (cachedResults) {
      logger.debug(`Đã lấy kết quả tìm kiếm từ cache với key: ${cacheKey}`);
      return res.status(200).json(cachedResults);
    }

    // Khởi tạo điều kiện tìm kiếm
    const whereConditions: any = {};
    
    // Tìm kiếm theo từ khóa (trong tiêu đề và tóm tắt)
    if (q) {
      whereConditions[Op.or] = [
        { title: { [Op.iLike]: `%${q}%` } },
        { summary: { [Op.iLike]: `%${q}%` } }
      ];
    }
    
    // Tìm kiếm theo năm phát hành
    if (year) {
      whereConditions.releaseYear = year;
    }
    
    // Tạo điều kiện cho thể loại (nếu có)
    let genreCondition = {};
    if (genre) {
      genreCondition = {
        model: Genre,
        where: { id: genre }
      };
    } else {
      genreCondition = {
        model: Genre
      };
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
      where: whereConditions,
      include: [genreCondition],
      order: [[String(sortField), sortOrder]],
      limit: Number(limit),
      offset,
      distinct: true // Cần thiết khi sử dụng include để có count chính xác
    });
    
    // Tính toán thông tin phân trang
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
    await cacheSearchResults(cacheKey, result, 300); // cache 5 phút
    
    return res.status(200).json(result);
  } catch (error) {
    logger.error('Error searching movies:', error);
    return res.status(500).json({ message: 'Lỗi khi tìm kiếm phim' });
  }
};

// Xóa media cụ thể của phim (poster, backdrop, trailer)
export const deleteMovieMedia = async (req: Request, res: Response) => {
  try {
    const { id, mediaType } = req.params;
    
    // Kiểm tra mediaType hợp lệ
    if (!['poster', 'backdrop', 'trailer'].includes(mediaType)) {
      return res.status(400).json({ 
        message: 'Loại media không hợp lệ. Chỉ chấp nhận: poster, backdrop, trailer' 
      });
    }
    
    // Kiểm tra phim có tồn tại không
    const movie = await Movie.findByPk(Number(id));
    if (!movie) {
      return res.status(404).json({ message: 'Không tìm thấy phim' });
    }
    
    // Xóa file từ R2
    await deleteMovieMediaFromR2(Number(id), mediaType as 'poster' | 'backdrop' | 'trailer');
    
    // Cập nhật database để xóa URL
    const updateField = mediaType === 'poster' ? 'posterUrl' : 
                       mediaType === 'backdrop' ? 'backdropUrl' : 'trailerUrl';
    await movie.update({ [updateField]: null });
    
    res.status(200).json({ 
      message: `Đã xóa ${mediaType} thành công`,
      movieId: Number(id),
      mediaType 
    });
  } catch (error) {
    logger.error(`Error deleting movie media:`, error);
    res.status(500).json({ message: 'Lỗi khi xóa media của phim' });
  }
};

// Xóa tất cả file R2 của phim (không xóa record database)
export const deleteMovieFiles = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Kiểm tra phim có tồn tại không
    const movie = await Movie.findByPk(Number(id));
    if (!movie) {
      return res.status(404).json({ message: 'Không tìm thấy phim' });
    }
    
    // Xóa tất cả file từ R2
    await deleteAllMovieFiles(Number(id));
    
    // Cập nhật database để xóa tất cả URL media
    await movie.update({ 
      posterUrl: null,
      backdropUrl: null,
      trailerUrl: null
    });
    
    res.status(200).json({ 
      message: 'Đã xóa tất cả file của phim thành công',
      movieId: Number(id)
    });
  } catch (error) {
    logger.error(`Error deleting movie files:`, error);
    res.status(500).json({ message: 'Lỗi khi xóa tất cả file của phim' });
  }
}; 