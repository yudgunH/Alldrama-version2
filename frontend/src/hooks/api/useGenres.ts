import { useCallback, useState } from 'react';
import useSWR from 'swr';
import { Genre } from '@/types';
import { toast } from 'react-hot-toast';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { genreService } from '@/lib/api/services/genreService';
import { useAuth } from './useAuth';
import { apiClient } from '@/lib/api/apiClient';

export const useGenres = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // Check if user is admin
  const isAdmin = !!user && user.role === 'admin';

  // SWR key
  const key = API_ENDPOINTS.GENRES.LIST;

  // Fetcher function for SWR
  const fetcher = useCallback(async (url: string) => {
    try {
      return await apiClient.get<Genre[]>(url);
    } catch (error) {
      console.error('Error fetching genres:', error);
      throw error;
    }
  }, []);

  // Using SWR hook with long-term caching config
  const { data, error, isValidating, mutate } = useSWR<Genre[]>(key, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    revalidateIfStale: false,
    dedupingInterval: 3600000, // 1 hour
  });

  // Find genre by ID
  const findGenreById = useCallback(
    (id: number | string): Genre | undefined => {
      return data?.find((genre) => String(genre.id) === String(id));
    },
    [data]
  );

  // Find genre by name
  const findGenreByName = useCallback(
    (name: string): Genre | undefined => {
      return data?.find((genre) => genre.name.toLowerCase() === name.toLowerCase());
    },
    [data]
  );

  // Get all genres
  const getAllGenres = useCallback(async () => {
    try {
      return await genreService.getAllGenres();
    } catch (err) {
      toast.error('Không thể tải danh sách thể loại');  
    }
  }, []);

  // Get genre details by ID
  const getGenreById = useCallback(async (genreId: number | string) => {
    try {
      return await genreService.getGenreById(genreId);
    } catch (err) {
      toast.error('Không thể tải thông tin thể loại');
      return null;
    }
  }, []);

  // Get movies by genre
  const getMoviesByGenre = useCallback(async (genreId: number | string) => {
    try {
      return await genreService.getMoviesByGenreId(genreId);
    } catch (err) {
      toast.error('Không thể tải danh sách phim theo thể loại');
      return null;
    }
  }, []);

  // Create new genre (admin only)
  const createGenre = useCallback(async (name: string) => {
    if (!isAdmin) {
      toast.error('Bạn không có quyền thực hiện chức năng này');
      return null;
    }

    setIsLoading(true);
    try {
      const result = await genreService.createGenre(name);
      toast.success('Đã tạo thể loại mới thành công');
      await mutate(); // Refresh genres list
      return result;
    } catch (err) {
      toast.error('Không thể tạo thể loại mới');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [isAdmin, mutate]);

  // Update genre (admin only)
  const updateGenre = useCallback(async (genreId: number | string, name: string) => {
    if (!isAdmin) {
      toast.error('Bạn không có quyền thực hiện chức năng này');
      return null;
    }

    setIsLoading(true);
    try {
      const result = await genreService.updateGenre(genreId, name);
      toast.success('Đã cập nhật thể loại thành công');
      await mutate(); // Refresh genres list
      return result;
    } catch (err) {
      toast.error('Không thể cập nhật thể loại');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [isAdmin, mutate]);

  // Delete genre (admin only)
  const deleteGenre = useCallback(async (genreId: number | string) => {
    if (!isAdmin) {
      toast.error('Bạn không có quyền thực hiện chức năng này');
      return null;
    }

    setIsLoading(true);
    try {
      const result = await genreService.deleteGenre(genreId);
      toast.success('Đã xóa thể loại thành công');
      await mutate(); // Refresh genres list
      return result;
    } catch (err: any) {
      // Display specific error message if available
      const errorMessage = err.response?.data?.message || 'Không thể xóa thể loại';
      toast.error(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [isAdmin, mutate]);

  return {
    genres: data || [],
    loading: isLoading || !data && !error,
    isValidating,
    error,
    findGenreById,
    findGenreByName,
    getAllGenres,
    getGenreById,
    getMoviesByGenre,
    createGenre,
    updateGenre,
    deleteGenre,
    refreshGenres: mutate,
  };
};