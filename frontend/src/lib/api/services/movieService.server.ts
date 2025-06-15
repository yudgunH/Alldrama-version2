import { Movie } from '@/types';

/**
 * Mock movie data for fallback when API is not available
 */
const getMockMovieData = (movieId: number): Movie => ({
  id: movieId,
  title: `Phim ${movieId}`,
  summary: 'Một bộ phim hấp dẫn với nội dung thú vị và diễn xuất tuyệt vời. Xem ngay tại AllDrama để trải nghiệm những khoảnh khắc tuyệt vời nhất.',
  releaseYear: 2024,
  duration: 120,
  rating: 8.5,
  views: 1000000,
  posterUrl: '/placeholder.svg',
  backdropUrl: '/placeholder.svg',
  totalEpisodes: 1,
  trailerUrl: '',
  playlistUrl: '',
  genres: [{ id: 1, name: 'Drama' }],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

/**
 * Server-safe movie service for use in server components
 * Không sử dụng auth token hoặc client-side stores
 */
class ServerMovieService {
  private baseUrl: string;

  constructor() {
    // Use backend API URL for server-side requests
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.alldrama.tech';
  }

  /**
   * Fetch movie by ID - server-side safe with fallback
   */
  async getMovieById(movieId: number): Promise<Movie | null> {
    try {
      const response = await fetch(`${this.baseUrl}/movies/${movieId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        // Server-side fetch với cache và timeout
        next: {
          revalidate: 3600, // Cache for 1 hour
        },
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Failed to fetch movie: ${response.status}`);
      }

      const data = await response.json();
      return data.movie || data; // Handle different response formats
    } catch (error: any) {
      console.warn(`API unavailable for movie ${movieId}, using mock data:`, error?.message || error);
      
      // Return mock data in development, null in production
      if (process.env.NODE_ENV === 'development') {
        return getMockMovieData(movieId);
      }
      
      return null;
    }
  }

  /**
   * Get movie URL for sharing
   */
  getMovieUrl(movieId: number, baseUrl: string = ''): string {
    const siteUrl = baseUrl || process.env.NEXT_PUBLIC_SITE_URL || 'https://alldrama.net';
    return `${siteUrl}/movie/${movieId}`;
  }

  /**
   * Get watch URL for sharing
   */
  getWatchUrl(movieId: number, episodeId: number = 1, baseUrl: string = ''): string {
    const siteUrl = baseUrl || process.env.NEXT_PUBLIC_SITE_URL || 'https://alldrama.net';
    return `${siteUrl}/watch/${movieId}/${episodeId}`;
  }
}

export const serverMovieService = new ServerMovieService(); 