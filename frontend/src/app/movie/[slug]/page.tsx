'use client';

import { Suspense } from 'react';
import MovieDetail from '@/components/features/movie/MovieDetail';
import { useEffect, useState, useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useParams } from 'next/navigation';
import { Movie } from '@/types';
import { getIdFromSlug } from '@/utils/url';
import { useAuth } from '@/hooks/api/useAuth';
import { useFavorites } from '@/hooks/api/useFavorites';
import { cacheManager } from '@/lib/cache/cacheManager';
import useSWR from 'swr';
import { movieService } from '@/lib/api/services/movieService';

export default function MovieDetailPage() {
  // Get slug from route params
  const params = useParams();
  const slug = params?.slug as string || '';
  
  // Extract movie ID from slug
  const movieId = useMemo(() => {
    if (!slug) return null;
    const id = getIdFromSlug(slug);
    return id && !isNaN(Number(id)) ? Number(id) : null;
  }, [slug]);

  // State for error handling
  const [error, setError] = useState<string | null>(null);
  
  // Get auth and favorites functionality
  const { isAuthenticated } = useAuth();
  const { refreshFavorites } = useFavorites();
  
  // SWR fetcher function với cache-first strategy
  const movieFetcher = async (key: string) => {
    const id = key.split('-')[2]; // Extract ID from 'movie-detail-{id}'
    const movieIdNum = Number(id);
    
    if (!movieIdNum || isNaN(movieIdNum)) {
      throw new Error('Invalid movie ID');
    }
    
    // Check cache first
    const cached = cacheManager.getMovieDetails(movieIdNum);
    if (cached) {
      console.log(`Using cached movie data for ID: ${movieIdNum}`);
      return cached;
    }
    
    // Fetch from API if not cached
    console.log(`Fetching movie data from API for ID: ${movieIdNum}`);
    try {
      const movieData = await movieService.getMovieById(movieIdNum);
      
      // Cache the result for 30 minutes
      cacheManager.setMovieDetails(movieIdNum, movieData, 30 * 60 * 1000);
      
      return movieData;
    } catch (error: any) {
      console.error(`Error fetching movie ${movieIdNum}:`, error);
      throw error;
    }
  };

  // Use SWR for movie data
  const { 
    data: movie, 
    error: movieError, 
    isLoading,
    mutate: revalidateMovie
  } = useSWR(
    movieId ? `movie-detail-${movieId}` : null,
    movieFetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
      dedupingInterval: 30000, // 30 seconds
      errorRetryCount: 2,
      errorRetryInterval: 3000,
      shouldRetryOnError: (error) => {
        // Don't retry on 404 or client errors
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return false;
        }
        // Retry on network errors or server errors
        return true;
      },
      onError: (error) => {
        console.error('SWR Error fetching movie:', error);
      }
    }
  );

  // Refresh favorites list when page loads (if authenticated) - throttled
  useEffect(() => {
    if (isAuthenticated && refreshFavorites) {
      // Check if we've already refreshed favorites recently
      const lastRefresh = cacheManager.getStats('favorites-last-refresh');
      const now = Date.now();
      
      if (!lastRefresh || now - lastRefresh > 60000) { // Refresh max once per minute
        refreshFavorites();
        cacheManager.setStats('favorites-last-refresh', now, 60000);
      }
    }
  }, [isAuthenticated, refreshFavorites]);

  // Handle errors with better error messages
  useEffect(() => {
    if (!slug) {
      setError("URL không hợp lệ - thiếu thông tin phim");
      return;
    }

    if (!movieId) {
      setError("Không thể xác định ID phim từ URL");
      return;
    }

    if (movieError) {
      console.error("Movie fetch error:", movieError);
      
      if (movieError?.response?.status === 404) {
        setError("Phim không tồn tại hoặc đã bị xóa");
      } else if (movieError?.response?.status === 403) {
        setError("Bạn không có quyền xem phim này");
      } else if (movieError?.response?.status >= 500) {
        setError("Lỗi server - vui lòng thử lại sau");
      } else if (movieError?.code === 'NETWORK_ERROR') {
        setError("Lỗi kết nối mạng - vui lòng kiểm tra internet");
      } else {
        setError("Đã xảy ra lỗi khi tải thông tin phim");
      }
      return;
    }

    // Clear error if everything is ok
    setError(null);
  }, [slug, movieId, movieError]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900">
        <div className="h-[70vh] bg-gray-800/50 animate-pulse flex items-center justify-center">
          <div className="text-center">
            <Skeleton className="w-16 h-16 rounded-full mx-auto mb-4" />
            <Skeleton className="w-48 h-6 mx-auto mb-2" />
            <Skeleton className="w-32 h-4 mx-auto" />
          </div>
        </div>
      </div>
    );
  }
  
  // Show error state with retry option
  if (error || !movieId || (!movie && !isLoading)) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="max-w-md mx-auto px-4 text-center">
          <Alert variant="destructive" className="bg-red-950/50 border-red-800 text-white">
            <AlertDescription>
              <h1 className="text-xl font-bold mb-4">Không tìm thấy phim</h1>
              <p className="text-gray-400 mb-6">
                {error || "Phim bạn đang tìm không tồn tại hoặc đã bị xóa."}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => {
                    setError(null);
                    revalidateMovie();
                  }}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
                >
                  Thử lại
                </button>
                <button
                  onClick={() => window.history.back()}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors"
                >
                  Quay lại
                </button>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  // Render movie detail if we have data
  if (movie) {
    return (
      <div>
        <Suspense fallback={
          <div className="h-[70vh] bg-gray-800/50 animate-pulse flex items-center justify-center">
            <Skeleton className="w-3/4 h-[80%] max-w-7xl mx-auto rounded-xl" />
          </div>
        }>
          <MovieDetail movieId={movieId} initialData={movie} />
        </Suspense>
      </div>
    );
  }

  // Fallback loading state
  return (
    <div className="min-h-screen bg-gray-900">
      <div className="h-[70vh] bg-gray-800/50 animate-pulse flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p>Đang tải thông tin phim...</p>
        </div>
      </div>
    </div>
  );
}