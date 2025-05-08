import { Genre } from './genre';

export interface Movie {
  id: number;
  title: string;
  rating: number;
  views: number;
  summary: string;
  duration: number;
  totalEpisodes: number;
  releaseYear: number;
  posterUrl: string;
  trailerUrl: string;
  playlistUrl: string;
  createdAt?: string;
  updatedAt?: string;
  backdropUrl?: string;
  genres: Genre[];
}

export interface MovieListResponse {
  movies: Movie[];
  pagination: {
    total: number;
    totalPages: number;
    currentPage: number;
    limit: number;
  }
}

export interface MovieSearchParams {
  q?: string;
  genre?: number;
  year?: number;
  page?: number;
  limit?: number;
  sort?: 'title' | 'rating' | 'views' | 'releaseYear' | 'createdAt';
  order?: 'ASC' | 'DESC';
}

export interface CreateMovieDto {
  title: string;
  summary: string;
  duration: number;
  totalEpisodes: number;
  releaseYear: number;
  posterUrl?: string;
  trailerUrl?: string;
  playlistUrl?: string;
  genreIds: number[];
}

export interface UpdateMovieDto {
  title?: string;
  summary?: string;
  duration?: number;
  totalEpisodes?: number;
  releaseYear?: number;
  posterUrl?: string;
  trailerUrl?: string;
  playlistUrl?: string;
  backdropUrl?: string;
  genreIds?: number[];
}