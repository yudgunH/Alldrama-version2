import { Comment } from '@/types';
import { apiClient } from '../apiClient';
import { API_ENDPOINTS } from '../endpoints';
import { cacheManager } from '@/lib/cache/cacheManager';

export interface CreateCommentRequest {
  movieId: number;
  comment: string;
}

export interface UpdateCommentRequest {
  comment: string;
}

export interface CommentResponse {
  message: string;
  comment: Comment;
}

export const commentService = {
  /**
   * Lấy danh sách bình luận theo ID phim với cache-first strategy
   * @param movieId ID của phim
   * @param page Số trang
   * @param limit Số lượng mỗi trang
   * @param sort Trường sắp xếp (mặc định: 'createdAt')
   * @param order Thứ tự sắp xếp ('ASC' hoặc 'DESC', mặc định: 'DESC')
   */
  async getCommentsByMovieId(
    movieId: string | number,
    page: number = 1,
    limit: number = 10,
    sort: string = 'createdAt',
    order: 'ASC' | 'DESC' = 'DESC'
  ): Promise<{ comments: Comment[]; total: number }> {
    // Check cache first
    const cacheKey = `${movieId}-p${page}-l${limit}`;
    const cached = cacheManager.getComments(movieId, page, limit);
    
    if (cached) {
      console.log('commentService - Cache hit for:', cacheKey);
      return cached;
    }

    console.log('commentService - Cache miss, fetching from API for:', cacheKey);
    
    const params = new URLSearchParams();
    params.append('page', String(page));
    params.append('limit', String(limit));
    params.append('sort', sort);
    params.append('order', order);
    
    const url = `${API_ENDPOINTS.COMMENTS.BY_MOVIE(movieId)}?${params.toString()}`;
    console.log('commentService - API URL:', url);
    
    try {
      const result = await apiClient.get<any>(url);
      console.log('commentService - Raw API Response:', result);
      
      let formattedResult: { comments: Comment[]; total: number };
      
      // Handle different response formats from backend
      if (Array.isArray(result)) {
        // If backend returns direct array
        console.log('commentService - Backend returned array format');
        formattedResult = {
          comments: result,
          total: result.length
        };
      } else if (result && typeof result === 'object') {
        // If backend returns object with comments and total
        if (result.comments && Array.isArray(result.comments)) {
          console.log('commentService - Backend returned object format with comments array');
          formattedResult = {
            comments: result.comments,
            total: result.total || result.comments.length
          };
        } else if (result.data && Array.isArray(result.data)) {
          console.log('commentService - Backend returned object format with data array');
          formattedResult = {
            comments: result.data,
            total: result.total || result.data.length
          };
        } else {
          // Fallback
          console.log('commentService - Using fallback format');
          formattedResult = {
            comments: [],
            total: 0
          };
        }
      } else {
        // Fallback
        console.log('commentService - Using fallback format');
        formattedResult = {
          comments: [],
          total: 0
        };
      }
      
      // Cache the result with 5 minute TTL
      if (formattedResult.comments.length > 0 || page === 1) {
        cacheManager.setComments(movieId, page, limit, formattedResult, 5 * 60 * 1000);
        console.log('commentService - Cached result for:', cacheKey);
      }
      
      return formattedResult;
    } catch (error) {
      console.error('commentService - API Error:', error);
      throw error;
    }
  },

  /**
   * Lấy chi tiết bình luận theo ID
   * @param commentId ID của bình luận
   */
  async getCommentById(commentId: string | number): Promise<Comment> {
    return apiClient.get<Comment>(API_ENDPOINTS.COMMENTS.DETAIL(commentId));
  },

  /**
   * Thêm bình luận mới với optimistic update
   * @param data Dữ liệu bình luận mới
   */
  async createComment(data: CreateCommentRequest): Promise<CommentResponse> {
    try {
      const result = await apiClient.post<CommentResponse>(API_ENDPOINTS.COMMENTS.CREATE, data);
      
      // Optimistic cache update - add new comment to first page cache
      if (result.comment) {
        cacheManager.addCommentToCache(data.movieId, result.comment, 1, 10);
        console.log('commentService - Added new comment to cache optimistically');
      }
      
      return result;
    } catch (error) {
      console.error('commentService - Create comment error:', error);
      throw error;
    }
  },

  /**
   * Cập nhật bình luận với cache invalidation
   * @param commentId ID của bình luận
   * @param data Dữ liệu cập nhật
   */
  async updateComment(
    commentId: string | number,
    data: UpdateCommentRequest
  ): Promise<CommentResponse> {
    try {
      const result = await apiClient.put<CommentResponse>(API_ENDPOINTS.COMMENTS.UPDATE(commentId), data);
      
      // Update individual comment cache
      if (result.comment) {
        cacheManager.setComment(result.comment);
        console.log('commentService - Updated comment in cache');
      }
      
      return result;
    } catch (error) {
      console.error('commentService - Update comment error:', error);
      throw error;
    }
  },

  /**
   * Xóa bình luận với cache invalidation
   * @param commentId ID của bình luận
   */
  async deleteComment(commentId: string | number): Promise<{ message: string }> {
    try {
      // Get comment from cache first to know which movie to invalidate
      const cachedComment = cacheManager.getComment(commentId);
      
      const result = await apiClient.delete<{ message: string }>(API_ENDPOINTS.COMMENTS.DELETE(commentId));
      
      // Remove from cache optimistically
      if (cachedComment) {
        cacheManager.removeCommentFromCache(cachedComment.movieId, Number(commentId), 1, 10);
        console.log('commentService - Removed comment from cache optimistically');
      }
      
      return result;
    } catch (error) {
      console.error('commentService - Delete comment error:', error);
      throw error;
    }
  }
};