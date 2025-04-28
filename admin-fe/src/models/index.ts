// Định nghĩa các model cho ứng dụng

export interface Genre {
  id: number;
  name: string;
}

export interface Movie {
  id: number;
  title: string;
  rating: number;
  views: number;
  summary: string;
  duration: number;
  totalEpisodes: number;
  releaseYear: number;
  posterUrl: string | null;
  trailerUrl: string | null;
  playlistUrl: string | null;
  genres: Genre[];
}

export interface Episode {
  id: number;
  movieId: number;
  episodeNumber: number;
  title: string;
  description: string;
  playlistUrl: string | null;
  thumbnailUrl: string | null;
  duration: number;
  isProcessed: boolean;
  processingError: string | null;
  views: number;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: number;
  full_name: string;
  email: string;
  role: 'admin' | 'user' | 'subscriber';
  subscriptionExpiredAt: string | null;
  createdAt: string;
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