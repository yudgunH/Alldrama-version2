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
          const response = await episodeApi.getProcessingStatus(episodeId)
          
          const { isProcessed, progress } = response.data
          
          if (isProcessed) {
            // Xóa khỏi danh sách polling
            setProcessingPollingIds(prev => prev.filter(id => id !== episodeId))
            toast.success(`Tập phim đã xử lý xong`)
            
            // Cập nhật danh sách tập phim
            fetchEpisodes()
          } else if (selectedEpisode?.id === episodeId) {
            // Cập nhật trạng thái xử lý nếu đang xem chi tiết
            setProcessingStatus(response.data)
          }
        } catch (error) {
          console.error(`Error checking processing status for episode ${episodeId}:`, error)
        }
      }
    }, 5000) // Kiểm tra mỗi 5 giây
    
    return () => clearInterval(pollingInterval)
  }, [processingPollingIds, selectedEpisode, fetchEpisodes])

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
  ): Promise<string | null> => {
    try {
      // Lấy presigned URL
      const response = await mediaApi.getPresignedUrl({
        movieId,
        episodeId,
        fileType: "video",
      })
      
      const { presignedUrl, contentType, cdnUrl } = response.data
      
      // Upload file
      await api.put(presignedUrl, file, {
        headers: {
          "Content-Type": contentType || file.type,
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
            if (uploadProgress) {
              setUploadProgress(prev => prev ? { ...prev, progress } : null)
            }
          }
        }
      })
      
      return `${cdnUrl}episodes/${movieId}/${episodeId}/hls/master.m3u8`
    } catch (error) {
      console.error(`Error uploading video:`, error)
      toast.error(`Không thể tải lên video`)
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
    
    try {
      // Step 1: Create new episode (without media URL)
      const episodeResponse = await episodeApi.create(movieId, {
        episodeNumber: formData.episodeNumber,
        title: formData.title,
        description: formData.description,
      })
      
      const episodeId = episodeResponse.data.id
      
      if (!episodeId) {
        throw new Error("Không thể lấy ID tập phim sau khi tạo")
      }
      
      // Set upload progress
      setUploadProgress({
        id: `new-episode-${Date.now()}`,
        title: `${movieTitle} - Tập ${formData.episodeNumber}: ${formData.title}`,
        progress: 0
      })
      
      // Step 2: Upload video
      await uploadWithPresignedUrl(
        episodeId,
        videoFile
      )
      
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
    } catch (error) {
      console.error("Error creating episode:", error)
      toast.error("Không thể tạo tập phim mới")
      setUploadProgress(null)
    }
  }

  // Handle delete episode
  const handleDeleteEpisode = async (id: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa tập phim này?")) {
      return
    }
    
    try {
      await episodeApi.delete(id)
      toast.success("Đã xóa tập phim thành công")
      
      // Xóa khỏi danh sách polling
      setProcessingPollingIds(prev => prev.filter(episodeId => episodeId !== id))
      
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
    
    // Fetch current processing status
    episodeApi.getProcessingStatus(episode.id)
      .then(response => {
        setProcessingStatus(response.data)
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
                  <div className="flex flex-col items-center justify-center w-full border-2 border-dashed rounded-md mt-2 p-8">
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
    </div>
  )
} 