import { Movie } from "./movie";

export interface Episode {
  id: number;
  movieId: number;
  episodeNumber: number;
  title: string;
  description: string;
  playlistUrl: string;
  thumbnailUrl: string;
  duration: number;
  isProcessed: boolean;
  processingError: string | null;
  views: number;
  createdAt: string;
  updatedAt: string;
  movie?: Movie
}


export interface EpisodeListResponse {
  episodes: Episode[];
  pagination: {
    total: number;
    totalPages: number;
    currentPage: number;
    limit: number;
  }
}

// Keep for backward compatibility with existing code
export interface PaginatedEpisodeResponse {
  data: Episode[];
  episodes: Episode[];
  meta: {
    totalItems: number;
    itemsPerPage: number;
    totalPages: number;
    currentPage: number;
  };
}

export interface CreateEpisodeDto {
  movieId: number;
  episodeNumber: number;
  title: string;
  description: string;
  playlistUrl?: string;
  thumbnailUrl?: string;
  duration?: number;
}

export interface UpdateEpisodeDto {
  episodeNumber?: number;
  title?: string;
  description?: string;
  playlistUrl?: string;
  thumbnailUrl?: string;
  duration?: number;
}

// Keep for backward compatibility with existing code
export interface EpisodeViewRequest {
  movieId: number;
  progress: number;
  duration: number;
}

// Keep for backward compatibility with existing code
export interface ViewResponse {
  success: boolean;
  message: string;
}

// Renamed but keeping the alias for backward compatibility
export interface ProcessingStatusResponse {
  status: 'processing' | 'completed' | 'failed';
  error?: string;
  progress?: number;
}

// New name for ProcessingStatusResponse
export interface EpisodeProcessingStatus extends ProcessingStatusResponse {}