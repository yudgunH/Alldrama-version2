"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { MediaUploader } from "@/components/ui/media-uploader"
import { movieApi, genreApi } from "@/services/api"
import { Genre } from "@/models"
import { toast } from "react-hot-toast"

export default function NewMoviePage() {
  const router = useRouter()
  const [genres, setGenres] = useState<Genre[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  
  const [form, setForm] = useState({
    title: "",
    summary: "",
    releaseYear: new Date().getFullYear(),
    duration: 90,
    totalEpisodes: 1,
    genreIds: [] as number[],
    posterUrl: null as string | null,
    trailerUrl: null as string | null,
  })

  // Fetch genres
  useEffect(() => {
    const fetchGenres = async () => {
      try {
        setLoading(true)
        const genresRes = await genreApi.getAll()
        setGenres(genresRes.data)
      } catch (error) {
        console.error("Error fetching genres:", error)
        toast.error("Không thể tải danh sách thể loại")
      } finally {
        setLoading(false)
      }
    }
    
    fetchGenres()
  }, [])

  // Handle form input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  // Handle genre selection
  const handleGenreChange = (genreId: number) => {
    setForm(prev => {
      const exists = prev.genreIds.includes(genreId)
      
      if (exists) {
        return {
          ...prev,
          genreIds: prev.genreIds.filter(id => id !== genreId)
        }
      } else {
        return {
          ...prev,
          genreIds: [...prev.genreIds, genreId]
        }
      }
    })
  }

  // Create movie
  const handleCreateMovie = async () => {
    // Validate form
    if (!form.title) {
      toast.error("Vui lòng nhập tiêu đề phim")
      return
    }
    
    if (form.genreIds.length === 0) {
      toast.error("Vui lòng chọn ít nhất một thể loại")
      return
    }
    
    try {
      setSubmitting(true)
      
      const response = await movieApi.create({
        title: form.title,
        summary: form.summary,
        releaseYear: form.releaseYear,
        duration: form.duration,
        totalEpisodes: form.totalEpisodes,
        genreIds: form.genreIds,
        posterUrl: form.posterUrl,
        trailerUrl: form.trailerUrl,
      })
      
      toast.success("Tạo phim thành công")
      
      // Redirect to movie management page
      const movieId = response.data.id
      router.push(`/movies/manage/${movieId}`)
    } catch (error) {
      console.error("Error creating movie:", error)
      toast.error("Không thể tạo phim mới")
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => router.push("/movies")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Thêm phim mới</h1>
        </div>
        
        <Button 
          onClick={handleCreateMovie} 
          disabled={submitting || !form.title || form.genreIds.length === 0}
        >
          <Save className="mr-2 h-4 w-4" /> Tạo phim
        </Button>
      </div>

      {/* Movie Form */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Basic Info */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Thông tin cơ bản</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium mb-1">
                Tiêu đề *
              </label>
              <Input
                id="title"
                name="title"
                value={form.title}
                onChange={handleInputChange}
                placeholder="Nhập tiêu đề phim"
              />
            </div>
            <div>
              <label htmlFor="releaseYear" className="block text-sm font-medium mb-1">
                Năm phát hành
              </label>
              <Input
                id="releaseYear"
                name="releaseYear"
                type="number"
                value={form.releaseYear}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <label htmlFor="duration" className="block text-sm font-medium mb-1">
                Thời lượng (phút)
              </label>
              <Input
                id="duration"
                name="duration"
                type="number"
                value={form.duration}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <label htmlFor="totalEpisodes" className="block text-sm font-medium mb-1">
                Tổng số tập
              </label>
              <Input
                id="totalEpisodes"
                name="totalEpisodes"
                type="number"
                value={form.totalEpisodes}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Thể loại *
              </label>
              {loading ? (
                <div className="text-sm">Đang tải...</div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {genres.map(genre => (
                    <Button
                      key={genre.id}
                      variant={form.genreIds.includes(genre.id) ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleGenreChange(genre.id)}
                    >
                      {genre.name}
                    </Button>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label htmlFor="summary" className="block text-sm font-medium mb-1">
                Tóm tắt
              </label>
              <Textarea
                id="summary"
                name="summary"
                value={form.summary}
                onChange={handleInputChange}
                placeholder="Nhập tóm tắt nội dung phim"
                rows={5}
              />
            </div>
          </CardContent>
        </Card>

        {/* Media */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Media</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-2">Poster</h3>
              {form.posterUrl ? (
                <div className="relative aspect-[2/3] max-w-[200px] overflow-hidden rounded-md mb-4">
                  <img 
                    src={form.posterUrl}
                    alt="Poster"
                    className="object-cover w-full h-full"
                  />
                </div>
              ) : (
                <div className="bg-muted flex items-center justify-center aspect-[2/3] max-w-[200px] rounded-md mb-4">
                  <p className="text-sm text-muted-foreground">Chưa có poster</p>
                </div>
              )}
              
              <MediaUploader
                movieId={0} // ID tạm thời, sẽ được cập nhật sau khi tạo phim
                fileType="poster"
                onUploadComplete={(url) => {
                  setForm(prev => ({ ...prev, posterUrl: url }))
                  toast.success("Tải poster thành công")
                }}
                onUploadError={(error) => toast.error(`Lỗi: ${error}`)}
                accept="image/*"
              />
            </div>

            <div>
              <h3 className="text-lg font-medium mb-2">Trailer</h3>
              {form.trailerUrl ? (
                <div className="max-w-full overflow-hidden rounded-md mb-4">
                  <video 
                    src={form.trailerUrl}
                    controls
                    className="w-full max-h-[300px]"
                  />
                </div>
              ) : (
                <div className="bg-muted flex items-center justify-center aspect-video max-w-full rounded-md mb-4">
                  <p className="text-sm text-muted-foreground">Chưa có trailer</p>
                </div>
              )}
              
              <MediaUploader
                movieId={0} // ID tạm thời, sẽ được cập nhật sau khi tạo phim
                fileType="trailer"
                onUploadComplete={(url) => {
                  setForm(prev => ({ ...prev, trailerUrl: url }))
                  toast.success("Tải trailer thành công")
                }}
                onUploadError={(error) => toast.error(`Lỗi: ${error}`)}
                accept="video/*"
              />
            </div>
            
            <div className="p-4 bg-muted rounded-md mt-4">
              <p className="text-sm text-muted-foreground">
                <strong>Lưu ý:</strong> Sau khi tạo phim, bạn sẽ có thể thêm các tập phim và quản lý các thông tin khác.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 