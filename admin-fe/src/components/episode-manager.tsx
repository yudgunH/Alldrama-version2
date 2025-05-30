"use client"

import { useState, useEffect, useCallback } from "react"
import { api, mediaApi, episodeApi } from "@/services/api"
import { Episode, UploadProgress } from "@/models"
import { toast } from "react-hot-toast"
import {
  PlusCircle,
  Search,
  Edit,
  Trash2,
  Play,
  CheckCircle,
  Clock,
  AlertTriangle,
  RefreshCw,
  X,
  Upload,
  FileVideo,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { UploadProgressManager, UploadProgressData } from "@/components/ui/upload-progress-manager"
import Link from "next/link"

interface EpisodeManagerProps {
  movieId: number
  movieTitle: string
}

export function EpisodeManager({ movieId, movieTitle }: EpisodeManagerProps) {
  const [episodes, setEpisodes] = useState<Episode[]>([])
  const [filteredEpisodes, setFilteredEpisodes] = useState<Episode[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isProcessingDialogOpen, setIsProcessingDialogOpen] = useState(false)
  const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(null)
  
  const [formData, setFormData] = useState({
    episodeNumber: 1,
    title: "",
    description: "",
  })
  
  // Media state
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null)
  const [processingStatus, setProcessingStatus] = useState<any>(null)
  
  // Polling for processing status
  const [processingPollingIds, setProcessingPollingIds] = useState<number[]>([])
  const [hlsJobIds, setHlsJobIds] = useState<{[episodeId: number]: string}>({})

  // Upload Progress Toast
  const [showProgressToast, setShowProgressToast] = useState(false)
  const [progressToastData, setProgressToastData] = useState({
    title: "",
    currentStep: "",
    progress: 0,
    steps: [] as Array<{
      id: string
      name: string
      status: "pending" | "processing" | "completed" | "error"
      progress?: number
      startTime?: number
      endTime?: number
    }>,
    estimatedTimeRemaining: ""
  })

  // Upload Progress Management
  const [uploads, setUploads] = useState<UploadProgressData[]>([])

  // Update progress toast
  const updateProgressToast = (updates: Partial<typeof progressToastData>) => {
    setProgressToastData(prev => ({ ...prev, ...updates }))
  }

  const updateProgressStep = (stepId: string, updates: Partial<{
    status: "pending" | "processing" | "completed" | "error"
    progress?: number
    startTime?: number
    endTime?: number
  }>) => {
    setProgressToastData(prev => ({
      ...prev,
      steps: prev.steps.map(step => 
        step.id === stepId ? { ...step, ...updates } : step
      )
    }))
  }

  const initializeProgressToast = (title: string) => {
    const steps = [
      { id: "create", name: "Tạo tập phim", status: "pending" as const, startTime: Date.now() },
      { id: "upload", name: "Upload video", status: "pending" as const },
      { id: "hls", name: "Xử lý HLS", status: "pending" as const },
      { id: "complete", name: "Hoàn thành", status: "pending" as const }
    ]
    
    setProgressToastData({
      title,
      currentStep: "Bắt đầu tạo tập phim...",
      progress: 0,
      steps,
      estimatedTimeRemaining: "Đang tính..."
    })
    setShowProgressToast(true)
  }

  // Update upload progress
  const addUpload = (upload: UploadProgressData) => {
    setUploads(prev => [...prev, upload])
  }

  const updateUpload = (id: string, updates: Partial<UploadProgressData>) => {
    setUploads(prev => prev.map(upload => 
      upload.id === id ? { ...upload, ...updates } : upload
    ))
  }

  const updateUploadStep = (uploadId: string, stepId: string, updates: Partial<{
    status: "pending" | "processing" | "completed" | "error"
    progress?: number
    startTime?: number
    endTime?: number
  }>) => {
    setUploads(prev => prev.map(upload => 
      upload.id === uploadId ? {
        ...upload,
        steps: upload.steps.map(step => 
          step.id === stepId ? { ...step, ...updates } : step
        )
      } : upload
    ))
  }

  const removeUpload = (id: string) => {
    setUploads(prev => prev.filter(upload => upload.id !== id))
  }

  const clearCompletedUploads = () => {
    setUploads(prev => prev.filter(upload => !upload.isCompleted))
  }

  const createUploadProgress = (episodeId: number, title: string): UploadProgressData => {
    const id = `upload-${episodeId}-${Date.now()}`
    return {
      id,
      title,
      currentStep: "Bắt đầu tạo tập phim...",
      progress: 0,
      steps: [
        { id: "create", name: "Tạo tập phim", status: "pending", startTime: Date.now() },
        { id: "upload", name: "Upload video", status: "pending" },
        { id: "hls", name: "Xử lý HLS", status: "pending" },
        { id: "complete", name: "Hoàn thành", status: "pending" }
      ],
      estimatedTimeRemaining: "Đang tính...",
      isCompleted: false,
      hasError: false
    }
  }

  // Fetch episodes
  const fetchEpisodes = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await episodeApi.getByMovieId(movieId)
      setEpisodes(response.data)
      setFilteredEpisodes(response.data)
      setIsLoading(false)
      
      // Kiểm tra tập phim đang trong quá trình xử lý
      const processing = response.data.filter((ep: Episode) => ep.isProcessed === false)
      if (processing.length > 0) {
        setProcessingPollingIds(processing.map((ep: Episode) => ep.id))
      }
    } catch (error) {
      console.error("Error fetching episodes:", error)
      toast.error("Không thể tải danh sách tập phim")
      setIsLoading(false)
    }
  }, [movieId])

  useEffect(() => {
    fetchEpisodes()
  }, [fetchEpisodes])

  // Apply filters
  useEffect(() => {
    let result = [...episodes]
    
    if (searchTerm) {
      result = result.filter(episode => 
        episode.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        episode.episodeNumber.toString().includes(searchTerm)
      )
    }
    
    if (statusFilter && statusFilter !== "all") {
      if (statusFilter === "processed") {
        result = result.filter(episode => episode.isProcessed === true)
      } else if (statusFilter === "processing") {
        result = result.filter(episode => episode.isProcessed === false)
      }
    }
    
    setFilteredEpisodes(result)
  }, [episodes, searchTerm, statusFilter])

  // Polling để kiểm tra trạng thái xử lý tập phim
  useEffect(() => {
    if (processingPollingIds.length === 0) return
    
    const pollingInterval = setInterval(async () => {
      for (const episodeId of processingPollingIds) {
        try {
          // Nếu có jobId, sử dụng API mới để kiểm tra trạng thái
          if (hlsJobIds[episodeId]) {
            const jobId = hlsJobIds[episodeId];
            console.log(`Kiểm tra trạng thái HLS theo jobId: ${jobId} cho episodeId: ${episodeId}`);
            
            const response = await mediaApi.checkHLSStatus(jobId, movieId, episodeId);
            
            if (response.data && response.data.success) {
              const { status, hlsUrl, hlsPath, createdAt, updatedAt } = response.data;
              
              if (status === 'completed') {
                // Xử lý hoàn thành
                setProcessingPollingIds(prev => prev.filter(id => id !== episodeId));
                toast.success(`Tập phim đã xử lý HLS thành công`);
                
                // Cập nhật progress toast nếu đang hiển thị cho episode này
                if (showProgressToast && progressToastData.title.includes(`Tập ${episodeId}`)) {
                  updateProgressStep("hls", { status: "completed", endTime: Date.now() })
                  updateProgressStep("complete", { status: "completed", startTime: Date.now(), endTime: Date.now() })
                  updateProgressToast({
                    currentStep: "Upload và xử lý hoàn thành!",
                    progress: 100,
                    estimatedTimeRemaining: ""
                  })
                  
                  // Tự động đóng toast sau 3 giây
                  setTimeout(() => setShowProgressToast(false), 3000)
                }
                
                // Cập nhật danh sách tập phim
                fetchEpisodes();
                
                if (selectedEpisode?.id === episodeId) {
                  // Cập nhật trạng thái hiển thị nếu đang xem chi tiết tập này
                  setProcessingStatus({
                    isProcessed: true,
                    progress: 100,
                    playlistUrl: hlsUrl,
                    completedAt: updatedAt
                  });
                }
                
                // Xóa jobId đã hoàn thành
                const newHlsJobIds = {...hlsJobIds};
                delete newHlsJobIds[episodeId];
                setHlsJobIds(newHlsJobIds);
              } else {
                // Đang xử lý
                const progress = 50; // Không có thông tin progress chi tiết từ API
                
                if (selectedEpisode?.id === episodeId) {
                  // Cập nhật trạng thái hiển thị nếu đang xem chi tiết
                  setProcessingStatus({
                    isProcessed: false,
                    progress: progress,
                    status: status,
                    playlistUrl: hlsUrl,
                    createdAt: createdAt,
                    updatedAt: updatedAt,
                    estimatedTimeRemaining: "Đang xử lý...",
                    steps: [
                      { name: "Tải lên video gốc", status: "completed", completedAt: new Date().toISOString() },
                      { name: "Tạo thumbnail", status: "processing", progress: progress },
                      { name: "Chuyển đổi sang HLS", status: "pending" },
                      { name: "Tạo playlist", status: "pending" }
                    ]
                  });
                }
              }
            }
          } else {
            // Sử dụng API chi tiết nếu không có jobId
            const response = await episodeApi.getDetailedProcessingStatus(movieId, episodeId);
            
            const { isProcessed, progress, playlistUrl, thumbnailUrl, estimatedTimeRemaining, steps } = response.data;
            
            if (isProcessed) {
              // Xóa khỏi danh sách polling
              setProcessingPollingIds(prev => prev.filter(id => id !== episodeId));
              toast.success(`Tập phim đã xử lý xong`);
              
              // Cập nhật danh sách tập phim
              fetchEpisodes();
            } else if (selectedEpisode?.id === episodeId) {
              // Cập nhật trạng thái xử lý nếu đang xem chi tiết
              setProcessingStatus({
                isProcessed,
                progress: progress || 0,
                playlistUrl,
                thumbnailUrl,
                estimatedTimeRemaining: estimatedTimeRemaining || "Đang tính...",
                steps: steps || [
                  { name: "Tải lên video gốc", status: "completed", completedAt: new Date().toISOString() },
                  { name: "Tạo thumbnail", status: "processing", progress: progress || 30 },
                  { name: "Chuyển đổi sang HLS", status: "pending" },
                  { name: "Tạo playlist", status: "pending" }
                ]
              });
            }
          }
        } catch (error) {
          console.error(`Error checking processing status for episode ${episodeId}:`, error);
        }
      }
    }, 5000) // Kiểm tra mỗi 5 giây
    
    return () => clearInterval(pollingInterval)
  }, [processingPollingIds, selectedEpisode, fetchEpisodes, movieId, hlsJobIds])

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }
  
  // Handle number input change
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: Number(value) }))
  }
  
  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setVideoFile(file)
    }
  }
  
  // Clear file
  const clearFile = () => {
    setVideoFile(null)
  }

  // Upload video with presigned URL
  const uploadWithPresignedUrl = async (
    episodeId: number,
    file: File,
    uploadId?: string
  ): Promise<string | null> => {
    try {
      console.log("uploadWithPresignedUrl: Bắt đầu với", { movieId, episodeId, file: file.name });
      
      // Kiểm tra movieId hợp lệ
      if (!movieId || movieId <= 0) {
        console.error("uploadWithPresignedUrl: movieId không hợp lệ", movieId);
        throw new Error("ID phim không hợp lệ (movieId <= 0)")
      }
      
      // Kiểm tra episodeId hợp lệ
      if (!episodeId || episodeId <= 0) {
        console.error("uploadWithPresignedUrl: episodeId không hợp lệ", episodeId);
        throw new Error("ID tập phim không hợp lệ")
      }
      
      // Lấy presigned URL
      console.log("uploadWithPresignedUrl: Đang lấy presigned URL với", { movieId, episodeId, fileType: "video" });
      
      const response = await mediaApi.getPresignedUrl({
        movieId,
        episodeId,
        fileType: "video",
      })
      
      console.log("uploadWithPresignedUrl: Đã nhận presigned URL response", response.data);
      
      const { presignedUrl, contentType, cdnUrl } = response.data
      
      // Kiểm tra presignedUrl hợp lệ
      if (!presignedUrl) {
        console.error("uploadWithPresignedUrl: Không nhận được URL hợp lệ", response.data);
        throw new Error("Không nhận được URL hợp lệ từ server")
      }
      
      // Bước 1: Upload file lên R2 thông qua presigned URL
      console.log("uploadWithPresignedUrl: Đang tải video lên R2 storage...", { 
        presignedUrl,
        contentType,
        fileSize: file.size,
        fileType: file.type
      });
      
      try {
        await mediaApi.uploadToPresignedUrl(
          presignedUrl, 
          file,
          (progress) => {
            console.log(`uploadWithPresignedUrl: Upload progress ${progress}%`);
            if (uploadProgress) {
              setUploadProgress(prev => prev ? { ...prev, progress } : null)
            }
            // Cập nhật progress toast - upload từ 20% đến 50%
            if (uploadId) {
              const toastProgress = 20 + (progress * 0.3); // 20% + 30% of upload progress
              updateUpload(uploadId, { 
                currentStep: `Đang upload video... ${progress}%`,
                progress: toastProgress 
              })
            }
          }
        )
        console.log("uploadWithPresignedUrl: Upload thành công!");
      } catch (uploadError) {
        console.error("uploadWithPresignedUrl: Lỗi khi upload file", uploadError);
        throw uploadError;
      }
      
      console.log("uploadWithPresignedUrl: Đã tải video lên R2 storage thành công, đang kích hoạt xử lý HLS...");
      
      // Xử lý HLS theo quy trình chuẩn
      try {
        // Tạo videoKey theo cấu trúc chuẩn R2
        const videoKey = `episodes/${movieId}/${episodeId}/original.mp4`;
        
        console.log("uploadWithPresignedUrl: Gọi API convert-hls", { movieId, episodeId, videoKey });
        const response = await mediaApi.convertToHLS(
          movieId,
          episodeId,
          videoKey
        );
        
        if (response.data && response.data.success) {
          const jobId = response.data.jobId;
          console.log(`uploadWithPresignedUrl: Yêu cầu xử lý HLS thành công, jobId: ${jobId}`);
          
          // Lưu jobId vào state để theo dõi tiến trình
          setHlsJobIds(prev => ({...prev, [episodeId]: jobId}));
          
          // Thêm episodeId vào danh sách theo dõi tiến trình
          if (!processingPollingIds.includes(episodeId)) {
            setProcessingPollingIds(prev => [...prev, episodeId]);
          }
        } else {
          console.warn("uploadWithPresignedUrl: Phản hồi không mong đợi từ API convert-hls", response.data);
        }
      } catch (convertError) {
        console.error("uploadWithPresignedUrl: Lỗi khi gọi API convert-hls", convertError);
        
        // Thử phương pháp dự phòng nếu không thể gọi API convert-hls trực tiếp
        try {
          console.log("uploadWithPresignedUrl: Thử phương pháp dự phòng - gọi notifyVideoUploaded");
          await mediaApi.notifyVideoUploaded(movieId, episodeId);
          console.log("uploadWithPresignedUrl: Đã thông báo backend bằng phương thức dự phòng");
          
          // Thêm vào polling để theo dõi dù không có jobId
          if (!processingPollingIds.includes(episodeId)) {
            setProcessingPollingIds(prev => [...prev, episodeId]);
          }
        } catch (backupError) {
          console.error("uploadWithPresignedUrl: Cả hai phương pháp đều thất bại", backupError);
          
          // Vẫn thêm vào polling để theo dõi trạng thái
          console.log("uploadWithPresignedUrl: Vẫn thêm vào polling để theo dõi");
          if (!processingPollingIds.includes(episodeId)) {
            setProcessingPollingIds(prev => [...prev, episodeId]);
          }
        }
      }
      
      return `${cdnUrl}episodes/${movieId}/${episodeId}/hls/master.m3u8`
    } catch (error) {
      console.error(`uploadWithPresignedUrl: Error uploading video:`, error)
      toast.error(`Không thể tải lên video: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`)
      return null
    }
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title) {
      toast.error("Vui lòng nhập tiêu đề tập phim")
      return
    }
    
    if (!videoFile) {
      toast.error("Vui lòng chọn file video cho tập phim")
      return
    }

    console.log("========DEBUG INFO==========")
    console.log("Submit form với thông tin:", { 
      movieId, 
      formData,
      videoFile: {
        name: videoFile.name,
        size: videoFile.size,
        type: videoFile.type
      }
    });
    
    let uploadProgress: UploadProgressData | null = null
    
    try {
      // Initialize upload progress
      const episodeTitle = `${movieTitle} - Tập ${formData.episodeNumber}: ${formData.title}`
      uploadProgress = createUploadProgress(formData.episodeNumber, episodeTitle)
      addUpload(uploadProgress)
      
      // Step 1: Create new episode (without media URL)
      console.log("Bắt đầu tạo tập phim...")
      updateUploadStep(uploadProgress.id, "create", { status: "processing", startTime: Date.now() })
      updateUpload(uploadProgress.id, { currentStep: "Đang tạo tập phim...", progress: 10 })
      
      const episodeResponse = await episodeApi.create(movieId, {
        episodeNumber: formData.episodeNumber,
        title: formData.title,
        description: formData.description,
      })
      
      const episodeId = episodeResponse.data.episode.id
      console.log("Đã tạo tập phim với ID:", episodeId)
      
      if (!episodeId) {
        updateUploadStep(uploadProgress.id, "create", { status: "error", endTime: Date.now() })
        throw new Error("Không thể lấy ID tập phim sau khi tạo")
      }
      
      updateUploadStep(uploadProgress.id, "create", { status: "completed", endTime: Date.now() })
      updateUploadStep(uploadProgress.id, "upload", { status: "processing", startTime: Date.now() })
      updateUpload(uploadProgress.id, { currentStep: "Đang upload video...", progress: 20 })
      
      // Step 2: Upload video
      console.log("Bắt đầu upload video:", { 
        movieId, 
        episodeId, 
        videoFile: {
          name: videoFile.name,
          size: videoFile.size,
          type: videoFile.type
        }
      })
      
      const uploadResult = await uploadWithPresignedUrl(
        episodeId,
        videoFile,
        uploadProgress.id
      )
      
      console.log("Kết quả upload:", uploadResult)
      
      if (!uploadResult) {
        // Upload thất bại
        updateUploadStep(uploadProgress.id, "upload", { status: "error", endTime: Date.now() })
        updateUpload(uploadProgress.id, { currentStep: "Upload video thất bại", progress: 30 })
        toast.error("Upload video thất bại, nhưng tập phim đã được tạo")
        setUploadProgress(prev => prev ? { ...prev, progress: 0 } : null)
        
        // Vẫn thêm vào danh sách polling để theo dõi trạng thái
        setProcessingPollingIds(prev => [...prev, episodeId])
        
        // Đóng dialog nhưng không reset form
        setIsDialogOpen(false)
        
        // Cập nhật danh sách tập phim
        fetchEpisodes()
        return
      }
      
      // Upload thành công
      updateUploadStep(uploadProgress.id, "upload", { status: "completed", endTime: Date.now() })
      updateUploadStep(uploadProgress.id, "hls", { status: "processing", startTime: Date.now() })
      updateUpload(uploadProgress.id, { currentStep: "Đang xử lý HLS...", progress: 60 })
      
      setUploadProgress(prev => prev ? { ...prev, progress: 100 } : null)
      toast.success("Đã thêm tập phim thành công!")
      
      // Thêm tập phim vào danh sách polling
      setProcessingPollingIds(prev => [...prev, episodeId])
      
      // Đóng dialog và reset form
      setIsDialogOpen(false)
      setFormData({
        episodeNumber: Math.max(...episodes.map(ep => ep.episodeNumber), 0) + 1,
        title: "",
        description: "",
      })
      setVideoFile(null)
      setUploadProgress(null)
      
      // Cập nhật danh sách tập phim
      fetchEpisodes()
    } catch (error: any) {
      console.error("Error creating episode:", error)
      const errorMessage = error.response?.data?.message || error.message || "Không thể tạo tập phim mới"
      
      // Cập nhật upload progress với lỗi nếu có uploadProgress
      if (uploadProgress) {
        const uploadId = uploadProgress.id
        updateUpload(uploadId, { 
          currentStep: `Lỗi: ${errorMessage}`, 
          progress: 0,
          hasError: true
        })
        // Đánh dấu step hiện tại là lỗi
        const currentStep = uploads.find(u => u.id === uploadId)?.steps.find(s => s.status === "processing")
        if (currentStep) {
          updateUploadStep(uploadId, currentStep.id, { status: "error", endTime: Date.now() })
        }
      }
      
      toast.error(`Lỗi: ${errorMessage}`)
      setUploadProgress(null)
    }
  }

  // Handle delete episode
  const handleDeleteEpisode = async (id: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa tập phim này? Tất cả video và media sẽ bị xóa vĩnh viễn.")) {
      return
    }
    
    try {
      // Tìm episode để lấy thông tin
      const episode = episodes.find(ep => ep.id === id)
      if (!episode) {
        toast.error("Không tìm thấy tập phim")
        return
      }
      
      console.log(`🗑️ Bắt đầu xóa episode ${id} với improved API...`)
      
      try {
        // Sử dụng improved delete API - xóa hoàn toàn (R2 + database)
        console.log(`🚀 Gọi improved delete API cho episode ${id}...`)
        await episodeApi.deleteCompletely(id)
        console.log(`✅ Improved API đã xóa hoàn toàn episode ${id}`)
        
        toast.success("Đã xóa tập phim và tất cả media liên quan thành công")
        
      } catch (improvedError: any) {
        console.error(`❌ Improved API thất bại cho episode ${id}:`, improvedError)
        
        // Fallback to legacy method
        console.log(`🔄 Fallback to legacy method cho episode ${id}...`)
        
        // Bước 1: Xóa database trước (để tránh trạng thái inconsistent)
        await episodeApi.delete(id)
        
        // Bước 2: Xóa toàn bộ folder của episode trên R2
        try {
          // Thử direct API trước với improved error handling
          const result = await mediaApi.handleR2ApiCall(
            () => mediaApi.deleteEpisodeR2Folder(movieId, id),
            `xóa folder episode ${id}`
          )
          console.log(`Đã xóa folder R2 của episode ${id} qua ${result.method}`)
        } catch (directError) {
          console.warn(`Direct API thất bại cho episode ${id}:`, directError)
          
          // Fallback: Xóa từng file riêng lẻ với improved handling
          try {
            const cleanupResults = await Promise.allSettled([
              // HLS folder
              mediaApi.handleR2ApiCall(
                () => mediaApi.deleteEpisodeHLSFolder(movieId, id),
                `xóa HLS folder episode ${id}`
              ).catch(() => api.delete(`/api/media/episodes/${movieId}/${id}/hls`)),
              
              // Original video
              mediaApi.handleR2ApiCall(
                () => mediaApi.deleteEpisodeOriginalVideo(movieId, id),
                `xóa video gốc episode ${id}`
              ).catch(() => api.delete(`/api/media/episodes/${movieId}/${id}/video`)),
              
              // Thumbnail
              mediaApi.handleR2ApiCall(
                () => mediaApi.deleteEpisodeThumbnail(movieId, id),
                `xóa thumbnail episode ${id}`
              ).catch(() => api.delete(`/api/media/episodes/${movieId}/${id}/thumbnail`)),
            ])
            
            const successful = cleanupResults.filter(r => r.status === 'fulfilled').length
            console.log(`Đã xóa ${successful}/3 file media của episode ${id}`)
          } catch (individualError) {
            console.warn(`Không thể xóa các file riêng lẻ của episode ${id}:`, individualError)
          }
        }
        
        toast.success("Đã xóa tập phim và tất cả media liên quan thành công (fallback)")
      }
      
      // Cleanup UI states
      setProcessingPollingIds(prev => prev.filter(episodeId => episodeId !== id))
      setUploads(prev => prev.filter(upload => !upload.id.includes(`-${id}-`)))
      
      // Cập nhật danh sách tập phim
      fetchEpisodes()
    } catch (error) {
      console.error("Error deleting episode:", error)
      toast.error("Không thể xóa tập phim")
    }
  }

  // Show processing status dialog
  const showProcessingStatus = (episode: Episode) => {
    setSelectedEpisode(episode)
    setIsProcessingDialogOpen(true)
    
    // Khởi tạo trạng thái mặc định trước khi gọi API
    setProcessingStatus({
      isProcessed: episode.isProcessed,
      progress: 0,
      playlistUrl: episode.playlistUrl,
      thumbnailUrl: episode.thumbnailUrl,
      estimatedTimeRemaining: "Đang tính...",
      steps: [
        { name: "Tải lên video gốc", status: "completed", completedAt: new Date().toISOString() },
        { name: "Tạo thumbnail", status: "pending" },
        { name: "Chuyển đổi sang HLS", status: "pending" },
        { name: "Tạo playlist", status: "pending" }
      ]
    })
    
    // Fetch current processing status
    episodeApi.getDetailedProcessingStatus(movieId, episode.id)
      .then(response => {
        const { isProcessed, progress, playlistUrl, thumbnailUrl, estimatedTimeRemaining, steps } = response.data
        
        setProcessingStatus({
          isProcessed,
          progress: progress || 0,
          playlistUrl: playlistUrl || episode.playlistUrl,
          thumbnailUrl: thumbnailUrl || episode.thumbnailUrl,
          estimatedTimeRemaining: estimatedTimeRemaining || "Đang tính...",
          steps: steps || [
            { name: "Tải lên video gốc", status: "completed", completedAt: new Date().toISOString() },
            { name: "Tạo thumbnail", status: isProcessed ? "completed" : "processing", progress: progress || 30 },
            { name: "Chuyển đổi sang HLS", status: isProcessed ? "completed" : "pending" },
            { name: "Tạo playlist", status: isProcessed ? "completed" : "pending" }
          ]
        })
      })
      .catch(error => {
        console.error("Error fetching processing status:", error)
        toast.error("Không thể lấy trạng thái xử lý")
      })
  }

  // Render status badge
  const renderStatusBadge = (episode: Episode) => {
    if (episode.isProcessed === false) {
      return (
        <Badge variant="warning" className="flex items-center gap-1">
          <Clock size={14} />
          <span>Đang xử lý</span>
        </Badge>
      )
    } else if (episode.playlistUrl) {
      return (
        <Badge variant="success" className="flex items-center gap-1">
          <CheckCircle size={14} />
          <span>Hoàn thành</span>
        </Badge>
      )
    } else {
      return (
        <Badge variant="error" className="flex items-center gap-1">
          <AlertTriangle size={14} />
          <span>Lỗi</span>
        </Badge>
      )
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Danh sách tập phim</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Thêm tập phim
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Thêm tập phim mới</DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              {/* Episode info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="episodeNumber">Số tập *</Label>
                  <Input
                    id="episodeNumber"
                    name="episodeNumber"
                    type="number"
                    value={formData.episodeNumber}
                    onChange={handleNumberChange}
                    min={1}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="title">Tên tập *</Label>
                  <Input
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="Nhập tên tập phim"
                    required
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="description">Mô tả</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Nhập mô tả tập phim"
                  rows={3}
                />
              </div>
              
              {/* Video upload */}
              <div>
                <Label htmlFor="video">Video *</Label>
                {videoFile ? (
                  <div className="mt-2 p-4 border rounded-md">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{videoFile.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(videoFile.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={clearFile}
                      >
                        <X size={16} />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="relative flex flex-col items-center justify-center w-full border-2 border-dashed rounded-md mt-2 p-8">
                    <FileVideo className="h-8 w-8 text-gray-400 mb-2" />
                    <p className="text-sm text-center text-gray-500">
                      Kéo thả file video vào đây hoặc click để chọn file
                    </p>
                    <p className="text-xs text-center text-gray-400 mt-1">
                      MP4, WEBM (Tối đa: 2GB)
                    </p>
                    <input
                      id="video"
                      type="file"
                      accept="video/mp4,video/webm"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      onChange={handleFileSelect}
                      required={!videoFile}
                    />
                  </div>
                )}
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Hủy
                </Button>
                <Button type="submit">Tạo tập phim</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      
      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <Input
                  placeholder="Tìm kiếm tập phim..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="w-[180px]">
              <Select 
                value={statusFilter} 
                onValueChange={(value) => setStatusFilter(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả trạng thái</SelectItem>
                  <SelectItem value="processed">Đã xử lý</SelectItem>
                  <SelectItem value="processing">Đang xử lý</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Episodes table */}
      <Card>
        <CardHeader>
          <CardTitle>Tập phim</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Đang tải dữ liệu...</div>
          ) : filteredEpisodes.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Chưa có tập phim nào</p>
              <Button className="mt-4" onClick={() => setIsDialogOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Thêm tập phim
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Thumbnail</TableHead>
                  <TableHead className="w-[60px]">Tập</TableHead>
                  <TableHead>Tên tập</TableHead>
                  <TableHead className="hidden md:table-cell">Thời lượng</TableHead>
                  <TableHead className="hidden lg:table-cell">Lượt xem</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>HLS</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEpisodes.map((episode) => (
                  <TableRow key={episode.id}>
                    <TableCell className="p-2">
                      {episode.thumbnailUrl ? (
                        <div className="relative w-[60px] h-[34px] overflow-hidden rounded">
                          <img
                            src={episode.thumbnailUrl}
                            alt={episode.title}
                            className="object-cover w-full h-full"
                          />
                        </div>
                      ) : (
                        <div className="w-[60px] h-[34px] bg-gray-200 dark:bg-gray-800 rounded flex items-center justify-center">
                          <FileVideo className="text-gray-400" size={16} />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium text-center">
                      {episode.episodeNumber}
                    </TableCell>
                    <TableCell className="font-medium">
                      {episode.title}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {episode.duration ? `${Math.floor(episode.duration / 60)}:${(episode.duration % 60).toString().padStart(2, '0')}` : "--:--"}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {episode.views?.toLocaleString() || 0}
                    </TableCell>
                    <TableCell>
                      {renderStatusBadge(episode)}
                    </TableCell>
                    <TableCell>
                      {episode.playlistUrl ? (
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                        >
                          <a href={episode.playlistUrl} target="_blank" rel="noopener noreferrer">
                            <Play className="mr-2 h-4 w-4" />
                            Xem
                          </a>
                        </Button>
                      ) : (
                        <span>--</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        {episode.isProcessed === false ? (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => showProcessingStatus(episode)}
                            >
                              <Clock className="mr-2 h-4 w-4" />
                              Theo dõi
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteEpisode(episode.id)}
                            >
                              <X className="mr-2 h-4 w-4" />
                              Hủy
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              asChild
                            >
                              <Link href={`/movies/${movieId}/episodes/${episode.id}/edit`}>
                                <Edit className="mr-2 h-4 w-4" />
                                Sửa
                              </Link>
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteEpisode(episode.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Xóa
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      {/* Processing status dialog */}
      <Dialog open={isProcessingDialogOpen} onOpenChange={setIsProcessingDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Theo dõi xử lý: {selectedEpisode?.title || ""}
            </DialogTitle>
          </DialogHeader>
          
          {processingStatus ? (
            <div className="space-y-4">
              <div>
                <p className="font-medium">
                  Trạng thái: {processingStatus.isProcessed ? "Hoàn thành" : "Đang xử lý"}
                </p>
                <Progress 
                  value={processingStatus.progress} 
                  className="mt-2"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  {processingStatus.progress}% - Thời gian ước tính còn lại: {processingStatus.estimatedTimeRemaining || "Đang tính..."}
                </p>
              </div>
              
              <div>
                <p className="font-medium mb-2">Chi tiết xử lý:</p>
                <div className="space-y-2">
                  {processingStatus.steps?.map((step: any, index: number) => (
                    <div key={index} className="flex items-center">
                      {step.status === "completed" ? (
                        <CheckCircle className="text-green-500 mr-2" size={16} />
                      ) : step.status === "processing" ? (
                        <Clock className="text-yellow-500 mr-2" size={16} />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-gray-300 mr-2" />
                      )}
                      <span>
                        {step.name} {step.status === "processing" && step.progress ? `(${step.progress}%)` : ""}
                      </span>
                      {step.status === "completed" && step.completedAt && (
                        <span className="text-xs text-gray-500 ml-auto">
                          {new Date(step.completedAt).toLocaleTimeString()}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              {selectedEpisode?.thumbnailUrl && (
                <div>
                  <p className="font-medium mb-2">Thumbnail:</p>
                  <div className="relative aspect-video w-full max-w-[300px] overflow-hidden rounded-md">
                    <img
                      src={selectedEpisode.thumbnailUrl}
                      alt="Thumbnail"
                      className="object-cover w-full h-full"
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-40">
              <p>Đang tải thông tin...</p>
            </div>
          )}
          
          <DialogFooter>
            <Button onClick={() => setIsProcessingDialogOpen(false)}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Upload Progress Manager */}
      <UploadProgressManager
        uploads={uploads}
        onRemoveUpload={removeUpload}
        onClearCompleted={clearCompletedUploads}
      />
    </div>
  )
} 