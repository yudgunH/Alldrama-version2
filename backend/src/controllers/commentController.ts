import { Logger } from '../utils/logger';
import { Request, Response } from 'express';
import { getCommentService } from '../services';
import { JwtPayload } from '../middleware/auth';

const logger = Logger.getLogger('commentController');

// Định nghĩa lại interface cho Request để có thể truy cập user
interface AuthRequest extends Request {
  user?: JwtPayload;
}

// Lấy danh sách bình luận của một phim
export const getMovieComments = async (req: Request, res: Response) => {
  try {
    const { movieId } = req.params;
    const { page, limit, sort, order } = req.query;
    
    const commentService = getCommentService();
    
    const comments = await commentService.getMovieComments(
      Number(movieId),
      {
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        sort: sort as string | undefined,
        order: (order as 'ASC' | 'DESC' | undefined)
      }
    );
    
    return res.status(200).json(comments);
  } catch (error) {
    logger.error('Error fetching movie comments:', error);
    return res.status(500).json({ message: 'Lỗi khi lấy danh sách bình luận' });
  }
};

// Lấy chi tiết một bình luận
export const getCommentById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const commentService = getCommentService();
    
    try {
      const comment = await commentService.getCommentById(Number(id));
      return res.status(200).json(comment);
    } catch (error) {
      if (error instanceof Error && error.message === 'Không tìm thấy bình luận') {
        return res.status(404).json({ message: error.message });
      }
      throw error;
    }
  } catch (error) {
    logger.error('Error fetching comment:', error);
    return res.status(500).json({ message: 'Lỗi khi lấy thông tin bình luận' });
  }
};

// Tạo bình luận mới
export const createComment = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Bạn cần đăng nhập để bình luận' });
    }
    
    const { movieId, comment } = req.body;
    
    if (!movieId || !comment) {
      return res.status(400).json({ message: 'Thiếu thông tin bắt buộc' });
    }
    
    const commentService = getCommentService();
    
    try {
      const newComment = await commentService.createComment({
        movieId: Number(movieId),
        userId: req.user.id,
        userName: req.user.email.split('@')[0], // Sử dụng phần đầu của email làm username
        comment
      });
      
      return res.status(201).json({
        message: 'Tạo bình luận thành công',
        comment: newComment
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Không tìm thấy phim' || error.message === 'Không tìm thấy người dùng') {
          return res.status(404).json({ message: error.message });
        }
      }
      throw error;
    }
  } catch (error) {
    logger.error('Error creating comment:', error);
    return res.status(500).json({ message: 'Lỗi khi tạo bình luận' });
  }
};

// Cập nhật bình luận
export const updateComment = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Bạn cần đăng nhập để cập nhật bình luận' });
    }
    
    const { id } = req.params;
    const { comment } = req.body;
    
    if (!comment) {
      return res.status(400).json({ message: 'Nội dung bình luận không được để trống' });
    }
    
    const commentService = getCommentService();
    
    try {
      const updatedComment = await commentService.updateComment(
        Number(id),
        req.user.id,
        comment
      );
      
      return res.status(200).json({
        message: 'Cập nhật bình luận thành công',
        comment: updatedComment
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Không tìm thấy bình luận') {
          return res.status(404).json({ message: error.message });
        }
        if (error.message === 'Không có quyền sửa bình luận này') {
          return res.status(403).json({ message: error.message });
        }
      }
      throw error;
    }
  } catch (error) {
    logger.error('Error updating comment:', error);
    return res.status(500).json({ message: 'Lỗi khi cập nhật bình luận' });
  }
};

// Xóa bình luận
export const deleteComment = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Bạn cần đăng nhập để xóa bình luận' });
    }
    
    const { id } = req.params;
    const isAdmin = req.user.role === 'admin';
    
    const commentService = getCommentService();
    
    try {
      await commentService.deleteComment(
        Number(id),
        req.user.id,
        isAdmin
      );
      
      return res.status(200).json({ message: 'Xóa bình luận thành công' });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Không tìm thấy bình luận') {
          return res.status(404).json({ message: error.message });
        }
        if (error.message === 'Không có quyền xóa bình luận này') {
          return res.status(403).json({ message: error.message });
        }
      }
      throw error;
    }
  } catch (error) {
    logger.error('Error deleting comment:', error);
    return res.status(500).json({ message: 'Lỗi khi xóa bình luận' });
  }
};

// Lấy tất cả bình luận trong hệ thống (admin only)
export const getAllComments = async (req: Request, res: Response) => {
  try {
    const { 
      page, 
      limit, 
      sort, 
      order, 
      movieId, 
      userId, 
      search, 
      dateFrom, 
      dateTo 
    } = req.query;
    
    const commentService = getCommentService();
    
    // Parse date strings nếu có
    let parsedDateFrom: Date | undefined;
    let parsedDateTo: Date | undefined;
    
    if (dateFrom && typeof dateFrom === 'string') {
      parsedDateFrom = new Date(dateFrom);
    }
    
    if (dateTo && typeof dateTo === 'string') {
      parsedDateTo = new Date(dateTo);
    }
    
    const result = await commentService.getAllComments({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      sort: sort as string | undefined,
      order: (order as 'ASC' | 'DESC' | undefined),
      movieId: movieId ? Number(movieId) : undefined,
      userId: userId ? Number(userId) : undefined,
      search: search as string | undefined,
      dateFrom: parsedDateFrom,
      dateTo: parsedDateTo
    });
    
    return res.status(200).json(result);
  } catch (error) {
    logger.error('Error fetching all comments:', error);
    return res.status(500).json({ message: 'Lỗi khi lấy danh sách tất cả bình luận' });
  }
};

// Lấy bình luận mới nhất
export const getLatestComments = async (req: Request, res: Response) => {
  try {
    const { limit } = req.query;
    const commentService = getCommentService();
    
    const comments = await commentService.getLatestComments(
      limit ? Number(limit) : undefined
    );
    
    return res.status(200).json(comments);
  } catch (error) {
    logger.error('Error fetching latest comments:', error);
    return res.status(500).json({ message: 'Lỗi khi lấy bình luận mới nhất' });
  }
};

// Lấy bình luận theo người dùng
export const getCommentsByUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { page, limit, sort, order } = req.query;
    
    const commentService = getCommentService();
    
    try {
      const result = await commentService.getCommentsByUser(
        Number(userId),
        {
          page: page ? Number(page) : undefined,
          limit: limit ? Number(limit) : undefined,
          sort: sort as string | undefined,
          order: (order as 'ASC' | 'DESC' | undefined)
        }
      );
      
      return res.status(200).json(result);
    } catch (error) {
      if (error instanceof Error && error.message === 'Không tìm thấy người dùng') {
        return res.status(404).json({ message: error.message });
      }
      throw error;
    }
  } catch (error) {
    logger.error('Error fetching user comments:', error);
    return res.status(500).json({ message: 'Lỗi khi lấy bình luận của người dùng' });
  }
};

// Lấy bình luận của chính mình
export const getMyComments = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Bạn cần đăng nhập để xem bình luận của mình' });
    }
    
    const { page, limit, sort, order } = req.query;
    const commentService = getCommentService();
    
    const result = await commentService.getCommentsByUser(
      req.user.id,
      {
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        sort: sort as string | undefined,
        order: (order as 'ASC' | 'DESC' | undefined)
      }
    );
    
    return res.status(200).json(result);
  } catch (error) {
    logger.error('Error fetching my comments:', error);
    return res.status(500).json({ message: 'Lỗi khi lấy bình luận của bạn' });
  }
};

// Lấy thống kê bình luận (admin only)
export const getCommentsStats = async (req: Request, res: Response) => {
  try {
    const commentService = getCommentService();
    const stats = await commentService.getCommentsStats();
    
    return res.status(200).json(stats);
  } catch (error) {
    logger.error('Error fetching comments stats:', error);
    return res.status(500).json({ message: 'Lỗi khi lấy thống kê bình luận' });
  }
}; 