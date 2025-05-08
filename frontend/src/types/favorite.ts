import { Movie } from './movie';

export interface Favorite {
  id: number;
  userId: number;
  movieId: number;
  favoritedAt: string;
  createdAt: string;
  updatedAt: string;
  movie?: Movie
}

export interface FavoriteRequest {
  movieId: string | number;
}

export interface FavoriteResponse {
  message: string;
  favorited: boolean;
}