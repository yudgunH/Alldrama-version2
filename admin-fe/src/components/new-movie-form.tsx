"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "react-hot-toast"
import { api, mediaApi, genreApi, movieApi } from "@/services/api"
import { Movie, Genre, UploadProgress } from "@/models"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Upload, Image as ImageIcon, Film, X } from "lucide-react"

export function NewMovieForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [genres, setGenres] = useState<Genre[]>([])
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null)
  const [createdMovieId, setCreatedMovieId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  
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

  // Fetch genres
  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const response = await genreApi.getAll()
        setGenres(response.data)
      } catch (error) {
        console.error("Error fetching genres:", error)
        toast.error("Không thể tải danh sách thể loại")
      }
    }
    
    fetchGenres()
  }, [])

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
      setPosterPreview(null)
    } else if (type === 'backdrop') {
      setBackdropFile(null)
      setBackdropPreview(null)
    } else if (type === 'trailer') {
      setTrailerFile(null)
      setTrailerPreview(null)
    }
  }

  // Upload media with presigned URL
  const uploadWithPresignedUrl = async (
    movieId: number,
    fileType: "poster" | "backdrop" | "trailer",
    file: File,
  ): Promise<string | null> => {
    try {
      // Sử dụng phương thức upload trực tiếp thay vì presigned URL để tránh vấn đề CORS
      let result;
      
      const updateProgress = (progress: number) => {
        if (uploadProgress) {
          setUploadProgress(prev => prev ? { ...prev, progress } : null);
        }
      };
      
      if (fileType === "poster") {
        result = await mediaApi.uploadMoviePoster(movieId, file, updateProgress);
      } else if (fileType === "backdrop") {
        result = await mediaApi.uploadMovieBackdrop(movieId, file, updateProgress);
      } else if (fileType === "trailer") {
        result = await mediaApi.uploadMovieTrailer(movieId, file, updateProgress);
      } else {
        throw new Error(`Loại file không hỗ trợ: ${fileType}`);
      }
      
      // Trả về URL từ response
      if (fileType === "poster") {
        return result.data.url || `https://cdn.alldramaz.com/movies/${movieId}/poster.jpg`;
      } else if (fileType === "backdrop") {
        return result.data.url || `https://cdn.alldramaz.com/movies/${movieId}/backdrop.jpg`;
      } else if (fileType === "trailer") {
        return result.data.trailerUrl || `https://cdn.alldramaz.com/movies/${movieId}/trailer.mp4`;
      }
      
      return null;
    } catch (error) {
      console.error(`Error uploading ${fileType}:`, error)
      toast.error(`Không thể tải lên ${fileType}`)
      return null
    }
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Reset error and created movie states
    setUploadProgress(null)
    setError(null)
    setCreatedMovieId(null)
    
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
    
    let movieId: number | null = null;
    
    try {
      console.log("Đang tạo phim mới...");
      
      // Step 1: Create new movie (without media URLs)
      const movieResponse = await movieApi.create(formData)
      movieId = movieResponse.data.id
      
      if (!movieId) {
        throw new Error("Không thể lấy ID phim sau khi tạo")
      }
      
      console.log("Đã tạo phim với ID:", movieId);
      // Lưu ID phim đã tạo
      setCreatedMovieId(movieId)
      
      // Set upload progress
      setUploadProgress({
        id: `new-movie-${Date.now()}`,
        title: formData.title,
        progress: 10
      })
      
      // Step 2: Upload poster (nếu có)
      if (posterFile) {
        console.log("Đang tải lên poster...");
        try {
          const posterUrl = await uploadWithPresignedUrl(
            movieId,
            "poster",
            posterFile
          )
          
          setUploadProgress(prev => prev ? { ...prev, progress: 40 } : null)
          
          if (posterUrl) {
            await movieApi.update(movieId, { posterUrl })
            console.log("Đã cập nhật posterUrl:", posterUrl);
          }
        } catch (posterError) {
          console.error("Lỗi khi tải poster:", posterError);
          toast.error("Lỗi khi tải poster, nhưng phim vẫn được tạo");
        }
      } else {
        setUploadProgress(prev => prev ? { ...prev, progress: 40 } : null)
      }
      
      // Step 3: Upload backdrop (nếu có)
      if (backdropFile) {
        console.log("Đang tải lên backdrop...");
        try {
          const backdropUrl = await uploadWithPresignedUrl(
            movieId,
            "backdrop",
            backdropFile
          )
          
          setUploadProgress(prev => prev ? { ...prev, progress: 70 } : null)
          
          if (backdropUrl) {
            await movieApi.update(movieId, { backdropUrl })
            console.log("Đã cập nhật backdropUrl:", backdropUrl);
          }
        } catch (backdropError) {
          console.error("Lỗi khi tải backdrop:", backdropError);
          toast.error("Lỗi khi tải backdrop, nhưng phim vẫn được tạo");
        }
      } else {
        setUploadProgress(prev => prev ? { ...prev, progress: 70 } : null)
      }
      
      // Step 4: Upload trailer (nếu có)
      if (trailerFile) {
        console.log("Đang tải lên trailer...");
        try {
          const trailerUrl = await uploadWithPresignedUrl(
            movieId,
            "trailer",
            trailerFile
          )
          
          if (trailerUrl) {
            await movieApi.update(movieId, { trailerUrl })
            console.log("Đã cập nhật trailerUrl:", trailerUrl);
          }
        } catch (trailerError) {
          console.error("Lỗi khi tải trailer:", trailerError);
          toast.error("Lỗi khi tải trailer, nhưng phim vẫn được tạo");
        }
      }
      
      setUploadProgress(prev => prev ? { ...prev, progress: 100 } : null)
      
      toast.success("Đã thêm phim thành công!")
      console.log("Quá trình tạo phim hoàn tất. ID phim:", movieId);
      
    } catch (error: any) {
      console.error("Lỗi khi tạo phim:", error);
      
      // Hiển thị thông báo lỗi chi tiết
      const errorMessage = error.response?.data?.message || error.message || "Không thể tạo phim mới";
      setError(errorMessage);
      toast.error(`Lỗi: ${errorMessage}`);
      
      // Nếu phim đã được tạo nhưng có lỗi tiếp theo
      if (movieId) {
        toast(`Phim đã được tạo với ID: ${movieId}, nhưng có lỗi khi xử lý media`);
        setCreatedMovieId(movieId);
      }
      
    } finally {
      setLoading(false);
    }
  }

  // Hàm chuyển trang đến chi tiết phim
  const goToMovieDetail = () => {
    if (createdMovieId) {
      router.push(`/movies/${createdMovieId}`);
    }
  }

  return (
    <div className="space-y-6">
      {/* Success message with link */}
      {createdMovieId && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 text-green-700">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                <span className="font-semibold">Phim đã được tạo thành công!</span>
              </div>
              <p>Bạn có thể xem chi tiết phim bằng cách nhấn nút bên dưới.</p>
              <Button onClick={goToMovieDetail} className="w-full md:w-auto">
                Xem chi tiết phim
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error message */}
      {error && (
        <Card className="bg-red-50 border-red-200">
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 text-red-700">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span className="font-semibold">Đã xảy ra lỗi!</span>
              </div>
              <p>{error}</p>
              {createdMovieId && (
                <Button onClick={goToMovieDetail} className="w-full md:w-auto">
                  Vẫn xem chi tiết phim
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progress indicator */}
      {uploadProgress && (
        <Card>
          <CardHeader>
            <CardTitle>Đang tạo phim...</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span>{uploadProgress.title}</span>
              <span>{uploadProgress.progress}%</span>
            </div>
            <Progress value={uploadProgress.progress} />
            <p className="text-sm text-muted-foreground">
              {uploadProgress.progress < 100
                ? "Đang tải lên và xử lý media..."
                : "Hoàn thành!"}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Movie form */}
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
            
            <div>
              <Label>Thể loại *</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {genres.map((genre) => (
                  <Button
                    key={genre.id}
                    type="button"
                    variant={formData.genreIds.includes(genre.id) ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleGenreSelect(genre.id)}
                  >
                    {genre.name}
                  </Button>
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
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Poster */}
              <div>
                <Label htmlFor="poster">Poster</Label>
                {posterPreview ? (
                  <div className="relative aspect-[2/3] w-full max-w-[250px] overflow-hidden rounded-md mt-2 mb-4">
                    <img
                      src={posterPreview}
                      alt="Poster preview"
                      className="object-cover w-full h-full"
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
                  <div className="relative aspect-video w-full max-w-full overflow-hidden rounded-md mt-2 mb-4">
                    <img
                      src={backdropPreview}
                      alt="Backdrop preview"
                      className="object-cover w-full h-full"
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
                  <div className="relative flex flex-col items-center justify-center w-full aspect-video border-2 border-dashed rounded-md mt-2 mb-4 p-4">
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
            onClick={() => router.push("/movies")}
            disabled={loading}
          >
            Hủy
          </Button>
          <Button
            type="submit"
            disabled={loading}
          >
            {loading ? "Đang xử lý..." : "Tạo phim"}
          </Button>
        </div>
      </form>
    </div>
  )
} 