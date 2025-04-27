"use client"

import type React from "react"
import { useCallback, useEffect, useState } from "react"
import axios from "axios"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { PlusCircle, Search, Upload } from "lucide-react"
import { Toaster, toast } from "react-hot-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Cập nhật phần lấy token từ cookie thay vì localStorage
import Cookies from "js-cookie"

//
// === Interfaces & Helper Functions ===
//

export interface Movie {
  id: number
  title: string
  genre: string
  year: number
  episodes: number
  views: number
  rating: number
  summary: string
  poster: string | File | null
  trailer: string | File | null
}

interface ApiMovie {
  id: number
  title: string
  genre: string
  releaseYear: number
  totalEpisodes: number
  views: number
  rating: string | number
  summary: string
  posterUrl: string | null
  trailerUrl: string | null
}

export interface Episode {
  id: number
  episodeNumber: number
  video: string | null
}

interface ApiEpisode {
  id: number
  episodeNumber: number
  videoUrl: string | null
}

export interface MovieFormProps {
  movie?: Movie
  onSubmit: (movie: Omit<Movie, "id">) => void
}

const transformApiMovieToFrontend = (movie: ApiMovie): Movie => ({
  id: movie.id,
  title: movie.title,
  genre: movie.genre,
  year: movie.releaseYear,
  episodes: movie.totalEpisodes,
  views: movie.views,
  rating: Number(movie.rating),
  summary: movie.summary,
  poster: movie.posterUrl,
  trailer: movie.trailerUrl,
})

const transformMovieToApi = (movie: Omit<Movie, "id">) => ({
  title: movie.title,
  rating: movie.rating,
  views: movie.views,
  genre: movie.genre,
  summary: movie.summary,
  duration: 120, // giá trị mặc định
  total_episodes: movie.episodes,
  releaseYear: movie.year,
  posterUrl: movie.poster,
  trailerUrl: movie.trailer,
})

//
// === Upload Functions with Progress Callback ===
//

async function uploadFile(
  title: string,
  file: File,
  fieldName: string,
  onProgress?: (progress: number) => void,
): Promise<string | null> {
  try {
    const contentType = fieldName === "poster" ? "image/jpeg" : "video/mp4"
    const fileName = `${fieldName}-${Date.now()}`
    const formData = new FormData()
    formData.append("file", file)
    formData.append("title", title)
    formData.append("fileName", fileName)
    formData.append("contentType", contentType)

    const response = await axios.post("https://alldramaz.com/api/aws/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          if (onProgress) {
            onProgress(progress)
          }
        }
      },
    })

    toast.success("Tải file thành công!")
    return response.data.finalUrl
  } catch (error) {
    console.error("Error uploading file:", error)
    toast.error("Tải file thất bại.")
    return null
  }
}

async function uploadEpisodeFile(
  movieTitle: string,
  episodeNumber: number,
  file: File,
  onProgress?: (progress: number) => void,
): Promise<string | null> {
  try {
    const contentType = "video/mp4"
    const fileName = `episode-${episodeNumber}`
    const formData = new FormData()
    formData.append("file", file)
    formData.append("title", movieTitle)
    formData.append("fileName", fileName)
    formData.append("contentType", contentType)

    const response = await axios.post("https://alldramaz.com/api/aws/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          if (onProgress) {
            onProgress(progress)
          }
        }
      },
    })

    return response.data.finalUrl
  } catch (error) {
    console.error("Error uploading episode file:", error)
    toast.error("Tải file tập phim thất bại.")
    return null
  }
}

//
// === Types for Upload Progress ===
//

type UploadProgress = {
  id: string // unique id for each movie upload
  title: string
  progress: number
}

// Thêm trường movieTitle để hiển thị tên phim cho từng episode
type EpisodeUploadProgress = {
  id: string // unique id for each episode upload
  movieTitle: string
  episodeNumber: number
  progress: number
}

//
// === Main Component: MoviesManagement ===
//

export function MoviesManagement() {
  const [movies, setMovies] = useState<Movie[]>([])
  const [uploadingMovies, setUploadingMovies] = useState<UploadProgress[]>([])
  const [uploadingEpisodes, setUploadingEpisodes] = useState<EpisodeUploadProgress[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  // Thay thế đoạn code lấy token từ localStorage
  const session = { data: { token: Cookies.get("token") } }

  // Fetch movies from API
  const fetchMovies = useCallback(async () => {
    try {
      const response = await axios.get("https://alldramaz.com/api/movies")
      const moviesData: Movie[] = response.data.map((movie: ApiMovie) => transformApiMovieToFrontend(movie))
      setMovies(moviesData)
    } catch (error) {
      console.error("Error fetching movies:", error)
      toast.error("Lấy danh sách phim thất bại.")
    }
  }, [])

  useEffect(() => {
    fetchMovies()
  }, [fetchMovies])

  // Update progress for movie upload
  const updateUploadProgress = (id: string, progress: number) => {
    setUploadingMovies((prevUploads: UploadProgress[]) =>
      prevUploads.map((upload: UploadProgress) => (upload.id === id ? { ...upload, progress } : upload)),
    )
  }

  // Update progress for episode upload
  const updateEpisodeUploadProgress = (id: string, progress: number) => {
    setUploadingEpisodes((prevUploads: EpisodeUploadProgress[]) =>
      prevUploads.map((upload: EpisodeUploadProgress) => (upload.id === id ? { ...upload, progress } : upload)),
    )
  }

  // Functions để thêm/xoá progress của episode
  const addUploadingEpisode = (upload: EpisodeUploadProgress) => {
    setUploadingEpisodes((prev: EpisodeUploadProgress[]) => [...prev, upload])
  }

  const removeUploadingEpisode = (id: string) => {
    setUploadingEpisodes((prev: EpisodeUploadProgress[]) => prev.filter((upload) => upload.id !== id))
  }

  // Handle add new movie
  const handleAddMovie = async (newMovie: Omit<Movie, "id">) => {
    const uploadId = `${newMovie.title}-${Date.now()}`
    setUploadingMovies((prev) => [...prev, { id: uploadId, title: newMovie.title, progress: 0 }])

    // Tính số bước: upload poster, upload trailer (nếu có) + gọi API thêm movie
    const totalSteps =
      (newMovie.poster && newMovie.poster instanceof File ? 1 : 0) +
      (newMovie.trailer && newMovie.trailer instanceof File ? 1 : 0) +
      1
    const progressStep = 100 / totalSteps
    let accumulatedProgress = 0

    try {
      let posterUrl = newMovie.poster
      if (newMovie.poster && newMovie.poster instanceof File) {
        posterUrl = await uploadFile(newMovie.title, newMovie.poster, "poster", (progress) => {
          const currentStepProgress = (progress * progressStep) / 100
          updateUploadProgress(uploadId, accumulatedProgress + currentStepProgress)
        })
        accumulatedProgress += progressStep
        updateUploadProgress(uploadId, accumulatedProgress)
      }

      let trailerUrl = newMovie.trailer
      if (newMovie.trailer && newMovie.trailer instanceof File) {
        trailerUrl = await uploadFile(newMovie.title, newMovie.trailer, "trailer", (progress) => {
          const currentStepProgress = (progress * progressStep) / 100
          updateUploadProgress(uploadId, accumulatedProgress + currentStepProgress)
        })
        accumulatedProgress += progressStep
        updateUploadProgress(uploadId, accumulatedProgress)
      }

      const movieData = transformMovieToApi({
        ...newMovie,
        poster: posterUrl,
        trailer: trailerUrl,
      })
      if (!session?.data?.token) return
      const response = await axios.post("https://alldramaz.com/api/movies", JSON.stringify(movieData), {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.data.token}`,
        },
        withCredentials: true,
      })

      accumulatedProgress += progressStep
      updateUploadProgress(uploadId, accumulatedProgress)
      updateUploadProgress(uploadId, 100)

      // Xoá progress sau khi hoàn tất upload
      setUploadingMovies((prev) => prev.filter((upload) => upload.id !== uploadId))

      const addedMovie = transformApiMovieToFrontend(response.data)
      setMovies((prevMovies) => [...prevMovies, addedMovie])
      toast.success("Thêm phim thành công!")
    } catch (error) {
      console.error("Error adding movie:", error)
      toast.error("Thêm phim thất bại.")
      setUploadingMovies((prev) => prev.filter((upload) => upload.id !== uploadId))
    }
  }

  const handleEditMovie = async (editedMovie: Omit<Movie, "id">) => {
    // Tương tự như handleAddMovie nhưng dành cho chỉnh sửa phim
  }

  const handleDeleteMovie = async (id: number) => {
    if (!session?.data?.token) return
    try {
      await axios.delete(`https://alldramaz.com/api/movies/${id}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.data.token}`,
        },
        withCredentials: true,
      })

      const movieToDelete = movies.find((movie) => movie.id === id)
      if (movieToDelete) {
        if (typeof movieToDelete.poster === "string") {
          const posterFileKey = `${movieToDelete.title}/${movieToDelete.poster.split("/").pop()}`
          await axios.delete("https://alldramaz.com/api/aws/file", {
            data: { fileKey: posterFileKey },
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.data.token}`,
            },
          })
        }
        if (typeof movieToDelete.trailer === "string") {
          const trailerFileKey = `${movieToDelete.title}/${movieToDelete.trailer.split("/").pop()}`
          await axios.delete("https://alldramaz.com/api/aws/file", {
            data: { fileKey: trailerFileKey },
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.data.token}`,
            },
          })
        }
      }

      setMovies((prevMovies) => prevMovies.filter((movie) => movie.id !== id))
      toast.success("Xóa phim thành công!")
    } catch (error) {
      console.error("Error deleting movie:", error)
      toast.error("Xóa phim thất bại.")
    }
  }

  const filteredMovies = movies.filter((movie) => movie.title.toLowerCase().includes(searchTerm.toLowerCase()))

  return (
    <div className="container mx-auto p-6 space-y-8">
      <Toaster />

      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Quản lý Phim</h1>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Thêm Phim Mới
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Thêm Phim Mới</DialogTitle>
            </DialogHeader>
            <MovieForm onSubmit={handleAddMovie} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-8">
        <Card className="flex-grow">
          <CardHeader>
            <CardTitle>Danh sách Phim</CardTitle>
            <div className="flex items-center space-x-2">
              <Search className="text-muted-foreground" />
              <Input
                type="text"
                placeholder="Tìm kiếm phim..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tiêu đề</TableHead>
                  <TableHead>Thể loại</TableHead>
                  <TableHead>Năm</TableHead>
                  <TableHead>Tập</TableHead>
                  <TableHead>Lượt xem</TableHead>
                  <TableHead>Đánh giá</TableHead>
                  <TableHead>Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMovies.map((movie) => (
                  <TableRow key={movie.id}>
                    <TableCell className="font-medium">{movie.title}</TableCell>
                    <TableCell>{movie.genre}</TableCell>
                    <TableCell>{movie.year}</TableCell>
                    <TableCell>{movie.episodes}</TableCell>
                    <TableCell>{movie.views.toLocaleString()}</TableCell>
                    <TableCell>{movie.rating}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              Chỉnh sửa
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-3xl">
                            <DialogHeader>
                              <DialogTitle>Chỉnh sửa Phim</DialogTitle>
                            </DialogHeader>
                            <MovieForm movie={movie} onSubmit={handleEditMovie} />
                          </DialogContent>
                        </Dialog>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              Tập phim
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-3xl">
                            <DialogHeader>
                              <DialogTitle>Quản lý Tập phim</DialogTitle>
                            </DialogHeader>
                            <EpisodeManager
                              movieId={movie.id}
                              movieTitle={movie.title}
                              onEpisodeAdded={fetchMovies}
                              uploadingEpisodes={uploadingEpisodes}
                              updateEpisodeUploadProgress={updateEpisodeUploadProgress}
                              addUploadingEpisode={addUploadingEpisode}
                              removeUploadingEpisode={removeUploadingEpisode}
                            />
                          </DialogContent>
                        </Dialog>
                        <Button variant="destructive" size="sm" onClick={() => handleDeleteMovie(movie.id)}>
                          Xóa
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="w-1/3">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Upload className="mr-2 h-5 w-5" />
              Tiến độ Tải lên
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <section>
                <h3 className="font-semibold mb-2">Phim</h3>
                <ScrollArea className="h-[200px]">
                  {uploadingMovies.length === 0 ? (
                    <p className="text-muted-foreground">Không có phim nào đang được tải lên.</p>
                  ) : (
                    uploadingMovies.map((upload) => (
                      <div key={upload.id} className="mb-4">
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">{upload.title}</span>
                          <span className="text-sm font-medium">{Math.round(upload.progress)}%</span>
                        </div>
                        <Progress value={upload.progress} className="w-full" />
                      </div>
                    ))
                  )}
                </ScrollArea>
              </section>
              <section>
                <h3 className="font-semibold mb-2">Tập phim</h3>
                <ScrollArea className="h-[200px]">
                  {uploadingEpisodes.length === 0 ? (
                    <p className="text-muted-foreground">Không có tập phim nào đang được tải lên.</p>
                  ) : (
                    uploadingEpisodes.map((upload) => (
                      <div key={upload.id} className="mb-4">
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">
                            {upload.movieTitle} - Tập {upload.episodeNumber}
                          </span>
                          <span className="text-sm font-medium">{Math.round(upload.progress)}%</span>
                        </div>
                        <Progress value={upload.progress} className="w-full" />
                      </div>
                    ))
                  )}
                </ScrollArea>
              </section>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

//
// === MovieForm Component ===
//

function MovieForm({ movie, onSubmit }: MovieFormProps) {
  const [formData, setFormData] = useState<Omit<Movie, "id">>(
    movie || {
      title: "",
      genre: "",
      year: new Date().getFullYear(),
      episodes: 1,
      views: 0,
      rating: 0,
      summary: "",
      poster: null,
      trailer: null,
    },
  )

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === "year" || name === "episodes" || name === "views" || name === "rating" ? Number(value) : value,
    }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target
    if (files && files[0]) {
      setFormData((prev) => ({ ...prev, [name]: files[0] }))
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="title">Tiêu đề</Label>
          <Input id="title" name="title" value={formData.title} onChange={handleChange} required />
        </div>
        <div>
          <Label htmlFor="genre">Thể loại</Label>
          <Select value={formData.genre} onValueChange={(value) => setFormData((prev) => ({ ...prev, genre: value }))}>
            <SelectTrigger id="genre">
              <SelectValue placeholder="Chọn thể loại" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Presidente ejecutivo">Tổng tài</SelectItem>
              <SelectItem value="Renacimiento">Chuyển sinh</SelectItem>
              <SelectItem value="Histórico">Cổ đại</SelectItem>
              <SelectItem value="Viaje en el tiempo">Xuyên không</SelectItem>
              <SelectItem value="Comedia">Hài hước</SelectItem>
              <SelectItem value="Juventud">Học đường</SelectItem>
              <SelectItem value="Drama">Drama</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="year">Năm</Label>
          <Input id="year" name="year" type="number" value={formData.year} onChange={handleChange} required />
        </div>
        <div>
          <Label htmlFor="episodes">Tập</Label>
          <Input
            id="episodes"
            name="episodes"
            type="number"
            value={formData.episodes}
            onChange={handleChange}
            required
          />
        </div>
      </div>
      <div>
        <Label htmlFor="summary">Tóm tắt</Label>
        <Textarea id="summary" name="summary" value={formData.summary} onChange={handleChange} required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="poster">Ảnh bìa</Label>
          <Input id="poster" name="poster" type="file" accept="image/*" onChange={handleFileChange} />
          {formData.poster && typeof formData.poster !== "string" && (
            <div className="relative mt-2 h-40 w-full">
              <Image
                src={URL.createObjectURL(formData.poster as File) || "/placeholder.svg"}
                alt="Ảnh bìa Phim"
                fill
                className="object-contain"
              />
            </div>
          )}
        </div>
        <div>
          <Label htmlFor="trailer">Video giới thiệu</Label>
          <Input id="trailer" name="trailer" type="file" accept="video/*" onChange={handleFileChange} />
          {formData.trailer && typeof formData.trailer !== "string" && (
            <video controls className="mt-2 h-40 w-full">
              <source src={URL.createObjectURL(formData.trailer as File)} type="video/mp4" />
              Trình duyệt của bạn không hỗ trợ thẻ video.
            </video>
          )}
        </div>
      </div>
      <DialogClose asChild>
        <Button type="submit">{movie ? "Cập nhật Phim" : "Thêm Phim"}</Button>
      </DialogClose>
    </form>
  )
}

//
// === EpisodeManager Component ===
//

export interface EpisodeManagerProps {
  movieId: number
  movieTitle: string
  onEpisodeAdded: () => void
  uploadingEpisodes: EpisodeUploadProgress[]
  updateEpisodeUploadProgress: (id: string, progress: number) => void
  addUploadingEpisode: (upload: EpisodeUploadProgress) => void
  removeUploadingEpisode: (id: string) => void
}

export function EpisodeManager({
  movieId,
  movieTitle,
  onEpisodeAdded,
  uploadingEpisodes,
  updateEpisodeUploadProgress,
  addUploadingEpisode,
  removeUploadingEpisode,
}: EpisodeManagerProps) {
  // Temporary mock for useSession
  const session = { data: { token: Cookies.get("token") } }
  const [episodes, setEpisodes] = useState<ApiEpisode[]>([])
  const [episodeNumber, setEpisodeNumber] = useState<number>(1)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false)
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null)
  const [editingEpisode, setEditingEpisode] = useState<ApiEpisode | null>(null)

  const fetchEpisodes = useCallback(async () => {
    try {
      if (!session?.data?.token) return
      const response = await axios.get(`https://alldramaz.com/api/episodes/movie/${movieId}`, {
        headers: {
          Authorization: `Bearer ${session.data.token}`,
        },
      })
      setEpisodes(response.data)
    } catch (error) {
      console.error("Error fetching episodes:", error)
      toast.error("Lấy danh sách tập phim thất bại.")
    }
  }, [movieId, session?.data?.token])

  useEffect(() => {
    fetchEpisodes()
  }, [fetchEpisodes])

  const handleAddEpisode = async (e: React.FormEvent) => {
    e.preventDefault()
    const fileInput = document.getElementById("episodeVideo") as HTMLInputElement
    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
      toast.error("Vui lòng chọn file cho tập phim.")
      return
    }

    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
      toast.error("Vui lòng chọn file cho tập phim.")
      return
    }

    const uploadId = `episode-${episodeNumber}-${Date.now()}`
    // Thêm progress với movieTitle được truyền vào
    setIsAddDialogOpen(false)
    addUploadingEpisode({ id: uploadId, movieTitle, episodeNumber, progress: 0 })

    const totalSteps = 2 // 1 bước upload file + 1 bước gọi API
    const progressStep = 100 / totalSteps
    let accumulatedProgress = 0

    try {
      const file = fileInput.files[0]
      const finalUrl = await uploadEpisodeFile(movieTitle, episodeNumber, file, (progress) => {
        const currentStepProgress = (progress * progressStep) / 100
        updateEpisodeUploadProgress(uploadId, accumulatedProgress + currentStepProgress)
      })

      accumulatedProgress += progressStep
      updateEpisodeUploadProgress(uploadId, accumulatedProgress)

      if (!session?.data?.token) return
      const response = await axios.post(
        "https://alldramaz.com/api/episodes",
        {
          movieId,
          videoUrl: finalUrl,
          episodeNumber: episodeNumber,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.data.token}`,
          },
        },
      )

      accumulatedProgress += progressStep
      updateEpisodeUploadProgress(uploadId, accumulatedProgress)
      updateEpisodeUploadProgress(uploadId, 100)

      removeUploadingEpisode(uploadId)

      toast.success("Thêm tập phim thành công!")
      fetchEpisodes()
      setEpisodeNumber((prev) => prev + 1)
      setIsAddDialogOpen(false)
    } catch (error) {
      console.error("Error adding episode:", error)
      toast.error("Thêm tập phim thất bại.")
      removeUploadingEpisode(uploadId)
    }
  }

  const handlePreviewEpisode = (videoUrl: string | null) => {
    if (videoUrl) {
      setPreviewVideoUrl(videoUrl)
      setIsPreviewDialogOpen(true)
    } else {
      toast.error("URL video không tồn tại.")
    }
  }

  const handleClosePreviewDialog = () => {
    setIsPreviewDialogOpen(false)
    setPreviewVideoUrl(null)
  }

  const handleDeleteEpisode = async (episodeId: number) => {
    try {
      if (!session?.data?.token) return
      await axios.delete(`https://alldramaz.com/api/episodes/${episodeId}`, {
        headers: {
          Authorization: `Bearer ${session.data.token}`,
        },
      })

      const episodeToDelete = episodes.find((episode) => episode.id === episodeId)
      if (episodeToDelete && episodeToDelete.videoUrl) {
        const episodeFileKey = `${movieTitle}/${episodeToDelete.videoUrl.split("/").pop()}`
        await axios.delete("https://alldramaz.com/api/aws/file", {
          data: { fileKey: episodeFileKey },
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.data.token}`,
          },
        })
      }
      setEpisodes((prevEpisodes) => prevEpisodes.filter((episode) => episode.id !== episodeId))
      toast.success("Xóa tập phim thành công!")
    } catch (error) {
      console.error("Error deleting episode:", error)
      toast.error("Xóa tập phim thất bại.")
    }
  }

  return (
    <div className="space-y-4">
      {/* Dialog Thêm tập phim */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogTrigger asChild>
          <Button>Thêm Tập Mới</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thêm Tập Mới</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddEpisode} className="space-y-4">
            <div>
              <Label htmlFor="episodeNumber">Số Tập</Label>
              <Input
                id="episodeNumber"
                name="episodeNumber"
                type="number"
                value={episodeNumber}
                onChange={(e) => setEpisodeNumber(Number(e.target.value))}
                required
              />
            </div>
            <div>
              <Label htmlFor="episodeVideo">Video Tập</Label>
              <Input id="episodeVideo" name="episodeVideo" type="file" accept="video/*" required />
            </div>
            <Button type="submit">Thêm Tập</Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Xem trước Video */}
      <Dialog open={isPreviewDialogOpen} onOpenChange={handleClosePreviewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xem trước Tập</DialogTitle>
          </DialogHeader>
          {previewVideoUrl && (
            <div className="space-y-4">
              <video controls className="max-h-64 w-full">
                <source src={previewVideoUrl} type="video/mp4" />
                Trình duyệt của bạn không hỗ trợ thẻ video.
              </video>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Danh sách tập phim */}
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="episodes">
          <AccordionTrigger>Danh sách Tập phim</AccordionTrigger>
          <AccordionContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tập</TableHead>
                  <TableHead>Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {episodes.map((episode) => (
                  <TableRow key={episode.id}>
                    <TableCell>{episode.episodeNumber}</TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" onClick={() => handlePreviewEpisode(episode.videoUrl)}>
                        Xem trước
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingEpisode(episode)
                          setIsEditDialogOpen(true)
                        }}
                        className="mr-2"
                      >
                        Chỉnh sửa
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDeleteEpisode(episode.id)}>
                        Xóa
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}

