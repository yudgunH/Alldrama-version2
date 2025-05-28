// Định nghĩa các endpoints API

export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    LOGOUT: '/api/auth/logout',
    LOGOUT_ALL: '/api/auth/logout-all',
    ME: '/api/auth/me',
    REFRESH: '/api/auth/refresh',
    EMAIL_AUTH: '/api/auth/email-auth',
    CSRF_TOKEN: '/api/auth/csrf-token',
  },
  
  // Users
  USERS: {
    LIST: '/api/users',
    DETAIL: (id: string | number) => `/api/users/${id}`,
    UPDATE: (id: string | number) => `/api/users/${id}`,
    DELETE: (id: string | number) => `/api/users/${id}`,
    CHANGE_PASSWORD: (id: string | number) => `/api/users/${id}`,
    FAVORITES: (id: string | number) => `/api/users/${id}/favorites`,
    WATCH_HISTORY: (id: string | number) => `/api/users/${id}/watch-history`,
  },
  
  // Movies
  MOVIES: {
    LIST: '/api/movies',
    DETAIL: (id: string | number) => `/api/movies/${id}`,
    SEARCH: '/api/movies/search',
    CREATE: '/api/movies',
    UPDATE: (id: string | number) => `/api/movies/${id}`,
    DELETE: (id: string | number) => `/api/movies/${id}`,
  },
  
  // Episodes
  EPISODES: {
    LIST_BY_MOVIE: (movieId: string | number) => `/api/episodes/movie/${movieId}`,
    DETAIL: (id: string | number) => `/api/episodes/${id}`,
    CREATE: '/api/episodes',
    UPDATE: (id: string | number) => `/api/episodes/${id}`,
    DELETE: (id: string | number) => `/api/episodes/${id}`,
  },
  
  // Genres
  GENRES: {
    LIST: '/api/genres',
    DETAIL: (id: string | number) => `/api/genres/${id}`,
    MOVIES: (id: string | number) => `/api/genres/${id}/movies`,
    CREATE: '/api/genres',
    UPDATE: (id: string | number) => `/api/genres/${id}`,
    DELETE: (id: string | number) => `/api/genres/${id}`,
  },
  
  // Comments
  COMMENTS: {
    BY_MOVIE: (movieId: string | number) => `/api/comments/movies/${movieId}`,
    DETAIL: (id: string | number) => `/api/comments/${id}`,
    CREATE: '/api/comments',
    UPDATE: (id: string | number) => `/api/comments/${id}`,
    DELETE: (id: string | number) => `/api/comments/${id}`,
  },
  
  // Favorites
  FAVORITES: {
    LIST: '/api/favorites',
    ADD: '/api/favorites',
    REMOVE: (movieId: string | number) => `/api/favorites/${movieId}`,
    CHECK: (movieId: string | number) => `/api/favorites/check/${movieId}`,
  },
  
  // Watch History
  WATCH_HISTORY: {
    LIST: '/api/watch-history',
    ADD: '/api/watch-history',
    DELETE: (id: string | number) => `/api/watch-history/${id}`,
  },
  
  // Media
  MEDIA: {
    UPLOAD_POSTER: (movieId: string | number) => `/api/media/movies/${movieId}/poster`,
    UPLOAD_BACKDROP: (movieId: string | number) => `/api/media/movies/${movieId}/backdrop`,
    UPLOAD_TRAILER: (movieId: string | number) => `/api/media/movies/${movieId}/trailer`,
    UPLOAD_EPISODE_VIDEO: (movieId: string | number, episodeId: string | number) => 
      `/api/media/episodes/${movieId}/${episodeId}/video`,
    PROCESSING_STATUS: (episodeId: string | number) => `/api/media/episodes/${episodeId}/processing-status`,
    PRESIGNED_URL: '/api/media/presigned-url',
    DELETE_MEDIA: (movieId: string | number, mediaType: string) => `/api/media/movies/${movieId}/${mediaType}`,
    DELETE_EPISODE: (movieId: string | number, episodeId: string | number) => `/api/media/episodes/${movieId}/${episodeId}`,
    DELETE_MOVIE: (movieId: string | number) => `/api/media/movies/${movieId}`,
    LIST_FILES: (prefix: string) => `/api/media/files/${prefix}`,
  },
  
  // Views
  VIEWS: {
    INCREMENT_MOVIE: (movieId: string | number) => `/api/views/movie/${movieId}`,
    INCREMENT_EPISODE: (episodeId: string | number) => `/api/views/episode/${episodeId}`,
    GET_MOVIE_VIEWS: (movieId: string | number) => `/api/views/movie/${movieId}`,
    GET_EPISODE_VIEWS: (episodeId: string | number) => `/api/views/episode/${episodeId}`,
  },
  
  // Stats
  STATS: {
    MOVIES_TOP: '/api/stats/movies/top',
    EPISODES_TOP: '/api/stats/episodes/top',
    MOVIE_DETAIL: (id: string | number) => `/api/stats/movies/${id}`,
    EPISODE_DETAIL: (id: string | number) => `/api/stats/episodes/${id}`,
    OVERVIEW: '/api/stats/overview',
    TIME_SERIES: '/api/stats/time-series',
  },
};