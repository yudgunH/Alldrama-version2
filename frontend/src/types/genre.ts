export interface Genre {
  id: number;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface GenreWithMovies {
  genre: Genre;
  movies: {
    id: number;
    title: string;
    rating: number;
    views: number;
    summary: string;
    duration: string;
    totalEpisodes: number;
    releaseYear: number;
    posterUrl: string;
    trailerUrl: string;
    createdAt: string;
    updatedAt: string;
    genres: Genre[];
  }[];
}