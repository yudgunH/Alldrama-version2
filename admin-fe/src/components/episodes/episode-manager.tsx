"use client"

import { useState, useEffect } from "react"
import { Plus, Play, Trash2, AlertCircle, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { MediaUploader } from "@/components/ui/media-uploader"
import { HLSPlayer } from "@/components/ui/hls-player"
import { episodeApi, mediaApi } from "@/services/api"
import { Episode, EpisodeUploadProgress } from "@/models"
import { toast } from "react-hot-toast"

interface EpisodeManagerProps {
  movieId: number
  movieTitle: string
}

export function EpisodeManager({ movieId, movieTitle }: EpisodeManagerProps) {
  const [episodes, setEpisodes] = useState<Episode[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showPreviewDialog, setShowPreviewDialog] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [uploadingEpisodes, setUploadingEpisodes] = useState<EpisodeUploadProgress[]>([])
  const [processingPollingIds, setProcessingPollingIds] = useState<number[]>([])
  
  const [newEpisode, setNewEpisode] = useState({
    episodeNumber: 1,
    title: "",
    description: "",
    thumbnailUrl: null as string | null,
    videoUrl: null as string | null,
  })

  // Fetch episodes
  const fetchEpisodes = async () => {
    try {
      setLoading(true)
      const response = await episodeApi.getByMovieId(movieId)
      setEpisodes(response.data)
      
      // Kiểm tra xem có tập nào đang xử lý không
      const processingEpisodes = response.data.filter((ep: Episode) => ep.isProcessed === false)
      if (processingEpisodes.length > 0) {
        // Thêm vào danh sách để polling
        setProcessingPollingIds(processingEpisodes.map((ep: Episode) => ep.id))
      }
    } catch (error) {
      console.error("Error fetching episodes:", error)
      toast.error("Không thể tải danh sách tập phim")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEpisodes()
  }, [movieId])
  
  // Polling để kiểm tra trạng thái xử lý
  useEffect(() => {
    if (processingPollingIds.length === 0) return
    
    const pollingInterval = setInterval(async () => {
      for (const episodeId of processingPollingIds) {
        try {
          const response = await mediaApi.checkProcessingStatus(episodeId)
          const { isProcessed, playlistUrl } = response.data
          
          if (isProcessed) {
            // Cập nhật trạng thái
            setEpisodes(prev => 
              prev.map(ep => 
                ep.id === episodeId 
                  ? { ...ep, isProcessed: true, playlistUrl } 
                  : ep
              )
            )
            // Xóa khỏi danh sách polling
            setProcessingPollingIds(prev => prev.filter(id => id !== episodeId))
            toast.success(`Tập phim ${episodes.find(ep => ep.id === episodeId)?.episodeNumber} đã xử lý xong`)
          }
        } catch (error) {
          console.error(`Error checking processing status for episode ${episodeId}:`, error)
        }
      }
    }, 10000) // Kiểm tra mỗi 10 giây
    
    return () => clearInterval(pollingInterval)
  }, [processingPollingIds, episodes])

  // Add a new episode
  const handleAddEpisode = async () => {
    try {
      // Kiểm tra dữ liệu
      if (!newEpisode.episodeNumber || !newEpisode.title) {
        toast.error("Vui lòng nhập số tập và tiêu đề")
        return
      }
      
      // Tạo tập phim mới
      const episodeData = {
        movieId,
        episodeNumber: newEpisode.episodeNumber,
        title: newEpisode.title,
        description: newEpisode.description,
        thumbnailUrl: newEpisode.thumbnailUrl,
        duration: 0, // Sẽ được cập nhật sau khi upload video
      }
      
      const response = await episodeApi.create(episodeData)
      const createdEpisode = response.data.episode
      
      // Tải video nếu có
      if (newEpisode.videoUrl) {
        // Đã tải video lên trong bước trước đó
        await episodeApi.update(createdEpisode.id, {
          ...createdEpisode,
          playlistUrl: newEpisode.videoUrl,
        })
      }
      
      toast.success("Thêm tập phim thành công")
      setShowAddDialog(false)
      
      // Reset form và tải lại danh sách
      setNewEpisode({
        episodeNumber: episodes.length + 1,
        title: "",
        description: "",
        thumbnailUrl: null,
        videoUrl: null,
      })
      
      fetchEpisodes()
    } catch (error) {
      console.error("Error adding episode:", error)
      toast.error("Không thể thêm tập phim")
    }
  }

  // Delete an episode
  const handleDeleteEpisode = async (episodeId: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa tập này không?")) return
    
    try {
      await episodeApi.delete(episodeId)
      toast.success("Đã xóa tập phim")
      fetchEpisodes()
    } catch (error) {
      console.error("Error deleting episode:", error)
      toast.error("Không thể xóa tập phim")
    }
  }

  // Preview episode
  const handlePreviewEpisode = (playlistUrl: string | null) => {
    if (!playlistUrl) {
      toast.error("Không có URL video để xem")
      return
    }
    
    setPreviewUrl(playlistUrl)
    setShowPreviewDialog(true)
  }

  // Update upload progress
  const updateEpisodeUploadProgress = (id: string, progress: number) => {
    setUploadingEpisodes(prev => 
      prev.map(upload => 
        upload.id === id ? { ...upload, progress } : upload
      )
    )
  }

  // Add uploading episode
  const addUploadingEpisode = (episode: EpisodeUploadProgress) => {
    setUploadingEpisodes(prev => [...prev, episode])
  }

  // Remove uploading episode
  const removeUploadingEpisode = (id: string) => {
    setUploadingEpisodes(prev => prev.filter(upload => upload.id !== id))
  }

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setNewEpisode(prev => ({ ...prev, [name]: value }))
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Quản lý tập phim: {movieTitle}</h2>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="mr-2 h-4 w-4" /> Thêm tập phim
        </Button>
      </div>

      {/* Uploading Progress */}
      {uploadingEpisodes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Đang tải lên</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {uploadingEpisodes.map(upload => (
                <div key={upload.id} className="space-y-2">
                  <div className="flex justify-between">
                    <span>
                      {upload.movieTitle} - Tập {upload.episodeNumber}
                    </span>
                    <span>{upload.progress}%</span>
                  </div>
                  <Progress value={upload.progress} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Episodes Table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách tập phim</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">Đang tải...</div>
          ) : episodes.length === 0 ? (
            <div className="text-center py-4">Chưa có tập phim nào</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Số tập</TableHead>
                  <TableHead>Tiêu đề</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Lượt xem</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {episodes.map(episode => (
                  <TableRow key={episode.id}>
                    <TableCell>{episode.episodeNumber}</TableCell>
                    <TableCell>{episode.title}</TableCell>
                    <TableCell>
                      {episode.isProcessed ? (
                        <div className="flex items-center text-green-500">
                          <CheckCircle className="mr-2 h-4 w-4" />
                          <span>Đã xử lý</span>
                        </div>
                      ) : (
                        <div className="flex items-center text-amber-500">
                          <AlertCircle className="mr-2 h-4 w-4" />
                          <span>Đang xử lý</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{episode.views}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePreviewEpisode(episode.playlistUrl)}
                          disabled={!episode.isProcessed || !episode.playlistUrl}
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteEpisode(episode.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Episode Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Thêm tập phim mới</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="episodeNumber" className="block text-sm font-medium mb-1">
                  Số tập
                </label>
                <Input
                  id="episodeNumber"
                  name="episodeNumber"
                  type="number"
                  min="1"
                  value={newEpisode.episodeNumber}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <label htmlFor="title" className="block text-sm font-medium mb-1">
                  Tiêu đề
                </label>
                <Input
                  id="title"
                  name="title"
                  value={newEpisode.title}
                  onChange={handleInputChange}
                  placeholder="Tiêu đề tập phim"
                />
              </div>
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium mb-1">
                Mô tả
              </label>
              <Textarea
                id="description"
                name="description"
                value={newEpisode.description}
                onChange={handleInputChange}
                placeholder="Mô tả tập phim"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Thumbnail</label>
              <MediaUploader
                movieId={movieId}
                fileType="thumbnail"
                onUploadComplete={(url) => {
                  setNewEpisode(prev => ({ ...prev, thumbnailUrl: url }))
                  toast.success("Tải thumbnail thành công")
                }}
                onUploadError={(error) => toast.error(`Lỗi: ${error}`)}
                accept="image/*"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Video</label>
              <MediaUploader
                movieId={movieId}
                fileType="video"
                onUploadComplete={(url) => {
                  setNewEpisode(prev => ({ ...prev, videoUrl: url }))
                  toast.success("Tải video thành công")
                }}
                onUploadError={(error) => toast.error(`Lỗi: ${error}`)}
                onUploadProgress={(progress) => {
                  const uploadId = `episode-${movieId}-${newEpisode.episodeNumber}`
                  const existingUpload = uploadingEpisodes.find(u => u.id === uploadId)
                  
                  if (existingUpload) {
                    updateEpisodeUploadProgress(uploadId, progress)
                  } else {
                    addUploadingEpisode({
                      id: uploadId,
                      movieTitle,
                      episodeNumber: newEpisode.episodeNumber,
                      progress
                    })
                  }
                  
                  if (progress === 100) {
                    removeUploadingEpisode(uploadId)
                  }
                }}
                accept="video/*"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Hủy
            </Button>
            <Button onClick={handleAddEpisode}>
              Thêm tập
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Xem trước tập phim</DialogTitle>
          </DialogHeader>
          <div className="aspect-video">
            {previewUrl && <HLSPlayer src={previewUrl} width="100%" height="100%" />}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 