import { useState, useCallback } from 'react';
import useSWR from 'swr';
import { Comment } from '@/types';
import { commentService, CreateCommentRequest, UpdateCommentRequest } from '@/lib/api/services/commentService';
import { toast } from 'react-hot-toast';
import { API_ENDPOINTS } from '@/lib/api/endpoints';

export const useComments = (movieId: string | number, initialPage: number = 1, initialLimit: number = 10) => {
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [sort, setSort] = useState<string>('createdAt');
  const [order, setOrder] = useState<'ASC' | 'DESC'>('DESC');

  // SWR key
  const key = movieId ? 
    `${API_ENDPOINTS.COMMENTS.BY_MOVIE(movieId)}?page=${page}&limit=${limit}&sort=${sort}&order=${order}` 
    : null;

  // Fetcher function for SWR
  const fetcher = useCallback(
    async () => {
      if (!movieId) return [];
      try {
        return await commentService.getCommentsByMovieId(movieId, page, limit, sort, order);
      } catch (error) {
        console.error('Error fetching comments:', error);
        throw error;
      }
    },
    [movieId, page, limit, sort, order]
  );

  // Use SWR hook
  const { data, error, isLoading, isValidating, mutate } = useSWR<Comment[]>(
    key,
    fetcher
  );

  // Add a new comment
  const addComment = useCallback(
    async (commentText: string, parentId?: string | number) => {
      if (!movieId) {
        toast.error('Không thể thêm bình luận');
        return null;
      }

      try {
        const commentData: CreateCommentRequest = {
          movieId: movieId,
          comment: commentText,
          parentId: parentId || null,
        };

        const result = await commentService.createComment(commentData);
        
        // Refresh comments
        await mutate();
        toast.success('Đã thêm bình luận');
        return result.comment;
      } catch (err) {
        toast.error('Không thể thêm bình luận');
        return null;
      }
    },
    [movieId, mutate]
  );

  // Update comment
  const updateComment = useCallback(
    async (commentId: string | number, commentText: string) => {
      try {
        const updateData: UpdateCommentRequest = { comment: commentText };
        const result = await commentService.updateComment(commentId, updateData);
        
        // Refresh comments
        await mutate();
        toast.success('Đã cập nhật bình luận');
        return result.comment;
      } catch (err) {
        toast.error('Không thể cập nhật bình luận');
        return null;
      }
    },
    [mutate]
  );

  // Delete comment
  const deleteComment = useCallback(
    async (commentId: string | number) => {
      try {
        await commentService.deleteComment(commentId);
        
        // Refresh comments
        await mutate();
        toast.success('Đã xóa bình luận');
        return true;
      } catch (err) {
        toast.error('Không thể xóa bình luận');
        return false;
      }
    },
    [mutate]
  );

  // Get comment by ID
  const getComment = useCallback(
    async (commentId: string | number) => {
      try {
        return await commentService.getCommentById(commentId);
      } catch (err) {
        toast.error('Không thể lấy thông tin bình luận');
        return null;
      }
    },
    []
  );

  // Pagination
  const goToPage = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  // Change sort
  const changeSort = useCallback((newSort: string, newOrder: 'ASC' | 'DESC' = 'DESC') => {
    setSort(newSort);
    setOrder(newOrder);
  }, []);

  return {
    comments: data || [],
    loading: isLoading,
    isValidating,
    error,
    addComment,
    updateComment,
    deleteComment,
    getComment,
    refreshComments: mutate,
    goToPage,
    changeSort,
    currentPage: page,
    totalPages: Math.ceil((data?.length || 0) / limit),
    setLimit,
  };
};