// Định nghĩa các model cho ứng dụng

export interface Genre {
  id: number;
  name: string;
}

export interface Movie {
  id: number;
  title: string;
  summary: string;
  releaseYear: number;
  duration: number;
  totalEpisodes: number;
  genres: Genre[];
  genreIds: number[];
  views: number;
  rating: number;
  posterUrl: string | null;
  backdropUrl: string | null;
  trailerUrl: string | null;
  isProcessed: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Episode {
  id: number;
  movieId: number;
  episodeNumber: number;
  title: string;
  description: string | null;
  duration: number | null;
  views: number;
  rating: number;
  thumbnailUrl: string | null;
  playlistUrl: string | null;
  isProcessed: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: number;
  movieId: number;
  userId: number;
  userName: string;
  comment: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: number;
    full_name: string;
  };
}

export interface UploadProgress {
  id: string;
  title: string;
  progress: number;
}

export interface EpisodeUploadProgress {
  id: string;
  movieTitle: string;
  episodeNumber: number;
  progress: number;
}

export interface PresignedUrlResponse {
  presignedUrl: string;
  contentType: string;
  cdnUrl: string;
  expiresIn: number;
}

export interface ProcessingStatus {
  episodeId: number;
  isProcessed: boolean;
  processingError: string | null;
  playlistUrl: string | null;
  thumbnailUrl: string | null;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
} 