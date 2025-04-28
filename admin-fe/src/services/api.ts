import axios from "axios";
import Cookies from "js-cookie";

// Sử dụng URL được cấu hình hoặc mặc định
const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://alldramaz.com";

// Tạo instance axios với cấu hình mặc định
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Đảm bảo cookies được gửi cùng các request
  timeout: 10000, // Đặt timeout sau 10 giây để tránh request treo quá lâu
});

// Thêm interceptor để tự động gắn token vào header
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error("Lỗi khi gửi request:", error);
    return Promise.reject(error);
  }
);

// Thêm interceptor để xử lý các response
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Xử lý trường hợp timeout
    if (error.code === "ECONNABORTED") {
      console.error("Request đã hết thời gian chờ");
      return Promise.reject(new Error("Request đã hết thời gian chờ. Vui lòng thử lại sau."));
    }
    
    // Kiểm tra nếu lỗi là unauthorized (401) và chưa thử refresh token
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Xử lý refresh token hoặc chuyển hướng đến trang đăng nhập
        // Có thể thực hiện call API refresh token ở đây
        
        // Nếu không có cơ chế refresh, chuyển hướng đến trang đăng nhập
        window.location.href = "/login";
        return Promise.reject(error);
      } catch (refreshError) {
        console.error("Không thể làm mới token:", refreshError);
        
        // Xóa token và chuyển hướng đến trang đăng nhập
        Cookies.remove("token", { path: "/" });
        window.location.href = "/login";
        return Promise.reject(error);
      }
    }
    
    return Promise.reject(error);
  }
);

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

// API người dùng
export const userApi = {
  getAll: () => api.get("/api/users"),
  getById: (id: number) => api.get(`/api/users/${id}`),
  update: (id: number, userData: any) => api.put(`/api/users/${id}`, userData),
  delete: (id: number) => api.delete(`/api/users/${id}`),
  getFavorites: (userId: number) => api.get(`/api/users/${userId}/favorites`),
  getWatchHistory: (userId: number) => api.get(`/api/users/${userId}/watch-history`),
}; 