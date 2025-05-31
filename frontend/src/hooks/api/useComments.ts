import { useState, useCallback } from 'react';
import useSWR from 'swr';
import { Comment } from '@/types';
import { commentService, CreateCommentRequest, UpdateCommentRequest } from '@/lib/api/services/commentService';
import { toast } from 'react-hot-toast';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { cacheManager } from '@/lib/cache/cacheManager';

export const useComments = (movieId: string | number, initialPage: number = 1, initialLimit: number = 10) => {
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [sort, setSort] = useState<string>('createdAt');
  const [order, setOrder] = useState<'ASC' | 'DESC'>('DESC');

  // Debug logging
  console.log('useComments - Input params:', { movieId, page, limit, sort, order });

  // SWR key với cache fingerprint
  const key = movieId ? 
    `comments-${movieId}-p${page}-l${limit}-${sort}-${order}` 
    : null;

  console.log('useComments - SWR key:', key);

  // Optimized fetcher function với cache fallback
  const fetcher = useCallback(
    async () => {
      if (!movieId) return { comments: [], total: 0 };
      
      console.log('useComments - Fetching comments for movieId:', movieId);
      
      try {
        // Service đã handle cache internally
        const result = await commentService.getCommentsByMovieId(movieId, page, limit, sort, order);
        console.log('useComments - Fetch result:', result);
        return result;
      } catch (error) {
        console.error('useComments - Error fetching comments:', error);
        
        // Fallback to cache in case of network error
        const cached = cacheManager.getComments(movieId, page, limit);
        if (cached) {
          console.log('useComments - Using stale cache due to error');
          return cached;
        }
        
        throw error;
      }
    },
    [movieId, page, limit, sort, order]
  );

  // Optimized SWR configuration
  const { data, error, isLoading, isValidating, mutate } = useSWR<{ comments: Comment[]; total: number }>(
    key,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false, // Trust our cache
      dedupingInterval: 60000, // 1 minute deduplication
      focusThrottleInterval: 300000, // 5 minutes focus throttle
      errorRetryCount: 2,
      errorRetryInterval: 5000,
      // Use cache as fallback
      fallbackData: movieId ? (cacheManager.getComments(movieId, page, limit) || undefined) : undefined,
    }
  );

  // Debug logging for SWR result
  console.log('useComments - SWR result:', { data, error, isLoading });

  // Optimized add comment with optimistic update
  const addComment = useCallback(
    async (commentText: string, parentId?: string | number) => {
      if (!movieId) {
        toast.error('Không thể thêm bình luận');
        return null;
      }

      try {
        const commentData: CreateCommentRequest = {
          movieId: Number(movieId),
          comment: commentText,
        };

        // Optimistic update - tạm thời thêm comment vào UI
        const tempComment: Comment = {
          id: Date.now(), // Temporary ID
          comment: commentText,
          movieId: Number(movieId),
          userId: 0, // Will be filled by backend
          userName: 'You',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        // Update UI immediately
        if (data && page === 1) {
          const optimisticData = {
            comments: [tempComment, ...data.comments],
            total: data.total + 1
          };
          mutate(optimisticData, false); // Don't revalidate immediately
        }

        // Call API
        const result = await commentService.createComment(commentData);
        
        // Revalidate to get real data from server
        await mutate();
        
        return result.comment;
      } catch (err) {
        console.error('Error adding comment:', err);
        // Revert optimistic update on error
        await mutate();
        throw err;
      }
    },
    [movieId, mutate, data, page]
  );

  // Optimized delete comment with optimistic update
  const deleteComment = useCallback(
    async (commentId: string | number) => {
      try {
        // Optimistic update - remove comment from UI immediately
        if (data) {
          const optimisticData = {
            comments: data.comments.filter(c => c.id !== Number(commentId)),
            total: Math.max(0, data.total - 1)
          };
          mutate(optimisticData, false); // Don't revalidate immediately
        }

        // Call API
        await commentService.deleteComment(commentId);
        
        // Revalidate to get updated data
        await mutate();
        
        return true;
      } catch (err) {
        console.error('Error deleting comment:', err);
        // Revert optimistic update on error
        await mutate();
        throw err;
      }
    },
    [mutate, data]
  );

  // Update comment
  const updateComment = useCallback(
    async (commentId: string | number, commentText: string) => {
      try {
        const updateData: UpdateCommentRequest = { comment: commentText };
        const result = await commentService.updateComment(commentId, updateData);
        
        // Refresh comments
        await mutate();
        return result.comment;
      } catch (err) {
        console.error('Error updating comment:', err);
        throw err;
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
        console.error('Error getting comment:', err);
        throw err;
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
    comments: data?.comments || [],
    total: data?.total || 0,
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
    totalPages: Math.ceil((data?.total || 0) / limit),
    hasNextPage: page * limit < (data?.total || 0),
    setLimit,
  };
};