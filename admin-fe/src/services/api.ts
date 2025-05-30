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
    
  // === NEW IMPROVED DELETE APIs ===
  
  // Xóa phim hoàn toàn (improved API - xóa tất cả file R2 + database)
  deleteMovieCompletely: (movieId: number) =>
    api.delete(`/api/movies/${movieId}`),
  
  // Xóa media cụ thể của phim (improved API)
  deleteMovieMedia: (movieId: number, mediaType: "poster" | "backdrop" | "trailer") =>
    api.delete(`/api/movies/${movieId}/media/${mediaType}`),
  
  // Xóa tất cả file R2 của phim (giữ database)
  deleteMovieFiles: (movieId: number) =>
    api.delete(`/api/movies/${movieId}/files`),
  
  // Xóa tập phim hoàn toàn (improved API - xóa tất cả file R2 + database)
  deleteEpisodeCompletely: (episodeId: number) =>
    api.delete(`/api/episodes/${episodeId}`),
  
  // Xóa tất cả file R2 của tập phim (giữ database)
  deleteEpisodeFiles: (episodeId: number) =>
    api.delete(`/api/episodes/${episodeId}/files`),
  
  // === ADMIN R2 MANAGEMENT APIs ===
  
  // Liệt kê file theo prefix (admin only)
  listR2FilesByPrefix: (prefix: string) =>
    api.get(`/api/media/admin/r2/list/${prefix}`),
  
  // Xóa file theo prefix (admin only - NGUY HIỂM)
  deleteR2FilesByPrefix: (prefix: string) =>
    api.delete(`/api/media/admin/r2/prefix/${prefix}`),
  
  // Xóa file đơn lẻ (admin only)
  deleteR2FileSingle: (key: string) =>
    api.delete(`/api/media/admin/r2/file/${key}`),
    
  // === LEGACY DELETE APIs (keep for compatibility) ===
    
  // Xóa tập phim và media liên quan (bao gồm R2) - LEGACY
  deleteEpisode: (movieId: number, episodeId: number) =>
    api.delete(`/api/media/episodes/${movieId}/${episodeId}`),
  
  // Xóa phim và tất cả media liên quan (bao gồm R2) - LEGACY
  deleteMovie: (movieId: number) =>
    api.delete(`/api/media/movies/${movieId}`),
  
  // Xóa tất cả media của phim (poster, backdrop, trailer) trên R2 - LEGACY
  deleteAllMovieMedia: (movieId: number) =>
    api.delete(`/api/media/movies/${movieId}/all-media`),
  
  // Xóa video và HLS files của episode trên R2 - LEGACY
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
        ).then((result) => {
          // Explicit success return
          return { success: true, episodeId, method: result.method }
        }).catch((error) => {
          // Check for CORS success specifically
          if (error.message?.includes('200 (OK)') || 
              error.message?.includes('net::ERR_FAILED 200')) {
            console.log(`✅ Episode ${episodeId} xóa thành công (CORS nhưng status 200)`)
            return { success: true, episodeId, method: 'cors-success' }
          }
          
          // Real failure
          return { success: false, episodeId, error: error.message || 'Unknown error' }
        })
      )
    }
    
    const results = await Promise.all(deletePromises)
    const successful = results.filter(r => r.success).length
    const successfulEpisodes = results.filter(r => r.success).map(r => r.episodeId)
    
    console.log(`🎯 Đã xóa ${successful}/${maxEpisodeId} episodes theo pattern của movie ${movieId}`)
    if (successful > 0) {
      console.log(`📝 Episodes đã xóa: ${successfulEpisodes.join(', ')}`)
    }
    
    return { 
      success: successful > 0, 
      deletedCount: successful, 
      totalCount: maxEpisodeId,
      deletedEpisodes: successfulEpisodes,
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
      } catch (error: any) {
        // Check for CORS success specifically
        if (error.message?.includes('200 (OK)') || 
            error.message?.includes('net::ERR_FAILED 200')) {
          deletedCount++
          consecutiveFailures = 0
          console.log(`✅ Lần ${attempt}: Đã xóa 1 episode của movie ${movieId} (CORS nhưng status 200)`)
          
          // Delay nhỏ giữa các lần gọi
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 500))
          }
        } else {
          consecutiveFailures++
          console.log(`❌ Lần ${attempt}: Thất bại hoặc không còn episodes`)
          
          // Nếu thất bại liên tiếp 3 lần thì dừng
          if (consecutiveFailures >= 3) {
            console.log(`🛑 Dừng sau ${consecutiveFailures} lần thất bại liên tiếp`)
            break
          }
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
  
  // Xóa folder với chunking thông minh - chia nhỏ việc xóa
  deleteR2FolderWithChunking: async (folderPath: string, maxChunks = 50, onProgress?: (progress: { deleted: number, chunks: number }) => void) => {
    console.log(`🔄 Bắt đầu xóa folder ${folderPath} với chunking (tối đa ${maxChunks} chunks)...`)
    
    let totalDeleted = 0
    let consecutiveFailures = 0
    let chunkIndex = 0
    
    for (; chunkIndex < maxChunks; chunkIndex++) {
      try {
        const result = await mediaApi.handleR2ApiCall(
          () => mediaApi.deleteR2Folder(folderPath),
          `xóa chunk ${chunkIndex + 1} của folder ${folderPath}`
        )
        
        if (result.success) {
          totalDeleted++
          consecutiveFailures = 0
          console.log(`✅ Chunk ${chunkIndex + 1}: Đã xóa một phần của folder ${folderPath}`)
          
          // Callback progress
          if (onProgress) {
            onProgress({ deleted: totalDeleted, chunks: chunkIndex + 1 })
          }
          
          // Delay giữa các chunks để tránh rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000))
        } else {
          consecutiveFailures++
        }
      } catch (error: any) {
        // Check for CORS success
        if (error.message?.includes('200 (OK)') || 
            error.message?.includes('net::ERR_FAILED 200')) {
          totalDeleted++
          consecutiveFailures = 0
          console.log(`✅ Chunk ${chunkIndex + 1}: Đã xóa một phần của folder ${folderPath} (CORS nhưng status 200)`)
          
          // Callback progress
          if (onProgress) {
            onProgress({ deleted: totalDeleted, chunks: chunkIndex + 1 })
          }
          
          // Delay giữa các chunks
          await new Promise(resolve => setTimeout(resolve, 1000))
        } else {
          consecutiveFailures++
          console.log(`❌ Chunk ${chunkIndex + 1}: Thất bại hoặc folder đã empty`)
          
          // Nếu thất bại liên tiếp 3 lần thì coi như đã xóa hết
          if (consecutiveFailures >= 3) {
            console.log(`🛑 Dừng sau ${consecutiveFailures} lần thất bại liên tiếp - folder có thể đã empty`)
            break
          }
        }
      }
    }
    
    console.log(`🎯 Chunking completion: Đã xóa ${totalDeleted} chunks của folder ${folderPath}`)
    
    return {
      success: totalDeleted > 0,
      totalDeleted,
      totalChunks: chunkIndex + 1,
      method: 'chunking'
    }
  },
  
  // Xóa movie episodes với chunking thông minh
  deleteMovieEpisodesWithChunking: async (movieId: number, maxChunks = 100, onProgress?: (progress: { deleted: number, chunks: number }) => void) => {
    console.log(`🔄 Bắt đầu xóa episodes của movie ${movieId} với chunking...`)
    
    return await mediaApi.deleteR2FolderWithChunking(
      `episodes/${movieId}`,
      maxChunks,
      onProgress
    )
  },
  
  // Xóa movie hoàn toàn với chunking
  deleteCompleteMovieWithChunking: async (movieId: number, onProgress?: (progress: { 
    step: 'movies' | 'episodes' | 'complete',
    moviesDeleted: number,
    episodesDeleted: number,
    totalChunks: number
  }) => void) => {
    console.log(`🔄 Bắt đầu xóa hoàn toàn movie ${movieId} với chunking...`)
    
    let moviesDeleted = 0
    let episodesDeleted = 0
    let totalChunks = 0
    
    try {
      // Bước 1: Xóa movies folder
      if (onProgress) {
        onProgress({ step: 'movies', moviesDeleted: 0, episodesDeleted: 0, totalChunks: 0 })
      }
      
      const moviesResult = await mediaApi.deleteR2FolderWithChunking(
        `movies/${movieId}`,
        20, // Ít chunks hơn vì movies folder thường nhỏ hơn
        (progress) => {
          moviesDeleted = progress.deleted
          totalChunks = progress.chunks
          if (onProgress) {
            onProgress({ step: 'movies', moviesDeleted, episodesDeleted, totalChunks })
          }
        }
      )
      
      moviesDeleted = moviesResult.totalDeleted
      
      // Bước 2: Xóa episodes folder (thường lớn hơn nhiều)
      if (onProgress) {
        onProgress({ step: 'episodes', moviesDeleted, episodesDeleted: 0, totalChunks })
      }
      
      const episodesResult = await mediaApi.deleteMovieEpisodesWithChunking(
        movieId,
        100, // Nhiều chunks hơn vì episodes thường lớn
        (progress) => {
          episodesDeleted = progress.deleted
          totalChunks = moviesResult.totalChunks + progress.chunks
          if (onProgress) {
            onProgress({ step: 'episodes', moviesDeleted, episodesDeleted, totalChunks })
          }
        }
      )
      
      episodesDeleted = episodesResult.totalDeleted
      totalChunks = moviesResult.totalChunks + episodesResult.totalChunks
      
      // Hoàn thành
      if (onProgress) {
        onProgress({ step: 'complete', moviesDeleted, episodesDeleted, totalChunks })
      }
      
      const totalDeleted = moviesDeleted + episodesDeleted
      console.log(`🎯 Hoàn thành xóa movie ${movieId}: ${totalDeleted} chunks (${moviesDeleted} movies + ${episodesDeleted} episodes)`)
      
      return {
        success: totalDeleted > 0,
        moviesDeleted,
        episodesDeleted,
        totalDeleted,
        totalChunks,
        method: 'complete-chunking'
      }
    } catch (error) {
      console.error(`❌ Lỗi khi xóa movie ${movieId} với chunking:`, error)
      throw error
    }
  },
  
  // Helper để estimate kích thước folder trước khi xóa
  estimateFolderSize: async (folderPath: string) => {
    try {
      const contents = await mediaApi.listR2FolderContents(folderPath)
      const objects = contents.data?.objects || []
      
      const totalSize = objects.reduce((sum: number, obj: any) => sum + (obj.size || 0), 0)
      const totalObjects = objects.length
      
      // Estimate chunks needed based on object count and size
      const estimatedChunks = Math.ceil(totalObjects / 1000) + Math.ceil(totalSize / (100 * 1024 * 1024)) // 100MB chunks
      
      return {
        totalObjects,
        totalSize,
        estimatedChunks: Math.max(1, estimatedChunks),
        sizeFormatted: (totalSize / (1024 * 1024)).toFixed(2) + ' MB'
      }
    } catch (error) {
      console.warn(`Không thể estimate size của folder ${folderPath}:`, error)
      return {
        totalObjects: 0,
        totalSize: 0,
        estimatedChunks: 10, // Default estimate
        sizeFormatted: 'Unknown'
      }
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
  
  // Advanced R2 Deletion APIs
  
  // Xóa toàn bộ objects trong folder bằng cách list trước rồi xóa từng batch
  deleteR2FolderRecursive: async (folderPath: string, onProgress?: (progress: { 
    listed: number, 
    deleted: number, 
    batches: number,
    currentBatch: number,
    failed: number
  }) => void) => {
    console.log(`🔄 Bắt đầu xóa recursive folder ${folderPath}...`)
    
    try {
      // Bước 1: List tất cả objects trong folder
      console.log(`📋 Listing objects trong folder ${folderPath}...`)
      const listResponse = await axios.get(
        `https://media.alldrama.tech/admin/list-r2-prefix/${folderPath}?detailed=true`,
        {
          headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer alldrama-production-token"
          }
        }
      )
      
      const objects = listResponse.data?.objects || []
      console.log(`📦 Tìm thấy ${objects.length} objects trong folder ${folderPath}`)
      
      if (objects.length === 0) {
        console.log(`📂 Folder ${folderPath} đã trống hoặc không tồn tại`)
        return {
          success: true,
          totalListed: 0,
          totalDeleted: 0,
          totalBatches: 0,
          totalFailed: 0,
          method: 'recursive-empty'
        }
      }
      
      // Bước 2: Chia objects thành batches (tối đa 100 objects mỗi batch)
      const batchSize = 100
      const batches = []
      for (let i = 0; i < objects.length; i += batchSize) {
        batches.push(objects.slice(i, i + batchSize))
      }
      
      console.log(`📦 Chia thành ${batches.length} batches, mỗi batch ${batchSize} objects`)
      
      // Bước 3: Xóa từng batch với delay
      let totalDeleted = 0
      let totalFailed = 0
      
      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex]
        console.log(`🗑️  Đang xóa batch ${batchIndex + 1}/${batches.length} (${batch.length} objects)...`)
        
        try {
          // Gọi API xóa batch
          const deleteResponse = await axios.delete(
            `https://media.alldrama.tech/admin/delete-r2-batch`,
            {
              headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer alldrama-production-token"
              },
              data: {
                objects: batch.map((obj: any) => ({ Key: obj.key || obj.Key }))
              }
            }
          )
          
          const deletedCount = deleteResponse.data?.deleted || batch.length
          totalDeleted += deletedCount
          console.log(`✅ Batch ${batchIndex + 1}: Đã xóa ${deletedCount}/${batch.length} objects`)
          
        } catch (batchError: any) {
          // Check for CORS success
          if (batchError.message?.includes('200 (OK)') || 
              batchError.message?.includes('net::ERR_FAILED 200')) {
            totalDeleted += batch.length
            console.log(`✅ Batch ${batchIndex + 1}: Đã xóa ${batch.length} objects (CORS nhưng status 200)`)
          } else {
            totalFailed += batch.length
            console.error(`❌ Batch ${batchIndex + 1} thất bại:`, batchError.message)
          }
        }
        
        // Update progress
        if (onProgress) {
          onProgress({
            listed: objects.length,
            deleted: totalDeleted,
            batches: batches.length,
            currentBatch: batchIndex + 1,
            failed: totalFailed
          })
        }
        
        // Delay giữa các batches để tránh rate limiting
        if (batchIndex < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1500))
        }
      }
      
      console.log(`🎯 Recursive deletion hoàn thành: ${totalDeleted}/${objects.length} objects đã xóa, ${totalFailed} thất bại`)
      
      return {
        success: totalDeleted > 0,
        totalListed: objects.length,
        totalDeleted,
        totalBatches: batches.length,
        totalFailed,
        method: 'recursive-batch'
      }
      
    } catch (error: any) {
      console.error(`❌ Lỗi recursive deletion folder ${folderPath}:`, error)
      throw error
    }
  },
  
  // Xóa movie episodes với recursive approach
  deleteMovieEpisodesRecursive: async (movieId: number, onProgress?: (progress: { 
    listed: number, 
    deleted: number, 
    batches: number,
    currentBatch: number,
    failed: number
  }) => void) => {
    console.log(`🔄 Bắt đầu xóa recursive episodes của movie ${movieId}...`)
    return await mediaApi.deleteR2FolderRecursive(`episodes/${movieId}`, onProgress)
  },
  
  // Xóa movie hoàn toàn với recursive approach
  deleteCompleteMovieRecursive: async (movieId: number, onProgress?: (progress: { 
    step: 'movies' | 'episodes' | 'complete',
    moviesListed: number,
    moviesDeleted: number,
    moviesFailed: number,
    episodesListed: number,
    episodesDeleted: number,
    episodesFailed: number,
    totalBatches: number,
    currentBatch: number
  }) => void) => {
    console.log(`🔄 Bắt đầu xóa recursive hoàn toàn movie ${movieId}...`)
    
    let moviesResult = { totalListed: 0, totalDeleted: 0, totalFailed: 0, totalBatches: 0 }
    let episodesResult = { totalListed: 0, totalDeleted: 0, totalFailed: 0, totalBatches: 0 }
    
    try {
      // Bước 1: Xóa movies folder
      if (onProgress) {
        onProgress({ 
          step: 'movies', 
          moviesListed: 0, moviesDeleted: 0, moviesFailed: 0,
          episodesListed: 0, episodesDeleted: 0, episodesFailed: 0,
          totalBatches: 0, currentBatch: 0
        })
      }
      
      moviesResult = await mediaApi.deleteR2FolderRecursive(
        `movies/${movieId}`,
        (progress) => {
          if (onProgress) {
            onProgress({
              step: 'movies',
              moviesListed: progress.listed,
              moviesDeleted: progress.deleted,
              moviesFailed: progress.failed,
              episodesListed: 0,
              episodesDeleted: 0,
              episodesFailed: 0,
              totalBatches: progress.batches,
              currentBatch: progress.currentBatch
            })
          }
        }
      )
      
      // Bước 2: Xóa episodes folder
      if (onProgress) {
        onProgress({ 
          step: 'episodes', 
          moviesListed: moviesResult.totalListed,
          moviesDeleted: moviesResult.totalDeleted,
          moviesFailed: moviesResult.totalFailed,
          episodesListed: 0, episodesDeleted: 0, episodesFailed: 0,
          totalBatches: moviesResult.totalBatches, currentBatch: 0
        })
      }
      
      episodesResult = await mediaApi.deleteMovieEpisodesRecursive(
        movieId,
        (progress) => {
          if (onProgress) {
            onProgress({
              step: 'episodes',
              moviesListed: moviesResult.totalListed,
              moviesDeleted: moviesResult.totalDeleted,
              moviesFailed: moviesResult.totalFailed,
              episodesListed: progress.listed,
              episodesDeleted: progress.deleted,
              episodesFailed: progress.failed,
              totalBatches: moviesResult.totalBatches + progress.batches,
              currentBatch: progress.currentBatch
            })
          }
        }
      )
      
      // Hoàn thành
      const totalDeleted = moviesResult.totalDeleted + episodesResult.totalDeleted
      const totalListed = moviesResult.totalListed + episodesResult.totalListed
      const totalFailed = moviesResult.totalFailed + episodesResult.totalFailed
      
      if (onProgress) {
        onProgress({ 
          step: 'complete', 
          moviesListed: moviesResult.totalListed,
          moviesDeleted: moviesResult.totalDeleted,
          moviesFailed: moviesResult.totalFailed,
          episodesListed: episodesResult.totalListed,
          episodesDeleted: episodesResult.totalDeleted,
          episodesFailed: episodesResult.totalFailed,
          totalBatches: moviesResult.totalBatches + episodesResult.totalBatches,
          currentBatch: 0
        })
      }
      
      console.log(`🎯 Hoàn thành recursive deletion movie ${movieId}: ${totalDeleted}/${totalListed} objects (${totalFailed} failed)`)
      
      return {
        success: totalDeleted > 0,
        moviesResult,
        episodesResult,
        totalDeleted,
        totalListed,
        totalFailed,
        method: 'complete-recursive'
      }
      
    } catch (error) {
      console.error(`❌ Lỗi recursive deletion movie ${movieId}:`, error)
      throw error
    }
  },
  
  // Force cleanup - xóa theo pattern với brute force
  forceCleanupMoviePattern: async (movieId: number, onProgress?: (progress: {
    type: 'movies' | 'episodes' | 'individual',
    attempted: number,
    deleted: number,
    failed: number,
    current: string
  }) => void) => {
    console.log(`🔥 Bắt đầu force cleanup movie ${movieId} với pattern matching...`)
    
    let totalDeleted = 0
    let totalAttempted = 0
    let totalFailed = 0
    
    // Các patterns để thử xóa
    const patterns = [
      // Movies folder
      `movies/${movieId}`,
      `movies/${movieId}/poster.jpg`,
      `movies/${movieId}/backdrop.jpg`, 
      `movies/${movieId}/trailer.mp4`,
      
      // Episodes folder chính
      `episodes/${movieId}`,
      
      // Individual episodes (thử từ 1-100)
      ...Array.from({length: 100}, (_, i) => `episodes/${movieId}/${i + 1}`),
      
      // Specific episode files
      ...Array.from({length: 50}, (_, i) => [
        `episodes/${movieId}/${i + 1}/original.mp4`,
        `episodes/${movieId}/${i + 1}/thumbnail.jpg`,
        `episodes/${movieId}/${i + 1}/hls`,
        `episodes/${movieId}/${i + 1}/hls/playlist.m3u8`,
        `episodes/${movieId}/${i + 1}/thumbnails`
      ]).flat()
    ]
    
    for (const pattern of patterns) {
      try {
        totalAttempted++
        
        if (onProgress) {
          onProgress({
            type: pattern.startsWith('movies') ? 'movies' : 
                  pattern.includes('/hls') || pattern.includes('.mp4') || pattern.includes('.jpg') ? 'individual' : 'episodes',
            attempted: totalAttempted,
            deleted: totalDeleted,
            failed: totalFailed,
            current: pattern
          })
        }
        
        // Detect if pattern is file or folder
        const isFile = /\.(mp4|jpg|m3u8)$/.test(pattern)
        
        const result = await mediaApi.handleR2ApiCall(
          () => isFile ? mediaApi.deleteR2File(pattern) : mediaApi.deleteR2Folder(pattern),
          `force delete ${pattern}`
        )
        
        if (result.success) {
          totalDeleted++
          console.log(`✅ Force deleted: ${pattern}`)
        }
        
        // Small delay để không spam API
        await new Promise(resolve => setTimeout(resolve, 200))
        
      } catch (error: any) {
        if (error.message?.includes('200 (OK)') || 
            error.message?.includes('net::ERR_FAILED 200')) {
          totalDeleted++
          console.log(`✅ Force deleted (CORS success): ${pattern}`)
        } else {
          totalFailed++
          // Không log error vì nhiều pattern không tồn tại
        }
      }
    }
    
    console.log(`🎯 Force cleanup hoàn thành: ${totalDeleted}/${totalAttempted} patterns (${totalFailed} failed)`)
    
    return {
      success: totalDeleted > 0,
      totalAttempted,
      totalDeleted,
      totalFailed,
      method: 'force-pattern'
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
  
  // Delete movie (LEGACY - fallback to database only)
  delete: (id: number) => {
    return api.delete(`/api/movies/${id}`);
  },
  
  // === IMPROVED DELETE METHODS ===
  
  // Xóa phim hoàn toàn (improved - xóa cả R2 files và database)
  deleteCompletely: (id: number) => {
    return mediaApi.deleteMovieCompletely(id);
  },
  
  // Xóa media cụ thể của phim
  deleteMedia: (id: number, mediaType: "poster" | "backdrop" | "trailer") => {
    return mediaApi.deleteMovieMedia(id, mediaType);
  },
  
  // Xóa tất cả file R2 (giữ database record)
  deleteFiles: (id: number) => {
    return mediaApi.deleteMovieFiles(id);
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
  
  // Delete episode (LEGACY - fallback to database only)
  delete: (id: number) => {
    return api.delete(`/api/episodes/${id}`);
  },
  
  // === IMPROVED DELETE METHODS ===
  
  // Xóa tập phim hoàn toàn (improved - xóa cả R2 files và database)
  deleteCompletely: (id: number) => {
    return mediaApi.deleteEpisodeCompletely(id);
  },
  
  // Xóa tất cả file R2 (giữ database record)
  deleteFiles: (id: number) => {
    return mediaApi.deleteEpisodeFiles(id);
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