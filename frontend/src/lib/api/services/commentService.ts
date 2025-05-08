import { Comment } from '@/types';
import { apiClient } from '../apiClient';
import { API_ENDPOINTS } from '../endpoints';

export interface CreateCommentRequest {
  movieId: string | number;
  comment: string;
  parentId?: string | number | null;
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
   * Lấy danh sách bình luận theo ID phim
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
  ): Promise<Comment[]> {
    const params = new URLSearchParams();
    params.append('page', String(page));
    params.append('limit', String(limit));
    params.append('sort', sort);
    params.append('order', order);
    
    const url = `${API_ENDPOINTS.COMMENTS.BY_MOVIE(movieId)}?${params.toString()}`;
    return apiClient.get<Comment[]>(url);
  },

  /**
   * Lấy chi tiết bình luận theo ID
   * @param commentId ID của bình luận
   */
  async getCommentById(commentId: string | number): Promise<Comment> {
    return apiClient.get<Comment>(API_ENDPOINTS.COMMENTS.DETAIL(commentId));
  },

  /**
   * Thêm bình luận mới
   * @param data Dữ liệu bình luận mới
   */
  async createComment(data: CreateCommentRequest): Promise<CommentResponse> {
    return apiClient.post<CommentResponse>(API_ENDPOINTS.COMMENTS.CREATE, data);
  },

  /**
   * Cập nhật bình luận
   * @param commentId ID của bình luận
   * @param data Dữ liệu cập nhật
   */
  async updateComment(
    commentId: string | number,
    data: UpdateCommentRequest
  ): Promise<CommentResponse> {
    return apiClient.put<CommentResponse>(API_ENDPOINTS.COMMENTS.UPDATE(commentId), data);
  },

  /**
   * Xóa bình luận
   * @param commentId ID của bình luận
   */
  async deleteComment(commentId: string | number): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(API_ENDPOINTS.COMMENTS.DELETE(commentId));
  }
};