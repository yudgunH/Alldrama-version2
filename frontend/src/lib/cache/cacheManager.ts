import { Movie, Episode, Comment } from '@/types';

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

interface CacheStore {
  movies: Map<string, CacheItem<Movie[]>>;
  movieDetails: Map<string, CacheItem<Movie>>;
  episodes: Map<string, CacheItem<Episode[]>>;
  comments: Map<string, CacheItem<{ comments: Comment[]; total: number }>>;
  genres: Map<string, CacheItem<any>>;
  stats: Map<string, CacheItem<any>>;
}

class CacheManager {
  private cache: CacheStore;
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly LONG_TTL = 30 * 60 * 1000; // 30 minutes
  private readonly SHORT_TTL = 2 * 60 * 1000; // 2 minutes

  constructor() {
    this.cache = {
      movies: new Map(),
      movieDetails: new Map(),
      episodes: new Map(),
      comments: new Map(),
      genres: new Map(),
      stats: new Map(),
    };

    // Clean up expired cache every 5 minutes
    setInterval(() => this.cleanupExpiredCache(), 5 * 60 * 1000);
  }

  // Generic cache methods
  private isExpired<T>(item: CacheItem<T>): boolean {
    return Date.now() - item.timestamp > item.ttl;
  }

  private set<T>(store: Map<string, CacheItem<T>>, key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    store.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  private get<T>(store: Map<string, CacheItem<T>>, key: string): T | null {
    const item = store.get(key);
    if (!item || this.isExpired(item)) {
      store.delete(key);
      return null;
    }
    return item.data;
  }

  // Movie cache methods
  setMovies(key: string, movies: Movie[], ttl: number = this.DEFAULT_TTL): void {
    this.set(this.cache.movies, key, movies, ttl);
  }

  getMovies(key: string): Movie[] | null {
    return this.get(this.cache.movies, key);
  }

  setMovieDetails(movieId: string | number, movie: Movie, ttl: number = this.LONG_TTL): void {
    this.set(this.cache.movieDetails, String(movieId), movie, ttl);
  }

  getMovieDetails(movieId: string | number): Movie | null {
    return this.get(this.cache.movieDetails, String(movieId));
  }

  // Episode cache methods
  setEpisodes(movieId: string | number, episodes: Episode[], ttl: number = this.DEFAULT_TTL): void {
    // Ensure episodes is always an array
    const validEpisodes = Array.isArray(episodes) ? episodes : [];
    this.set(this.cache.episodes, String(movieId), validEpisodes, ttl);
  }

  getEpisodes(movieId: string | number): Episode[] | null {
    const episodes = this.get(this.cache.episodes, String(movieId));
    // Return null if not found, or return the array (even if empty)
    return episodes;
  }

  // Invalidate episode cache for a movie
  invalidateEpisodeCache(movieId: string | number): void {
    this.cache.episodes.delete(String(movieId));
  }

  // Comment cache methods
  setComments(
    movieId: string | number, 
    page: number = 1, 
    limit: number = 10,
    data: { comments: Comment[]; total: number }, 
    ttl: number = this.DEFAULT_TTL
  ): void {
    const key = `${movieId}-p${page}-l${limit}`;
    this.set(this.cache.comments, key, data, ttl);
    
    // Also cache individual comments for faster access
    data.comments.forEach(comment => {
      this.set(this.cache.stats, `comment-${comment.id}`, comment, ttl);
    });
  }

  getComments(movieId: string | number, page: number = 1, limit: number = 10): { comments: Comment[]; total: number } | null {
    const key = `${movieId}-p${page}-l${limit}`;
    return this.get(this.cache.comments, key);
  }

  // Get single comment from cache
  getComment(commentId: string | number): Comment | null {
    return this.get(this.cache.stats, `comment-${commentId}`);
  }

  // Set single comment in cache
  setComment(comment: Comment, ttl: number = this.DEFAULT_TTL): void {
    this.set(this.cache.stats, `comment-${comment.id}`, comment, ttl);
  }

  // Invalidate comment cache for a movie
  invalidateMovieComments(movieId: string | number): void {
    for (const [key] of this.cache.comments.entries()) {
      if (key.startsWith(`${movieId}-`)) {
        this.cache.comments.delete(key);
      }
    }
  }

  // Optimistic update for new comment
  addCommentToCache(movieId: string | number, newComment: Comment, page: number = 1, limit: number = 10): void {
    const key = `${movieId}-p${page}-l${limit}`;
    const cached = this.get(this.cache.comments, key);
    
    if (cached) {
      // Add new comment to the beginning and update total
      const updatedData = {
        comments: [newComment, ...cached.comments],
        total: cached.total + 1
      };
      this.set(this.cache.comments, key, updatedData, this.DEFAULT_TTL);
    }
    
    // Cache the individual comment
    this.setComment(newComment);
  }

  // Remove comment from cache
  removeCommentFromCache(movieId: string | number, commentId: number, page: number = 1, limit: number = 10): void {
    const key = `${movieId}-p${page}-l${limit}`;
    const cached = this.get(this.cache.comments, key);
    
    if (cached) {
      // Remove comment and update total
      const updatedData = {
        comments: cached.comments.filter(c => c.id !== commentId),
        total: Math.max(0, cached.total - 1)
      };
      this.set(this.cache.comments, key, updatedData, this.DEFAULT_TTL);
    }
    
    // Remove individual comment cache
    this.cache.stats.delete(`comment-${commentId}`);
  }

  // Genre cache methods
  setGenres(genres: any[], ttl: number = this.LONG_TTL): void {
    this.set(this.cache.genres, 'all', genres, ttl);
  }

  getGenres(): any[] | null {
    return this.get(this.cache.genres, 'all');
  }

  // Stats cache methods
  setStats(key: string, stats: any, ttl: number = this.SHORT_TTL): void {
    this.set(this.cache.stats, key, stats, ttl);
  }

  getStats(key: string): any | null {
    return this.get(this.cache.stats, key);
  }

  // Preload methods
  async preloadMovies(movieIds: (string | number)[], fetcher: (id: string | number) => Promise<Movie>): Promise<void> {
    const promises = movieIds.map(async (id) => {
      if (!this.getMovieDetails(id)) {
        try {
          const movie = await fetcher(id);
          this.setMovieDetails(id, movie);
        } catch (error) {
          console.warn(`Failed to preload movie ${id}:`, error);
        }
      }
    });

    await Promise.allSettled(promises);
  }

  // Cache cleanup
  private cleanupExpiredCache(): void {
    const stores = [
      this.cache.movies,
      this.cache.movieDetails,
      this.cache.episodes,
      this.cache.comments,
      this.cache.genres,
      this.cache.stats,
    ];

    stores.forEach((store) => {
      for (const [key, item] of store.entries()) {
        if (this.isExpired(item)) {
          store.delete(key);
        }
      }
    });
  }

  // Clear specific cache
  clearMovieCache(): void {
    this.cache.movies.clear();
    this.cache.movieDetails.clear();
  }

  clearEpisodeCache(): void {
    this.cache.episodes.clear();
  }

  clearCommentCache(): void {
    this.cache.comments.clear();
  }

  clearAllCache(): void {
    this.cache.movies.clear();
    this.cache.movieDetails.clear();
    this.cache.episodes.clear();
    this.cache.comments.clear();
    this.cache.genres.clear();
    this.cache.stats.clear();
    console.log('All cache cleared');
  }
}

// Export singleton instance
export const cacheManager = new CacheManager();
export default cacheManager; 