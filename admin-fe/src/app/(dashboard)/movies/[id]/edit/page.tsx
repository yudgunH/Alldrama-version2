"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { toast } from "react-hot-toast"
import { api, movieApi, genreApi, mediaApi } from "@/services/api"
import { Movie, Genre } from "@/models"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Breadcrumb } from "@/components/ui/breadcrumb"
import { Upload, Image as ImageIcon, Film, X, Save, ArrowLeft } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default function EditMoviePage() {
  const { id } = useParams()
  const router = useRouter()
  const [movie, setMovie] = useState<Movie | null>(null)
  const [loading, setLoading] = useState(false)
  const [genres, setGenres] = useState<Genre[]>([])
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)
  const [uploadingFile, setUploadingFile] = useState<string | null>(null)
  
  // Form state
  const [formData, setFormData] = useState({
    title: "",
    summary: "",
    releaseYear: new Date().getFullYear(),
    duration: 90,
    genreIds: [] as number[],
    rating: 0,
    views: 0
  })
  
  // Media state
  const [posterFile, setPosterFile] = useState<File | null>(null)
  const [backdropFile, setBackdropFile] = useState<File | null>(null)
  const [trailerFile, setTrailerFile] = useState<File | null>(null)
  
  // Preview URLs
  const [posterPreview, setPosterPreview] = useState<string | null>(null)
  const [backdropPreview, setBackdropPreview] = useState<string | null>(null)
  const [trailerPreview, setTrailerPreview] = useState<string | null>(null)

  // Fetch movie data and genres
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [movieResponse, genresResponse] = await Promise.all([
          movieApi.getById(Number(id)),
          genreApi.getAll()
        ])
        
        const movieData = movieResponse.data
        setMovie(movieData)
        setGenres(genresResponse.data)
        
        // Set form data
        setFormData({
          title: movieData.title || "",
          summary: movieData.summary || "",
          releaseYear: movieData.releaseYear || new Date().getFullYear(),
          duration: movieData.duration || 90,
          genreIds: movieData.genreIds || [],
          rating: movieData.rating || 0,
          views: movieData.views || 0
        })
        
        // Set current media URLs as previews
        setPosterPreview(movieData.posterUrl)
        setBackdropPreview(movieData.backdropUrl)
        setTrailerPreview(movieData.trailerUrl)
      } catch (error) {
        console.error("Error fetching data:", error)
        toast.error("Không thể tải thông tin phim")
        router.push("/movies")
      }
    }
    
    fetchData()
  }, [id, router])

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }
  
  // Handle number input change
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: Number(value) }))
  }
  
  // Handle genre selection
  const handleGenreSelect = (genreId: number) => {
    setFormData((prev) => {
      const isSelected = prev.genreIds.includes(genreId)
      
      if (isSelected) {
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
  
  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'poster' | 'backdrop' | 'trailer') => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      
      if (type === 'poster') {
        setPosterFile(file)
        setPosterPreview(URL.createObjectURL(file))
      } else if (type === 'backdrop') {
        setBackdropFile(file)
        setBackdropPreview(URL.createObjectURL(file))
      } else if (type === 'trailer') {
        setTrailerFile(file)
        setTrailerPreview(URL.createObjectURL(file))
      }
    }
  }
  
  // Clear file
  const clearFile = (type: 'poster' | 'backdrop' | 'trailer') => {
    if (type === 'poster') {
      setPosterFile(null)
      setPosterPreview(movie?.posterUrl || null)
    } else if (type === 'backdrop') {
      setBackdropFile(null)
      setBackdropPreview(movie?.backdropUrl || null)
    } else if (type === 'trailer') {
      setTrailerFile(null)
      setTrailerPreview(movie?.trailerUrl || null)
    }
  }

  // Upload media with progress
  const uploadWithProgress = async (
    movieId: number,
    fileType: "poster" | "backdrop" | "trailer",
    file: File,
  ): Promise<string | null> => {
    try {
      setUploadingFile(fileType)
      
      const updateProgress = (progress: number) => {
        setUploadProgress(progress)
      }
      
      let result
      
      if (fileType === "poster") {
        result = await mediaApi.uploadMoviePoster(movieId, file, updateProgress)
      } else if (fileType === "backdrop") {
        result = await mediaApi.uploadMovieBackdrop(movieId, file, updateProgress)
      } else if (fileType === "trailer") {
        result = await mediaApi.uploadMovieTrailer(movieId, file, updateProgress)
      } else {
        throw new Error(`Loại file không hỗ trợ: ${fileType}`)
      }
      
      setUploadingFile(null)
      setUploadProgress(null)
      
      // Return URL from response
      if (fileType === "poster") {
        return result.data.url || `https://alldrama.tech/movies/${movieId}/poster.jpg`
      } else if (fileType === "backdrop") {
        return result.data.url || `https://alldrama.tech/movies/${movieId}/backdrop.jpg`
      } else if (fileType === "trailer") {
        return result.data.trailerUrl || `https://alldrama.tech/movies/${movieId}/trailer.mp4`
      }
      
      return null
    } catch (error) {
      console.error(`Error uploading ${fileType}:`, error)
      toast.error(`Không thể tải lên ${fileType}`)
      setUploadingFile(null)
      setUploadProgress(null)
      return null
    }
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!movie) return
    
    // Validate form
    if (!formData.title) {
      toast.error("Vui lòng nhập tiêu đề phim")
      return
    }
    
    if (formData.genreIds.length === 0) {
      toast.error("Vui lòng chọn ít nhất một thể loại")
      return
    }
    
    setLoading(true)
    
    try {
      // Step 1: Update basic movie info
      await movieApi.update(movie.id, formData)
      
      let updatedData: any = { ...formData }
      
      // Step 2: Upload new media files if selected
      if (posterFile) {
        const posterUrl = await uploadWithProgress(movie.id, "poster", posterFile)
        if (posterUrl) {
          updatedData.posterUrl = posterUrl
        }
      }
      
      if (backdropFile) {
        const backdropUrl = await uploadWithProgress(movie.id, "backdrop", backdropFile)
        if (backdropUrl) {
          updatedData.backdropUrl = backdropUrl
        }
      }
      
      if (trailerFile) {
        const trailerUrl = await uploadWithProgress(movie.id, "trailer", trailerFile)
        if (trailerUrl) {
          updatedData.trailerUrl = trailerUrl
        }
      }
      
      // Step 3: Update movie with new media URLs if any
      if (posterFile || backdropFile || trailerFile) {
        await movieApi.update(movie.id, {
          posterUrl: updatedData.posterUrl,
          backdropUrl: updatedData.backdropUrl,
          trailerUrl: updatedData.trailerUrl
        })
      }
      
      toast.success("Cập nhật phim thành công!")
      router.push(`/movies/${movie.id}`)
    } catch (error: any) {
      console.error("Error updating movie:", error)
      const errorMessage = error.response?.data?.message || error.message || "Không thể cập nhật phim"
      toast.error(`Lỗi: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  if (!movie) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Đang tải thông tin phim...</div>
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
          { label: "Chỉnh sửa", href: "#" }
        ]}
      />

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Chỉnh sửa phim</h1>
        <Button variant="outline" asChild>
          <Link href={`/movies/${movie.id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại
          </Link>
        </Button>
      </div>

      {/* Upload progress */}
      {uploadingFile && uploadProgress !== null && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Đang tải lên {uploadingFile}...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} />
            </div>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit} className={loading ? "opacity-50 pointer-events-none" : ""}>
        {/* Basic information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Thông tin cơ bản</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Tên phim *</Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Nhập tên phim"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="summary">Mô tả</Label>
              <Textarea
                id="summary"
                name="summary"
                value={formData.summary}
                onChange={handleChange}
                placeholder="Nhập mô tả phim"
                rows={4}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="releaseYear">Năm phát hành *</Label>
                <Input
                  id="releaseYear"
                  name="releaseYear"
                  type="number"
                  value={formData.releaseYear}
                  onChange={handleNumberChange}
                  min={1900}
                  max={new Date().getFullYear() + 5}
                  required
                />
              </div>
              <div>
                <Label htmlFor="duration">Thời lượng (phút) *</Label>
                <Input
                  id="duration"
                  name="duration"
                  type="number"
                  value={formData.duration}
                  onChange={handleNumberChange}
                  min={1}
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="rating">Đánh giá (0-10)</Label>
                <Input
                  id="rating"
                  name="rating"
                  type="number"
                  value={formData.rating}
                  onChange={handleNumberChange}
                  min={0}
                  max={10}
                  step={0.1}
                />
              </div>
              <div>
                <Label htmlFor="views">Lượt xem</Label>
                <Input
                  id="views"
                  name="views"
                  type="number"
                  value={formData.views}
                  onChange={handleNumberChange}
                  min={0}
                />
              </div>
            </div>
            
            {/* Genres */}
            <div>
              <Label>Thể loại *</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                {genres.map((genre) => (
                  <div key={genre.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`genre-${genre.id}`}
                      checked={formData.genreIds.includes(genre.id)}
                      onChange={() => handleGenreSelect(genre.id)}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor={`genre-${genre.id}`} className="text-sm">
                      {genre.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Media */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Media</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Poster */}
              <div>
                <Label htmlFor="poster">Poster</Label>
                {posterPreview ? (
                  <div className="relative aspect-[2/3] w-full max-w-[250px] overflow-hidden rounded-md mt-2 mb-4">
                    <Image
                      src={posterPreview}
                      alt="Poster preview"
                      fill
                      className="object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => clearFile('poster')}
                    >
                      <X size={16} />
                    </Button>
                  </div>
                ) : (
                  <div className="relative flex flex-col items-center justify-center w-full max-w-[250px] aspect-[2/3] border-2 border-dashed rounded-md mt-2 mb-4 p-4">
                    <ImageIcon className="h-8 w-8 text-gray-400 mb-2" />
                    <p className="text-sm text-center text-gray-500">
                      Kéo thả file vào đây hoặc click để chọn file
                    </p>
                    <p className="text-xs text-center text-gray-400 mt-1">
                      JPG, PNG (Tối đa: 10MB)
                    </p>
                    <input
                      id="poster"
                      type="file"
                      accept="image/jpeg,image/png,image/jpg"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      onChange={(e) => handleFileSelect(e, 'poster')}
                    />
                  </div>
                )}
              </div>
              
              {/* Backdrop */}
              <div>
                <Label htmlFor="backdrop">Backdrop</Label>
                {backdropPreview ? (
                  <div className="relative aspect-video w-full max-w-[300px] overflow-hidden rounded-md mt-2 mb-4">
                    <Image
                      src={backdropPreview}
                      alt="Backdrop preview"
                      fill
                      className="object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => clearFile('backdrop')}
                    >
                      <X size={16} />
                    </Button>
                  </div>
                ) : (
                  <div className="relative flex flex-col items-center justify-center w-full max-w-[300px] aspect-video border-2 border-dashed rounded-md mt-2 mb-4 p-4">
                    <ImageIcon className="h-8 w-8 text-gray-400 mb-2" />
                    <p className="text-sm text-center text-gray-500">
                      Kéo thả file vào đây hoặc click để chọn file
                    </p>
                    <p className="text-xs text-center text-gray-400 mt-1">
                      JPG, PNG (Tối đa: 10MB)
                    </p>
                    <input
                      id="backdrop"
                      type="file"
                      accept="image/jpeg,image/png,image/jpg"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      onChange={(e) => handleFileSelect(e, 'backdrop')}
                    />
                  </div>
                )}
              </div>
            </div>
            
            {/* Trailer */}
            <div className="mt-6">
              <Label htmlFor="trailer">Trailer (tùy chọn)</Label>
              {trailerPreview ? (
                <div className="relative w-full max-w-full rounded-md mt-2 mb-4">
                  <video
                    src={trailerPreview}
                    controls
                    className="w-full max-h-[300px] rounded-md"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => clearFile('trailer')}
                  >
                    <X size={16} />
                  </Button>
                </div>
              ) : (
                <div className="relative flex flex-col items-center justify-center w-full border-2 border-dashed rounded-md mt-2 mb-4 p-8">
                  <Film className="h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-sm text-center text-gray-500">
                    Kéo thả file video vào đây hoặc click để chọn file
                  </p>
                  <p className="text-xs text-center text-gray-400 mt-1">
                    MP4, WEBM (Tối đa: 100MB)
                  </p>
                  <input
                    id="trailer"
                    type="file"
                    accept="video/mp4,video/webm"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    onChange={(e) => handleFileSelect(e, 'trailer')}
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Form buttons */}
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/movies/${movie.id}`)}
            disabled={loading}
          >
            Hủy
          </Button>
          <Button
            type="submit"
            disabled={loading}
          >
            <Save className="mr-2 h-4 w-4" />
            {loading ? "Đang cập nhật..." : "Cập nhật phim"}
          </Button>
        </div>
      </form>
    </div>
  )
} 