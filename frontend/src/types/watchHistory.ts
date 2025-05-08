import { Episode } from './episode';
import { Movie } from './movie';

export interface WatchHistory {
  id: number;
  userId: number;
  movieId: number;
  episodeId: number;
  watchedAt: string;
  progress: number;
  duration: number;
  isCompleted: boolean;
  movie?: Movie
  episode?: Episode
}

export interface WatchHistoryRequest {
  movieId: string | number;
  episodeId: string | number;
  progress: number;
  duration: number;
}

export interface WatchHistoryResponse {
  message: string;
  watchHistory: WatchHistory;
  viewIncreased: boolean;
}