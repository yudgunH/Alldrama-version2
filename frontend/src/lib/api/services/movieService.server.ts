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
    // Use backend API URL for server-side requests (match next.config.ts)
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://alldramaz.com';
    console.log(`🔧 [ServerMovieService] Initialized with baseUrl: ${this.baseUrl}`);
  }

  /**
   * Fetch movie by ID - server-side safe with fallback
   */
  async getMovieById(movieId: number): Promise<Movie | null> {
    console.log(`🎬 [ServerMovieService] Fetching movie ${movieId} from ${this.baseUrl}`);
    
    try {
      const fullUrl = `${this.baseUrl}/api/movies/${movieId}`;
      console.log(`🌐 [ServerMovieService] Request URL: ${fullUrl}`);
      
      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        // Server-side fetch với cache và timeout
        next: {
          revalidate: 3600, // Cache for 1 hour
        },
        signal: AbortSignal.timeout(10000), // Increase timeout to 10 seconds
      });

      console.log(`📡 [ServerMovieService] Response status: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        if (response.status === 404) {
          console.warn(`❌ [ServerMovieService] Movie ${movieId} not found (404)`);
          return null;
        }
        throw new Error(`Failed to fetch movie: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const movie = data.movie || data;
      
      if (movie && movie.id) {
        console.log(`✅ [ServerMovieService] Successfully fetched movie: ${movie.title} (ID: ${movie.id})`);
        return movie;
      } else {
        console.warn(`⚠️ [ServerMovieService] Invalid movie data structure:`, data);
        return null;
      }
      
    } catch (error: any) {
      console.error(`💥 [ServerMovieService] Error fetching movie ${movieId}:`, {
        message: error?.message,
        name: error?.name,
        cause: error?.cause,
        stack: error?.stack?.substring(0, 500)
      });
      
      // In production, try to provide basic fallback metadata instead of complete failure
      if (process.env.NODE_ENV === 'production') {
        console.log(`🔄 [ServerMovieService] Providing fallback movie data for metadata`);
        return {
          id: movieId,
          title: `Phim ${movieId}`,
          summary: 'Xem phim trực tuyến tại AllDrama - Nền tảng phim châu Á hàng đầu với chất lượng cao và đa dạng thể loại.',
          releaseYear: 2024,
          duration: 120,
          rating: 8.0,
          views: 100000,
          posterUrl: 'https://media.alldrama.tech/placeholder.jpg',
          backdropUrl: 'https://media.alldrama.tech/placeholder.jpg',
          totalEpisodes: 1,
          trailerUrl: '',
          playlistUrl: '',
          genres: [{ id: 1, name: 'Drama' }],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      } else {
        // Development mode - use mock data
        return getMockMovieData(movieId);
      }
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