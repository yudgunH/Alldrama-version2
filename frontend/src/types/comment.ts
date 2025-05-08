import { User } from "./auth";
import { Movie } from "./movie";

export interface Comment {
  id: number;
  comment: string;
  movieId: number;
  userId: number;
  userName: string;
  createdAt: string;
  updatedAt: string;
  user?: User
  movie?: Movie
  parentId?: number | null;
  replies?: Comment[];
}

export interface CommentRequest {
  movieId: string | number;
  comment: string;
  parentId?: string | number | null;
}

export interface UpdateCommentRequest {
  comment: string;
}

export interface CommentResponse {
  message: string;
  comment: Comment;
}