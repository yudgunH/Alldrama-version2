import axios from "axios";
import Cookies from "js-cookie";

// Create base API instance
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "https://alldramaz.com",
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor to add auth token
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

// Media API
export const mediaApi = {
  // Get presigned URL for uploading media
  getPresignedUrl: (params: {
    movieId?: number;
    episodeId?: number;
    fileType: "poster" | "backdrop" | "trailer" | "video" | "thumbnail";
  }) => {
    return api.post("/api/media/presigned-url", params);
  },
  
  // Get processing status for an episode
  getProcessingStatus: (episodeId: number) => {
    return api.get(`/api/episodes/${episodeId}/processing-status`);
  },
  
  // Upload media with presigned URL
  uploadToPresignedUrl: (presignedUrl: string, file: File, onProgress?: (progress: number) => void) => {
    console.log("mediaApi.uploadToPresignedUrl: Bắt đầu upload với", { presignedUrl, fileType: file.type, fileSize: file.size });
    
    // Sử dụng fetch API trực tiếp thay vì axios để tránh vấn đề với preflight CORS
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      xhr.open('PUT', presignedUrl, true);
      xhr.setRequestHeader('Content-Type', file.type);
      
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          const progress = Math.round((event.loaded * 100) / event.total);
          console.log(`mediaApi.uploadToPresignedUrl: Progress ${progress}%`);
          onProgress(progress);
        }
      };
      
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          console.log("mediaApi.uploadToPresignedUrl: Upload thành công", { status: xhr.status });
          resolve({ status: xhr.status, statusText: xhr.statusText });
        } else {
          console.error("mediaApi.uploadToPresignedUrl: Lỗi khi upload", { status: xhr.status, response: xhr.responseText });
          reject(new Error(`Upload failed with status ${xhr.status}: ${xhr.statusText}`));
        }
      };
      
      xhr.onerror = () => {
        console.error("mediaApi.uploadToPresignedUrl: Network error");
        reject(new Error('Network error occurred during upload'));
      };
      
      xhr.onabort = () => {
        console.warn("mediaApi.uploadToPresignedUrl: Upload aborted");
        reject(new Error('Upload aborted'));
      };
      
      xhr.send(file);
    });
  },
  
  // Thông báo cho backend là đã upload video thành công
  notifyVideoUploaded: (movieId: number, episodeId: number) => {
    return api.post(`/api/media/episodes/${movieId}/${episodeId}/video-uploaded`);
  },
  
  // Kích hoạt quá trình xử lý HLS cho video - phương thức dự phòng
  startHLSProcessing: (movieId: number, episodeId: number) => {
    return api.post(`/api/media/episodes/${movieId}/${episodeId}/process-hls`);
  },
  
  // Upload trực tiếp với multipart/form-data (phương pháp cũ)
  uploadMoviePoster: (movieId: number, file: File, onProgress?: (progress: number) => void) => {
    const formData = new FormData();
    formData.append("poster", file);
    return api.post(`/api/media/movies/${movieId}/poster`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      }
    });
  },
  uploadMovieBackdrop: (movieId: number, file: File, onProgress?: (progress: number) => void) => {
    const formData = new FormData();
    formData.append("backdrop", file);
    return api.post(`/api/media/movies/${movieId}/backdrop`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      }
    });
  },
  uploadMovieTrailer: (movieId: number, file: File, onProgress?: (progress: number) => void) => {
    const formData = new FormData();
    formData.append("trailer", file);
    return api.post(`/api/media/movies/${movieId}/trailer`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      }
    });
  },
  uploadEpisodeVideo: (movieId: number, episodeId: number, file: File, onProgress?: (progress: number) => void) => {
    const formData = new FormData();
    formData.append("video", file);
    return api.post(`/api/media/episodes/${movieId}/${episodeId}/video`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      }
    });
  },
  
  // Xóa media
  deleteMedia: (movieId: number, mediaType: "poster" | "backdrop" | "trailer") =>
    api.delete(`/api/movies/${movieId}/${mediaType}`),
    
  // Xóa tập phim và media liên quan
  deleteEpisode: (movieId: number, episodeId: number) =>
    api.delete(`/api/episodes/${movieId}/${episodeId}`),
};

// Movie API
export const movieApi = {
  // Get all movies
  getAll: (page = 1, limit = 10) => {
    return api.get("/api/movies", {
      params: { page, limit }
    });
  },
  
  // Get movie by ID
  getById: (id: number) => {
    return api.get(`/api/movies/${id}`);
  },
  
  // Create new movie
  create: (data: any) => {
    return api.post("/api/movies", data);
  },
  
  // Update movie
  update: (id: number, data: any) => {
    return api.put(`/api/movies/${id}`, data);
  },
  
  // Delete movie
  delete: (id: number) => {
    return api.delete(`/api/movies/${id}`);
  },
  
  // Get movie episodes
  getEpisodes: (movieId: number) => {
    return api.get(`/api/movies/${movieId}/episodes`);
  },
  
  // Get movie statistics
  getStatistics: (movieId: number) => {
    return api.get(`/api/movies/${movieId}/statistics`);
  },
};

// Episode API
export const episodeApi = {
  // Get episode by ID
  getById: (id: number) => {
    return api.get(`/api/episodes/${id}`);
  },
  
  // Get episodes by movie ID
  getByMovieId: (movieId: number) => {
    return api.get(`/api/episodes/movie/${movieId}`);
  },
  
  // Create new episode
  create: (movieId: number, data: any) => {
    return api.post(`/api/episodes`, { ...data, movieId });
  },
  
  // Update episode
  update: (id: number, data: any) => {
    return api.put(`/api/episodes/${id}`, data);
  },
  
  // Delete episode
  delete: (id: number) => {
    return api.delete(`/api/episodes/${id}`);
  },
  
  // Get processing status
  getProcessingStatus: (id: number) => {
    return api.get(`/api/episodes/${id}/processing-status`);
  },
};

// Genre API
export const genreApi = {
  // Get all genres
  getAll: () => {
    return api.get("/api/genres");
  },
};

// User API
export const userApi = {
  // Get all users
  getAll: () => {
    return api.get("/api/users");
  },
  
  // Get user by ID
  getById: (id: number) => {
    return api.get(`/api/users/${id}`);
  },
  
  // Create new user
  create: (data: any) => {
    return api.post("/api/users", data);
  },
  
  // Update user
  update: (id: number, data: any) => {
    return api.put(`/api/users/${id}`, data);
  },
  
  // Delete user
  delete: (id: number) => {
    return api.delete(`/api/users/${id}`);
  },
};

export default api; 