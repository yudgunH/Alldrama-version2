import { MovieComment } from '../../models/MovieComment';
import { Movie } from '../../models/Movie';
import { User } from '../../models/User';
import { Logger } from '../../utils/logger';
import { Op } from 'sequelize';

const logger = Logger.getLogger('CommentService');

/**
 * Interface cho tham số phân trang và sắp xếp
 */
export interface ListCommentsParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'ASC' | 'DESC';
}

/**
 * Interface cho tham số filter comments toàn bộ
 */
export interface ListAllCommentsParams extends ListCommentsParams {
  movieId?: number;
  userId?: number;
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

/**
 * Interface cho dữ liệu bình luận
 */
export interface CommentData {
  movieId: number;
  userId: number;
  userName: string;
  comment: string;
}

/**
 * Service quản lý bình luận phim
 */
export class CommentService {
  /**
   * Lấy danh sách bình luận của một phim
   */
  async getMovieComments(movieId: number, params: ListCommentsParams = {}): Promise<MovieComment[]> {
    try {
      const { 
        page = 1, 
        limit = 10, 
        sort = 'createdAt', 
        order = 'DESC' 
      } = params;
      
      const offset = (page - 1) * limit;
      
      const comments = await MovieComment.findAll({
        where: { movieId },
        limit,
        offset,
        order: [[sort, order]],
        include: [
          {
            model: User,
            attributes: ['id', 'full_name']
          }
        ]
      });
      
      return comments;
    } catch (error) {
      logger.error('Error fetching movie comments:', error);
      throw new Error('Lỗi khi lấy danh sách bình luận');
    }
  }

  /**
   * Lấy chi tiết một bình luận
   */
  async getCommentById(id: number): Promise<MovieComment> {
    try {
      const comment = await MovieComment.findByPk(id, {
        include: [
          {
            model: User,
            attributes: ['id', 'full_name']
          },
          {
            model: Movie,
            attributes: ['id', 'title']
          }
        ]
      });
      
      if (!comment) {
        throw new Error('Không tìm thấy bình luận');
      }
      
      return comment;
    } catch (error) {
      logger.error('Error fetching comment details:', error);
      throw error;
    }
  }

  /**
   * Tạo bình luận mới
   */
  async createComment(data: CommentData): Promise<MovieComment> {
    try {
      // Kiểm tra phim tồn tại
      const movie = await Movie.findByPk(data.movieId);
      if (!movie) {
        throw new Error('Không tìm thấy phim');
      }
      
      // Kiểm tra người dùng tồn tại
      const user = await User.findByPk(data.userId);
      if (!user) {
        throw new Error('Không tìm thấy người dùng');
      }
      
      // Tạo bình luận mới
      const comment = await MovieComment.create({
        movieId: data.movieId,
        userId: data.userId,
        userName: data.userName,
        comment: data.comment
      });
      
      return comment;
    } catch (error) {
      logger.error('Error creating comment:', error);
      throw error;
    }
  }

  /**
   * Cập nhật bình luận
   */
  async updateComment(id: number, userId: number, commentText: string): Promise<MovieComment> {
    try {
      const comment = await MovieComment.findByPk(id);
      
      if (!comment) {
        throw new Error('Không tìm thấy bình luận');
      }
      
      // Kiểm tra quyền: chỉ chủ bình luận mới được sửa
      if (comment.userId !== userId) {
        throw new Error('Không có quyền sửa bình luận này');
      }
      
      // Cập nhật bình luận
      comment.comment = commentText;
      await comment.save();
      
      return comment;
    } catch (error) {
      logger.error('Error updating comment:', error);
      throw error;
    }
  }

  /**
   * Xóa bình luận
   */
  async deleteComment(id: number, userId: number, isAdmin: boolean): Promise<void> {
    try {
      const comment = await MovieComment.findByPk(id);
      
      if (!comment) {
        throw new Error('Không tìm thấy bình luận');
      }
      
      // Kiểm tra quyền: admin hoặc chủ bình luận mới được xóa
      if (!isAdmin && comment.userId !== userId) {
        throw new Error('Không có quyền xóa bình luận này');
      }
      
      // Xóa bình luận
      await comment.destroy();
    } catch (error) {
      logger.error('Error deleting comment:', error);
      throw error;
    }
  }

  /**
   * Lấy tất cả bình luận trong hệ thống với filter
   */
  async getAllComments(params: ListAllCommentsParams = {}): Promise<{
    comments: MovieComment[];
    pagination: {
      total: number;
      totalPages: number;
      currentPage: number;
      limit: number;
    };
  }> {
    try {
      const { 
        page = 1, 
        limit = 10, 
        sort = 'createdAt', 
        order = 'DESC',
        movieId,
        userId,
        search,
        dateFrom,
        dateTo
      } = params;
      
      const offset = (page - 1) * limit;
      
      // Xây dựng điều kiện where
      const whereConditions: any = {};
      
      if (movieId) {
        whereConditions.movieId = movieId;
      }
      
      if (userId) {
        whereConditions.userId = userId;
      }
      
      if (search) {
        whereConditions[Op.or] = [
          { comment: { [Op.iLike]: `%${search}%` } },
          { userName: { [Op.iLike]: `%${search}%` } }
        ];
      }
      
      if (dateFrom || dateTo) {
        const dateCondition: any = {};
        if (dateFrom) dateCondition[Op.gte] = dateFrom;
        if (dateTo) dateCondition[Op.lte] = dateTo;
        whereConditions.createdAt = dateCondition;
      }
      
      // Đảm bảo sort field hợp lệ
      const validSortFields = ['createdAt', 'updatedAt', 'userName', 'comment'];
      const sortField = validSortFields.includes(sort) ? sort : 'createdAt';
      
      const { count, rows: comments } = await MovieComment.findAndCountAll({
        where: whereConditions,
        limit,
        offset,
        order: [[sortField, order]],
        include: [
          {
            model: User,
            attributes: ['id', 'full_name', 'email']
          },
          {
            model: Movie,
            attributes: ['id', 'title', 'posterUrl']
          }
        ]
      });
      
      const totalPages = Math.ceil(count / limit);
      
      return {
        comments,
        pagination: {
          total: count,
          totalPages,
          currentPage: page,
          limit
        }
      };
    } catch (error) {
      logger.error('Error fetching all comments:', error);
      throw new Error('Lỗi khi lấy danh sách tất cả bình luận');
    }
  }

  /**
   * Lấy bình luận mới nhất trong hệ thống
   */
  async getLatestComments(limit: number = 20): Promise<MovieComment[]> {
    try {
      const comments = await MovieComment.findAll({
        limit,
        order: [['createdAt', 'DESC']],
        include: [
          {
            model: User,
            attributes: ['id', 'full_name', 'email']
          },
          {
            model: Movie,
            attributes: ['id', 'title', 'posterUrl']
          }
        ]
      });
      
      return comments;
    } catch (error) {
      logger.error('Error fetching latest comments:', error);
      throw new Error('Lỗi khi lấy bình luận mới nhất');
    }
  }

  /**
   * Lấy bình luận theo người dùng
   */
  async getCommentsByUser(userId: number, params: ListCommentsParams = {}): Promise<{
    comments: MovieComment[];
    pagination: {
      total: number;
      totalPages: number;
      currentPage: number;
      limit: number;
    };
  }> {
    try {
      const { 
        page = 1, 
        limit = 10, 
        sort = 'createdAt', 
        order = 'DESC' 
      } = params;
      
      const offset = (page - 1) * limit;
      
      // Kiểm tra người dùng có tồn tại không
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error('Không tìm thấy người dùng');
      }
      
      const { count, rows: comments } = await MovieComment.findAndCountAll({
        where: { userId },
        limit,
        offset,
        order: [[sort, order]],
        include: [
          {
            model: User,
            attributes: ['id', 'full_name', 'email']
          },
          {
            model: Movie,
            attributes: ['id', 'title', 'posterUrl']
          }
        ]
      });
      
      const totalPages = Math.ceil(count / limit);
      
      return {
        comments,
        pagination: {
          total: count,
          totalPages,
          currentPage: page,
          limit
        }
      };
    } catch (error) {
      logger.error('Error fetching user comments:', error);
      throw error;
    }
  }

  /**
   * Thống kê bình luận
   */
  async getCommentsStats(): Promise<{
    totalComments: number;
    commentsToday: number;
    commentsThisWeek: number;
    commentsThisMonth: number;
    topCommentedMovies: Array<{
      movieId: number;
      movieTitle: string;
      commentCount: number;
    }>;
  }> {
    try {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      // Tổng số bình luận
      const totalComments = await MovieComment.count();
      
      // Bình luận hôm nay
      const commentsToday = await MovieComment.count({
        where: {
          createdAt: {
            [Op.gte]: today
          }
        }
      });
      
      // Bình luận tuần này
      const commentsThisWeek = await MovieComment.count({
        where: {
          createdAt: {
            [Op.gte]: thisWeek
          }
        }
      });
      
      // Bình luận tháng này
      const commentsThisMonth = await MovieComment.count({
        where: {
          createdAt: {
            [Op.gte]: thisMonth
          }
        }
      });
      
      // Top phim có nhiều bình luận nhất
      const topCommentedMovies = await MovieComment.findAll({
        attributes: [
          'movieId',
          [require('sequelize').fn('COUNT', require('sequelize').col('MovieComment.id')), 'commentCount']
        ],
        include: [
          {
            model: Movie,
            attributes: ['title']
          }
        ],
        group: ['movieId', 'movie.id', 'movie.title'],
        order: [[require('sequelize').literal('commentCount'), 'DESC']],
        limit: 10
      });
      
      return {
        totalComments,
        commentsToday,
        commentsThisWeek,
        commentsThisMonth,
        topCommentedMovies: topCommentedMovies.map((item: any) => ({
          movieId: item.movieId,
          movieTitle: item.movie?.title || 'Unknown',
          commentCount: parseInt(item.dataValues.commentCount)
        }))
      };
    } catch (error) {
      logger.error('Error fetching comments stats:', error);
      throw new Error('Lỗi khi lấy thống kê bình luận');
    }
  }
} 