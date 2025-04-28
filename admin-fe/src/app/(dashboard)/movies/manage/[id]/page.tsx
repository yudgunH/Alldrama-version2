"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Edit, Save, Trash } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MediaUploader } from "@/components/ui/media-uploader"
import { EpisodeManager } from "@/components/episodes/episode-manager"
import { movieApi, genreApi } from "@/services/api"
import { Movie, Genre } from "@/models"
import { toast } from "react-hot-toast"

export default function MovieManagePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const movieId = parseInt(params.id)
  
  const [movie, setMovie] = useState<Movie | null>(null)
  const [genres, setGenres] = useState<Genre[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  
  const [form, setForm] = useState({
    title: "",
    summary: "",
    releaseYear: new Date().getFullYear(),
    duration: 0,
    totalEpisodes: 0,
    genreIds: [] as number[],
    posterUrl: null as string | null,
    trailerUrl: null as string | null,
  })

  // Fetch movie details
  useEffect(() => {
    const fetchMovie = async () => {
      try {
        setLoading(true)
        const [movieRes, genresRes] = await Promise.all([
          movieApi.getById(movieId),
          genreApi.getAll()
        ])
        
        const movieData = movieRes.data
        setMovie(movieData)
        setGenres(genresRes.data)
        
        // Initialize form
        setForm({
          title: movieData.title,
          summary: movieData.summary,
          releaseYear: movieData.releaseYear,
          duration: movieData.duration,
          totalEpisodes: movieData.totalEpisodes,
          genreIds: movieData.genres.map((g: Genre) => g.id),
          posterUrl: movieData.posterUrl,
          trailerUrl: movieData.trailerUrl,
        })
      } catch (error) {
        console.error("Error fetching movie details:", error)
        toast.error("Không thể tải thông tin phim")
      } finally {
        setLoading(false)
      }
    }
    
    fetchMovie()
  }, [movieId])

  // Handle form input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  // Handle select change
  const handleSelectChange = (name: string, value: string) => {
    setForm(prev => ({ ...prev, [name]: parseInt(value) }))
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

  // Save movie changes
  const handleSaveChanges = async () => {
    try {
      await movieApi.update(movieId, {
        title: form.title,
        summary: form.summary,
        releaseYear: form.releaseYear,
        duration: form.duration,
        totalEpisodes: form.totalEpisodes,
        genreIds: form.genreIds,
        posterUrl: form.posterUrl,
        trailerUrl: form.trailerUrl,
      })
      
      toast.success("Cập nhật phim thành công")
      setEditing(false)
      
      // Refresh movie data
      const movieRes = await movieApi.getById(movieId)
      setMovie(movieRes.data)
    } catch (error) {
      console.error("Error updating movie:", error)
      toast.error("Không thể cập nhật phim")
    }
  }

  // Delete movie
  const handleDeleteMovie = async () => {
    if (!confirm("Bạn có chắc chắn muốn xóa phim này? Tất cả tập phim và dữ liệu liên quan sẽ bị xóa.")) {
      return
    }
    
    try {
      await movieApi.delete(movieId)
      toast.success("Đã xóa phim")
      router.push("/movies")
    } catch (error) {
      console.error("Error deleting movie:", error)
      toast.error("Không thể xóa phim")
    }
  }

  if (loading) {
    return <div className="p-4 text-center">Đang tải...</div>
  }

  if (!movie) {
    return <div className="p-4 text-center">Không tìm thấy phim</div>
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => router.push("/movies")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">{movie.title}</h1>
        </div>
        
        <div className="flex items-center gap-2">
          {editing ? (
            <>
              <Button variant="outline" onClick={() => setEditing(false)}>
                Hủy
              </Button>
              <Button onClick={handleSaveChanges}>
                <Save className="mr-2 h-4 w-4" /> Lưu thay đổi
              </Button>
            </>
          ) : (
            <>
              <Button variant="destructive" onClick={handleDeleteMovie}>
                <Trash className="mr-2 h-4 w-4" /> Xóa phim
              </Button>
              <Button onClick={() => setEditing(true)}>
                <Edit className="mr-2 h-4 w-4" /> Chỉnh sửa
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Movie Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Media and Info */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Thông tin phim</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {editing ? (
              <>
                <div>
                  <label htmlFor="title" className="block text-sm font-medium mb-1">
                    Tiêu đề
                  </label>
                  <Input
                    id="title"
                    name="title"
                    value={form.title}
                    onChange={handleInputChange}
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
                    Thể loại
                  </label>
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
                    rows={5}
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <p className="text-sm font-medium">ID:</p>
                  <p>{movie.id}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Năm phát hành:</p>
                  <p>{movie.releaseYear}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Thời lượng:</p>
                  <p>{movie.duration} phút</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Tổng số tập:</p>
                  <p>{movie.totalEpisodes}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Thể loại:</p>
                  <div className="flex flex-wrap gap-1">
                    {movie.genres.map(genre => (
                      <span
                        key={genre.id}
                        className="bg-secondary text-secondary-foreground px-2 py-1 rounded text-xs"
                      >
                        {genre.name}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium">Lượt xem:</p>
                  <p>{movie.views}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Đánh giá:</p>
                  <p>{movie.rating} / 10</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Tóm tắt:</p>
                  <p className="text-sm">{movie.summary}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Media uploads */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Media</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-2">Poster</h3>
              {form.posterUrl ? (
                <div className="relative aspect-[2/3] max-w-[200px] overflow-hidden rounded-md mb-2">
                  <img 
                    src={form.posterUrl}
                    alt={movie.title}
                    className="object-cover w-full h-full"
                  />
                </div>
              ) : (
                <div className="bg-muted flex items-center justify-center aspect-[2/3] max-w-[200px] rounded-md mb-2">
                  <p className="text-sm text-muted-foreground">Chưa có poster</p>
                </div>
              )}
              
              {editing && (
                <MediaUploader
                  movieId={movieId}
                  fileType="poster"
                  onUploadComplete={(url) => {
                    setForm(prev => ({ ...prev, posterUrl: url }))
                    toast.success("Tải poster thành công")
                  }}
                  onUploadError={(error) => toast.error(`Lỗi: ${error}`)}
                  accept="image/*"
                />
              )}
            </div>

            <div>
              <h3 className="text-lg font-medium mb-2">Trailer</h3>
              {form.trailerUrl ? (
                <div className="max-w-full overflow-hidden rounded-md mb-2">
                  <video 
                    src={form.trailerUrl}
                    controls
                    className="w-full max-h-[300px]"
                  />
                </div>
              ) : (
                <div className="bg-muted flex items-center justify-center aspect-video max-w-full rounded-md mb-2">
                  <p className="text-sm text-muted-foreground">Chưa có trailer</p>
                </div>
              )}
              
              {editing && (
                <MediaUploader
                  movieId={movieId}
                  fileType="trailer"
                  onUploadComplete={(url) => {
                    setForm(prev => ({ ...prev, trailerUrl: url }))
                    toast.success("Tải trailer thành công")
                  }}
                  onUploadError={(error) => toast.error(`Lỗi: ${error}`)}
                  accept="video/*"
                />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Episode Manager */}
      <EpisodeManager movieId={movieId} movieTitle={movie.title} />
    </div>
  )
} 