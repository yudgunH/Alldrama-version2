'use client';

import { Suspense } from 'react';
import MovieDetail from '@/components/features/movie/MovieDetail';
import { useMovies } from '@/hooks/api/useMovies';
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
  
  // Use SWR for movie data with cache-first strategy
  const { data: movie, error: movieError, isLoading } = useSWR(
    movieId ? `movie-detail-${movieId}` : null,
    async () => {
      if (!movieId) return null;
      
      // Check cache first
      const cached = cacheManager.getMovieDetails(movieId);
      if (cached) {
        return cached;
      }
      
      // Fetch from API if not cached
      const movieData = await movieService.getMovieById(movieId);
      
      // Cache the result for 30 minutes
      cacheManager.setMovieDetails(movieId, movieData, 30 * 60 * 1000);
      
      return movieData;
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
      dedupingInterval: 60000, // 1 minute
      errorRetryCount: 2,
      shouldRetryOnError: (error) => {
        // Only retry on network errors, not 404s
        return !error?.response || error.response.status >= 500;
      }
    }
  );

  // Refresh favorites list when page loads (if authenticated) - only once
  useEffect(() => {
    if (isAuthenticated) {
      // Check if we've already refreshed favorites recently
      const lastRefresh = cacheManager.getStats('favorites-last-refresh');
      const now = Date.now();
      
      if (!lastRefresh || now - lastRefresh > 60000) { // Refresh max once per minute
        refreshFavorites();
        cacheManager.setStats('favorites-last-refresh', now, 60000);
      }
    }
  }, [isAuthenticated, refreshFavorites]);

  // Handle errors
  useEffect(() => {
    if (!slug) {
      setError("URL không hợp lệ");
      return;
    }

    if (!movieId) {
      setError("Không tìm thấy phim");
      return;
    }

    if (movieError) {
      console.error("Error fetching movie:", movieError);
      if (movieError?.response?.status === 404) {
        setError("Phim không tồn tại");
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
      <div className="h-[70vh] bg-gray-800/50 animate-pulse flex items-center justify-center">
        <Skeleton className="w-3/4 h-[80%] max-w-7xl mx-auto rounded-xl" />
      </div>
    );
  }
  
  // Show error state
  if (error || !movieId || !movie) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <Alert variant="destructive" className="bg-red-950/50 border-red-800 text-white">
          <AlertDescription className="text-center">
            <h1 className="text-2xl text-white font-bold">Không tìm thấy phim</h1>
            <p className="text-gray-400 mt-4">
              {error || "Phim bạn đang tìm không tồn tại hoặc đã bị xóa."}
            </p>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

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