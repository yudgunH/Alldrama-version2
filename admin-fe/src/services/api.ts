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
      
      // Kiểm tra nếu đang trong quá trình delete movie thì không redirect
      if (originalRequest.url && originalRequest.url.includes('/api/movies/') && originalRequest.method === 'delete') {
        console.warn("Lỗi 401 khi xóa movie, không redirect để tránh crash trang");
        return Promise.reject(error);
      }
      
      try {
        // Xử lý refresh token hoặc chuyển hướng đến trang đăng nhập
        // Có thể thực hiện call API refresh token ở đây
        
        // Nếu không có cơ chế refresh, chuyển hướng đến trang đăng nhập
        console.warn("Phát hiện lỗi 401, sẽ redirect đến login");
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
  
  // Gọi API CF-Worker để xử lý HLS (đúng quy trình)
  convertToHLS: (movieId: string | number, episodeId: string | number, videoKey: string) => {
    return axios.post(
      "https://media.alldrama.tech/api/convert-hls",
      {
        videoKey,
        movieId,
        episodeId
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer alldrama-production-token"
        }
      }
    );
  },
  
  // Kiểm tra trạng thái xử lý HLS
  checkHLSStatus: (jobId: string, movieId: string | number, episodeId: string | number) => {
    return axios.get(
      `https://media.alldrama.tech/api/hls-status/${jobId}/${movieId}/${episodeId}`
    );
  },
  
  // Thông báo cho backend là đã upload video thành công (phương thức cũ)
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
    
  // Xóa tập phim và media liên quan (bao gồm R2)
  deleteEpisode: (movieId: number, episodeId: number) =>
    api.delete(`/api/media/episodes/${movieId}/${episodeId}`),
  
  // Xóa phim và tất cả media liên quan (bao gồm R2)
  deleteMovie: (movieId: number) =>
    api.delete(`/api/media/movies/${movieId}`),
  
  // Xóa tất cả media của phim (poster, backdrop, trailer) trên R2
  deleteAllMovieMedia: (movieId: number) =>
    api.delete(`/api/media/movies/${movieId}/all-media`),
  
  // Xóa video và HLS files của episode trên R2
  deleteEpisodeMedia: (movieId: number, episodeId: number) =>
    api.delete(`/api/media/episodes/${movieId}/${episodeId}/video-media`),
  
  // API tiện ích để dọn dẹp media
  
  // Cleanup orphaned files (files không có reference trong database)
  cleanupOrphanedFiles: () =>
    api.post(`/api/media/cleanup/orphaned-files`),
  
  // Cleanup incomplete uploads (files bị stuck trong quá trình upload)
  cleanupIncompleteUploads: () =>
    api.post(`/api/media/cleanup/incomplete-uploads`),
  
  // Get storage usage statistics
  getStorageStats: () =>
    api.get(`/api/media/storage/stats`),
  
  // Helper function để xử lý CORS errors nhưng detect success
  handleR2ApiCall: async (apiCall: () => Promise<any>, operation: string) => {
    try {
      const result = await apiCall()
      console.log(`✅ ${operation} thành công qua direct API`)
      return { success: true, method: 'direct' }
    } catch (error: any) {
      // Kiểm tra nếu là CORS error nhưng có response
      if (error.code === 'ERR_NETWORK' || 
          error.message?.includes('CORS') || 
          error.message?.includes('Network Error') ||
          error.message?.includes('ERR_FAILED')) {
        
        // Nếu có response và status 200, coi như thành công
        if (error.response?.status === 200 || 
            error.request?.status === 200 ||
            error.message?.includes('200 (OK)')) {
          console.log(`✅ ${operation} thành công (CORS nhưng status 200)`)
          return { success: true, method: 'direct-cors' }
        }
        
        // CORS error thật sự, cần fallback
        console.warn(`⚠️ ${operation} bị CORS hoặc network error`)
        throw error
      }
      
      // Lỗi khác
      console.error(`❌ ${operation} thất bại:`, error)
      throw error
    }
  },
  
  // R2 Direct Cleanup APIs
  
  // Xóa folder trên R2 (xóa tất cả files có prefix)
  deleteR2Folder: (folderPath: string) =>
    axios.delete(`https://media.alldrama.tech/admin/delete-r2-prefix/${folderPath}`, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer alldrama-production-token"
      }
    }),
  
  // Xóa file riêng lẻ trên R2
  deleteR2File: (filePath: string) =>
    axios.delete(`https://media.alldrama.tech/admin/delete-r2-object/${filePath}`, {
      headers: {
        "Content-Type": "application/json", 
        "Authorization": "Bearer alldrama-production-token"
      }
    }),
  
  // Helper functions để xóa media của movie/episode
  
  // Xóa toàn bộ folder của movie trên R2
  deleteMovieR2Folder: (movieId: number) =>
    axios.delete(`https://media.alldrama.tech/admin/delete-r2-prefix/movies/${movieId}`, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer alldrama-production-token"
      }
    }),
  
  // Xóa toàn bộ episodes folder của movie trên R2
  deleteMovieEpisodesR2Folder: (movieId: number) =>
    axios.delete(`https://media.alldrama.tech/admin/delete-r2-prefix/episodes/${movieId}`, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer alldrama-production-token"
      }
    }),
  
  // Xóa toàn bộ folder của episode trên R2  
  deleteEpisodeR2Folder: (movieId: number, episodeId: number) =>
    axios.delete(`https://media.alldrama.tech/admin/delete-r2-prefix/episodes/${movieId}/${episodeId}`, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer alldrama-production-token"
      }
    }),
  
  // Xóa chỉ folder HLS của episode
  deleteEpisodeHLSFolder: (movieId: number, episodeId: number) =>
    axios.delete(`https://media.alldrama.tech/admin/delete-r2-prefix/episodes/${movieId}/${episodeId}/hls`, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer alldrama-production-token"
      }
    }),
  
  // Xóa file video gốc của episode
  deleteEpisodeOriginalVideo: (movieId: number, episodeId: number) =>
    axios.delete(`https://media.alldrama.tech/admin/delete-r2-object/episodes/${movieId}/${episodeId}/original.mp4`, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer alldrama-production-token"
      }
    }),
  
  // Xóa thumbnail của episode
  deleteEpisodeThumbnail: (movieId: number, episodeId: number) =>
    axios.delete(`https://media.alldrama.tech/admin/delete-r2-object/episodes/${movieId}/${episodeId}/thumbnail.jpg`, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer alldrama-production-token"
      }
    }),
  
  // Xóa poster của movie
  deleteMoviePosterFile: (movieId: number) =>
    axios.delete(`https://media.alldrama.tech/admin/delete-r2-object/movies/${movieId}/poster.jpg`, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer alldrama-production-token"
      }
    }),
  
  // Xóa backdrop của movie  
  deleteMovieBackdropFile: (movieId: number) =>
    axios.delete(`https://media.alldrama.tech/admin/delete-r2-object/movies/${movieId}/backdrop.jpg`, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer alldrama-production-token"
      }
    }),
  
  // Xóa trailer của movie
  deleteMovieTrailerFile: (movieId: number) =>
    axios.delete(`https://media.alldrama.tech/admin/delete-r2-object/movies/${movieId}/trailer.mp4`, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer alldrama-production-token"
      }
    }),
  
  // Batch cleanup utilities
  
  // Xóa tất cả episodes của một movie
  deleteAllMovieEpisodes: async (movieId: number, episodeIds: number[]) => {
    const deletePromises = episodeIds.map(episodeId => 
      mediaApi.deleteEpisodeR2Folder(movieId, episodeId)
    )
    return Promise.allSettled(deletePromises)
  },
  
  // Clean up specific file types
  cleanupMovieMedia: async (movieId: number, mediaTypes: ('poster' | 'backdrop' | 'trailer')[]) => {
    const deletePromises = mediaTypes.map(type => {
      switch (type) {
        case 'poster':
          return mediaApi.deleteMoviePosterFile(movieId)
        case 'backdrop':
          return mediaApi.deleteMovieBackdropFile(movieId)
        case 'trailer':
          return mediaApi.deleteMovieTrailerFile(movieId)
        default:
          return Promise.resolve()
      }
    })
    return Promise.allSettled(deletePromises)
  },
  
  // Clean up episode media selectively
  cleanupEpisodeMedia: async (movieId: number, episodeId: number, mediaTypes: ('video' | 'hls' | 'thumbnails' | 'thumbnail')[]) => {
    const deletePromises = mediaTypes.map(type => {
      switch (type) {
        case 'video':
          return mediaApi.deleteEpisodeOriginalVideo(movieId, episodeId)
        case 'hls':
          return mediaApi.deleteEpisodeHLSFolder(movieId, episodeId)
        case 'thumbnail':
          return mediaApi.deleteEpisodeThumbnail(movieId, episodeId)
        case 'thumbnails':
          return mediaApi.deleteR2Folder(`episodes/${movieId}/${episodeId}/thumbnails`)
        default:
          return Promise.resolve()
      }
    })
    return Promise.allSettled(deletePromises)
  },
  
  // Complete movie cleanup (movies folder + episodes folder)
  deleteCompleteMovieR2: async (movieId: number) => {
    const deletePromises = [
      mediaApi.handleR2ApiCall(
        () => mediaApi.deleteMovieR2Folder(movieId),
        `xóa movies folder ${movieId}`
      ),
      mediaApi.handleR2ApiCall(
        () => mediaApi.deleteMovieEpisodesR2Folder(movieId),
        `xóa episodes folder ${movieId}`
      )
    ]
    return Promise.allSettled(deletePromises)
  },
  
  // Xóa tất cả episodes của movie bằng cách lấy danh sách và xóa từng episode
  deleteAllMovieEpisodesIndividually: async (movieId: number) => {
    try {
      // Lấy danh sách episodes từ database
      const episodesResponse = await api.get(`/api/episodes/movie/${movieId}`)
      const episodes = episodesResponse.data || []
      
      console.log(`Tìm thấy ${episodes.length} episodes của movie ${movieId}:`, episodes.map((ep: any) => ep.id))
      
      if (episodes.length === 0) {
        console.log(`Movie ${movieId} không có episodes nào`)
        return { success: true, deletedCount: 0, totalCount: 0 }
      }
      
      // Xóa từng episode riêng lẻ trên R2
      const deletePromises = episodes.map((episode: any) => 
        mediaApi.handleR2ApiCall(
          () => mediaApi.deleteEpisodeR2Folder(movieId, episode.id),
          `xóa episode ${episode.id} của movie ${movieId}`
        )
      )
      
      const results = await Promise.allSettled(deletePromises)
      const successful = results.filter(r => r.status === 'fulfilled').length
      
      console.log(`Đã xóa ${successful}/${episodes.length} episodes của movie ${movieId}`)
      
      return { 
        success: successful > 0, 
        deletedCount: successful, 
        totalCount: episodes.length 
      }
    } catch (error) {
      console.error(`Lỗi khi xóa episodes của movie ${movieId}:`, error)
      throw error
    }
  },
  
  // Xóa episodes theo pattern số (khi database đã xóa)
  deleteMovieEpisodesByPattern: async (movieId: number, maxEpisodeId = 50) => {
    console.log(`🔄 Thử xóa episodes của movie ${movieId} theo pattern (1-${maxEpisodeId})...`)
    
    const deletePromises = []
    for (let episodeId = 1; episodeId <= maxEpisodeId; episodeId++) {
      deletePromises.push(
        mediaApi.handleR2ApiCall(
          () => mediaApi.deleteEpisodeR2Folder(movieId, episodeId),
          `xóa episode ${episodeId} của movie ${movieId} (pattern)`
        ).catch((error) => {
          // Ignore errors cho episodes không tồn tại
          return { success: false, error }
        })
      )
    }
    
    const results = await Promise.allSettled(deletePromises)
    const successful = results.filter(r => 
      r.status === 'fulfilled' && r.value.success
    ).length
    
    console.log(`🎯 Đã xóa ${successful}/${maxEpisodeId} episodes theo pattern của movie ${movieId}`)
    
    return { 
      success: successful > 0, 
      deletedCount: successful, 
      totalCount: maxEpisodeId,
      method: 'pattern'
    }
  },
  
  // Xóa episodes folder với retry mechanism (vì API chỉ xóa 1 episode mỗi lần)
  deleteMovieEpisodesFolderWithRetry: async (movieId: number, maxRetries = 20) => {
    console.log(`🔄 Xóa episodes folder của movie ${movieId} với retry (tối đa ${maxRetries} lần)...`)
    
    let deletedCount = 0
    let consecutiveFailures = 0
    let attempt = 1
    
    for (; attempt <= maxRetries; attempt++) {
      try {
        const result = await mediaApi.handleR2ApiCall(
          () => mediaApi.deleteMovieEpisodesR2Folder(movieId),
          `xóa episodes folder ${movieId} (lần ${attempt})`
        )
        
        if (result.success) {
          deletedCount++
          consecutiveFailures = 0
          console.log(`✅ Lần ${attempt}: Đã xóa 1 episode của movie ${movieId}`)
          
          // Delay nhỏ giữa các lần gọi
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 500))
          }
        } else {
          consecutiveFailures++
        }
      } catch (error) {
        consecutiveFailures++
        console.log(`❌ Lần ${attempt}: Thất bại hoặc không còn episodes`)
        
        // Nếu thất bại liên tiếp 3 lần thì dừng
        if (consecutiveFailures >= 3) {
          console.log(`🛑 Dừng sau ${consecutiveFailures} lần thất bại liên tiếp`)
          break
        }
      }
    }
    
    console.log(`🎯 Retry completion: Đã xóa ${deletedCount} episodes của movie ${movieId}`)
    
    return {
      success: deletedCount > 0,
      deletedCount,
      totalAttempts: Math.min(attempt, maxRetries),
      method: 'retry'
    }
  },
  
  // Proxy APIs thông qua backend chính (để tránh CORS)
  
  // Proxy xóa folder thông qua backend
  deleteR2FolderProxy: (folderPath: string) =>
    api.delete(`/api/media/r2/delete-folder`, { data: { folderPath } }),
  
  // Proxy xóa file thông qua backend  
  deleteR2FileProxy: (filePath: string) =>
    api.delete(`/api/media/r2/delete-file`, { data: { filePath } }),
  
  // Proxy xóa movie folder thông qua backend
  deleteMovieR2FolderProxy: (movieId: number) =>
    api.delete(`/api/media/movies/${movieId}/r2-folder`),
  
  // Proxy xóa episode folder thông qua backend
  deleteEpisodeR2FolderProxy: (movieId: number, episodeId: number) =>
    api.delete(`/api/media/episodes/${movieId}/${episodeId}/r2-folder`),
  
  // Debug utilities
  
  // List contents của folder trên R2 (để debug)
  listR2FolderContents: (folderPath: string) =>
    axios.get(`https://media.alldrama.tech/admin/list-r2-prefix/${folderPath}`, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer alldrama-production-token"
      }
    }),
  
  // Kiểm tra tình trạng storage của movie
  checkMovieStorageStatus: async (movieId: number) => {
    try {
      const results = await Promise.allSettled([
        mediaApi.listR2FolderContents(`movies/${movieId}`),
        mediaApi.listR2FolderContents(`episodes/${movieId}`)
      ])
      
      return {
        moviesFolder: results[0].status === 'fulfilled' ? results[0].value.data : null,
        episodesFolder: results[1].status === 'fulfilled' ? results[1].value.data : null,
        errors: results.filter(r => r.status === 'rejected').map(r => r.reason)
      }
    } catch (error) {
      console.error(`Lỗi khi kiểm tra storage của movie ${movieId}:`, error)
      throw error
    }
  },
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
    return api.get(`/api/media/episodes/${id}/processing-status`);
  },
  
  // Get detailed processing status
  getDetailedProcessingStatus: (movieId: number, episodeId: number) => {
    return api.get(`/api/media/episodes/${movieId}/${episodeId}/processing-status-detailed`);
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