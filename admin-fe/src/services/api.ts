import axios from "axios";
import Cookies from "js-cookie";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// Tạo instance axios với cấu hình mặc định
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Thêm interceptor để tự động gắn token vào header
api.interceptors.request.use((config) => {
  const token = Cookies.get("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// API thể loại phim
export const genreApi = {
  getAll: () => api.get("/api/genres"),
  getById: (id: number) => api.get(`/api/genres/${id}`),
  create: (name: string) => api.post("/api/genres", { name }),
  update: (id: number, name: string) => api.put(`/api/genres/${id}`, { name }),
  delete: (id: number) => api.delete(`/api/genres/${id}`),
};

// API phim
export const movieApi = {
  getAll: (page = 1, limit = 10, sort = "createdAt", order = "DESC") =>
    api.get(`/api/movies?page=${page}&limit=${limit}&sort=${sort}&order=${order}`),
  search: (query: string, page = 1, limit = 10) =>
    api.get(`/api/movies/search?q=${query}&page=${page}&limit=${limit}`),
  getById: (id: number) => api.get(`/api/movies/${id}`),
  create: (movieData: any) => api.post("/api/movies", movieData),
  update: (id: number, movieData: any) => api.put(`/api/movies/${id}`, movieData),
  delete: (id: number) => api.delete(`/api/movies/${id}`),
};

// API tập phim
export const episodeApi = {
  getByMovieId: (movieId: number) => api.get(`/api/episodes/movie/${movieId}`),
  getById: (id: number) => api.get(`/api/episodes/${id}`),
  create: (episodeData: any) => api.post("/api/episodes", episodeData),
  update: (id: number, episodeData: any) => api.put(`/api/episodes/${id}`, episodeData),
  delete: (id: number) => api.delete(`/api/episodes/${id}`),
};

// API media
export const mediaApi = {
  // Upload trực tiếp
  uploadMoviePoster: (movieId: number, file: File) => {
    const formData = new FormData();
    formData.append("poster", file);
    return api.post(`/api/media/movies/${movieId}/poster`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
  uploadMovieBackdrop: (movieId: number, file: File) => {
    const formData = new FormData();
    formData.append("backdrop", file);
    return api.post(`/api/media/movies/${movieId}/backdrop`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
  uploadMovieTrailer: (movieId: number, file: File) => {
    const formData = new FormData();
    formData.append("trailer", file);
    return api.post(`/api/media/movies/${movieId}/trailer`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
  
  // Lấy presigned URL để upload trực tiếp
  getPresignedUrl: (params: {
    movieId: number;
    episodeId?: number;
    fileType: "poster" | "backdrop" | "trailer" | "video" | "thumbnail";
  }) => api.post("/api/media/presigned-url", params),
  
  // Upload video tập phim
  uploadEpisodeVideo: (movieId: number, episodeId: number, file: File) => {
    const formData = new FormData();
    formData.append("video", file);
    return api.post(`/api/media/episodes/${movieId}/${episodeId}/video`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
  
  // Kiểm tra trạng thái xử lý video
  checkProcessingStatus: (episodeId: number) =>
    api.get(`/api/media/episodes/${episodeId}/processing-status`),
    
  // Xóa media
  deleteMedia: (movieId: number, mediaType: "poster" | "backdrop" | "trailer") =>
    api.delete(`/api/media/movies/${movieId}/${mediaType}`),
}; 