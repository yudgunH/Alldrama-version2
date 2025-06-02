"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { toast } from "react-hot-toast"
import { episodeApi, movieApi } from "@/services/api"
import { Episode, Movie } from "@/models"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Breadcrumb } from "@/components/ui/breadcrumb"
import { Save, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function EditEpisodePage() {
  const { id: movieId, episodeId } = useParams()
  const router = useRouter()
  const [episode, setEpisode] = useState<Episode | null>(null)
  const [movie, setMovie] = useState<Movie | null>(null)
  const [loading, setLoading] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    episodeNumber: 1,
  })

  // Fetch episode and movie data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [episodeResponse, movieResponse] = await Promise.all([
          episodeApi.getById(Number(episodeId)),
          movieApi.getById(Number(movieId))
        ])
        
        const episodeData = episodeResponse.data
        const movieData = movieResponse.data
        
        setEpisode(episodeData)
        setMovie(movieData)
        
        // Set form data
        setFormData({
          title: episodeData.title || "",
          description: episodeData.description || "",
          episodeNumber: episodeData.episodeNumber || 1,
        })
      } catch (error) {
        console.error("Error fetching data:", error)
        toast.error("Không thể tải thông tin tập phim")
        router.push(`/movies/${movieId}`)
      }
    }
    
    fetchData()
  }, [episodeId, movieId, router])

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

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!episode) return
    
    // Validate form
    if (!formData.title) {
      toast.error("Vui lòng nhập tiêu đề tập phim")
      return
    }
    
    if (formData.episodeNumber < 1) {
      toast.error("Số tập phải lớn hơn 0")
      return
    }
    
    setLoading(true)
    
    try {
      await episodeApi.update(episode.id, formData)
      toast.success("Cập nhật tập phim thành công!")
      router.push(`/movies/${movieId}?tab=episodes`)
    } catch (error: any) {
      console.error("Error updating episode:", error)
      const errorMessage = error.response?.data?.message || error.message || "Không thể cập nhật tập phim"
      toast.error(`Lỗi: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  if (!episode || !movie) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Đang tải thông tin tập phim...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <Breadcrumb 
        items={[
          { label: "Quản lý Phim", href: "/movies" },
          { label: movie.title, href: `/movies/${movie.id}` },
          { label: `Tập ${episode.episodeNumber}`, href: `/movies/${movie.id}?tab=episodes` },
          { label: "Chỉnh sửa", href: "#" }
        ]}
      />

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Chỉnh sửa tập phim</h1>
        <Button variant="outline" asChild>
          <Link href={`/movies/${movieId}?tab=episodes`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại
          </Link>
        </Button>
      </div>

      <form onSubmit={handleSubmit} className={loading ? "opacity-50 pointer-events-none" : ""}>
        {/* Episode information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Thông tin tập phim</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Episode media info (read-only) */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Thông tin media</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between border-b pb-2">
                  <span className="font-medium">ID tập phim:</span>
                  <span>{episode.id}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="font-medium">Thời lượng:</span>
                  <span>
                    {episode.duration 
                      ? `${Math.floor(episode.duration / 60)}:${(episode.duration % 60).toString().padStart(2, '0')}` 
                      : "--:--"
                    }
                  </span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="font-medium">Lượt xem:</span>
                  <span>{episode.views?.toLocaleString() || 0}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="font-medium">Trạng thái xử lý:</span>
                  <span>{episode.isProcessed ? "Đã hoàn thành" : "Đang xử lý"}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between border-b pb-2">
                  <span className="font-medium">URL Playlist:</span>
                  <span className="truncate max-w-[200px]" title={episode.playlistUrl || "-"}>
                    {episode.playlistUrl ? "✓" : "-"}
                  </span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="font-medium">URL Thumbnail:</span>
                  <span className="truncate max-w-[200px]" title={episode.thumbnailUrl || "-"}>
                    {episode.thumbnailUrl ? "✓" : "-"}
                  </span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="font-medium">Ngày tạo:</span>
                  <span>
                    {episode.createdAt 
                      ? new Date(episode.createdAt).toLocaleDateString('vi-VN')
                      : "-"
                    }
                  </span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="font-medium">Cập nhật cuối:</span>
                  <span>
                    {episode.updatedAt 
                      ? new Date(episode.updatedAt).toLocaleDateString('vi-VN')
                      : "-"
                    }
                  </span>
                </div>
              </div>
            </div>

            {/* Thumbnail preview */}
            {episode.thumbnailUrl && (
              <div className="mt-4">
                <Label>Thumbnail hiện tại</Label>
                <div className="relative aspect-video w-full max-w-[400px] overflow-hidden rounded-md mt-2">
                  <img
                    src={episode.thumbnailUrl}
                    alt={`Thumbnail tập ${episode.episodeNumber}`}
                    className="object-cover w-full h-full"
                  />
                </div>
              </div>
            )}

            {/* HLS Playlist link */}
            {episode.playlistUrl && (
              <div className="mt-4">
                <Label>Video player</Label>
                <div className="mt-2">
                  <Button asChild variant="outline">
                    <a href={episode.playlistUrl} target="_blank" rel="noopener noreferrer">
                      Xem video
                    </a>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Form buttons */}
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/movies/${movieId}?tab=episodes`)}
            disabled={loading}
          >
            Hủy
          </Button>
          <Button
            type="submit"
            disabled={loading}
          >
            <Save className="mr-2 h-4 w-4" />
            {loading ? "Đang cập nhật..." : "Cập nhật tập phim"}
          </Button>
        </div>
      </form>
    </div>
  )
} 