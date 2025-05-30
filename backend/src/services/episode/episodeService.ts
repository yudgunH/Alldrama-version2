import { Episode } from '../../models/Episode';
import { Movie } from '../../models/Movie';
import { deleteAllEpisodeFiles } from '../media/r2Service';
import { Logger } from '../../utils/logger';

const logger = Logger.getLogger('EpisodeService');

/**
 * Interface cho dữ liệu tạo Episode mới
 */
export interface CreateEpisodeData {
  movieId: number;
  episodeNumber: number;
  playlistUrl?: string;
  title?: string;
  description?: string;
  thumbnailUrl?: string;
  duration?: number;
}

/**
 * Interface cho dữ liệu cập nhật Episode
 */
export interface UpdateEpisodeData {
  episodeNumber?: number;
  playlistUrl?: string;
  title?: string;
  description?: string;
  thumbnailUrl?: string;
  duration?: number;
  isProcessed?: boolean;
  processingError?: string;
}

/**
 * Service xử lý business logic cho Episode
 */
export class EpisodeService {
  /**
   * Lấy danh sách tập phim của một phim
   */
  public async getEpisodesByMovieId(movieId: number) {
    // Kiểm tra phim có tồn tại không
    const movie = await Movie.findByPk(movieId);
    if (!movie) {
      throw new Error('Không tìm thấy phim');
    }
    
    const episodes = await Episode.findAll({
      where: { movieId },
      order: [['episodeNumber', 'ASC']]
    });
    
    return episodes;
  }

  /**
   * Lấy chi tiết tập phim
   */
  public async getEpisodeById(id: number) {
    const episode = await Episode.findByPk(id, {
      include: [Movie]
    });
    
    if (!episode) {
      throw new Error('Không tìm thấy tập phim');
    }
    
    return episode;
  }

  /**
   * Tạo tập phim mới
   */
  public async createEpisode(data: CreateEpisodeData) {
    const { movieId, episodeNumber, playlistUrl } = data;
    
    // Kiểm tra phim có tồn tại không
    const movie = await Movie.findByPk(movieId);
    if (!movie) {
      throw new Error('Không tìm thấy phim');
    }
    
    // Kiểm tra số tập đã tồn tại chưa
    const existingEpisode = await Episode.findOne({
      where: {
        movieId,
        episodeNumber
      }
    });
    
    if (existingEpisode) {
      throw new Error('Số tập này đã tồn tại');
    }
    
    // Tạo tập phim mới
    const newEpisode = await Episode.create({
      ...data,
      views: 0
    });
    
    // Cập nhật tổng số tập cho phim
    await this.updateMovieTotalEpisodes(movieId);
    
    return newEpisode;
  }

  /**
   * Cập nhật tập phim
   */
  public async updateEpisode(id: number, data: UpdateEpisodeData) {
    const episode = await Episode.findByPk(id);
    
    if (!episode) {
      throw new Error('Không tìm thấy tập phim');
    }
    
    // Kiểm tra số tập đã tồn tại chưa nếu thay đổi số tập
    if (data.episodeNumber && data.episodeNumber !== episode.episodeNumber) {
      const existingEpisode = await Episode.findOne({
        where: {
          movieId: episode.movieId,
          episodeNumber: data.episodeNumber
        }
      });
      
      if (existingEpisode) {
        throw new Error('Số tập này đã tồn tại');
      }
    }
    
    // Cập nhật thông tin
    await episode.update(data);
    
    return episode;
  }

  /**
   * Xóa tập phim và tất cả file liên quan trên R2
   */
  public async deleteEpisode(id: number) {
    const episode = await Episode.findByPk(id);
    
    if (!episode) {
      throw new Error('Không tìm thấy tập phim');
    }
    
    const movieId = episode.movieId;
    const episodeId = episode.id;
    
    try {
      logger.info(`Bắt đầu xóa tập phim ${episodeId} (phim ${movieId}) và tất cả file liên quan`);
      
      // 1. Xóa tất cả file trên R2 trước
      await deleteAllEpisodeFiles(movieId, episodeId);
      logger.info(`Đã xóa tất cả file R2 cho tập phim ${episodeId}`);
      
      // 2. Xóa record trong database
      await episode.destroy();
      logger.info(`Đã xóa record database cho tập phim ${episodeId}`);
      
      // 3. Cập nhật tổng số tập cho phim
      await this.updateMovieTotalEpisodes(movieId);
      
      return true;
    } catch (error) {
      logger.error(`Lỗi khi xóa tập phim ${episodeId}:`, error);
      throw error;
    }
  }

  /**
   * Cập nhật tổng số tập cho một phim
   */
  private async updateMovieTotalEpisodes(movieId: number) {
    const movie = await Movie.findByPk(movieId);
    if (movie) {
      const episodeCount = await Episode.count({ where: { movieId } });
      await movie.update({ totalEpisodes: episodeCount });
    }
  }
} 