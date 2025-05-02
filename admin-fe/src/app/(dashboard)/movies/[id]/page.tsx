"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Breadcrumb } from "@/components/ui/breadcrumb"
import { Toaster, toast } from "react-hot-toast"
import { api, movieApi } from "@/services/api"
import { Movie } from "@/models"
import { Edit, Play, Calendar, Clock, Eye, Star } from "lucide-react"
import { formatDate } from "@/lib/utils"
import { MovieInfo } from "@/components/movie-info"
import { EpisodeManager } from "@/components/episode-manager"
import { MovieStatistics } from "@/components/movie-statistics"

export default function MovieDetailPage() {
  const { id } = useParams()
  const [movie, setMovie] = useState<Movie | null>(null)
  const [loading, setLoading] = useState(true)
  const [showTrailer, setShowTrailer] = useState(false)

  useEffect(() => {
    const fetchMovie = async () => {
      try {
        const response = await movieApi.getById(Number(id))
        setMovie(response.data)
        setLoading(false)
      } catch (error) {
        console.error("Error fetching movie:", error)
        toast.error("Không thể tải thông tin phim")
        setLoading(false)
      }
    }

    fetchMovie()
  }, [id])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-center h-96">
          <p>Đang tải thông tin phim...</p>
        </div>
      </div>
    )
  }

  if (!movie) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col items-center justify-center h-96">
          <p className="text-xl mb-4">Không tìm thấy phim</p>
          <Button asChild>
            <Link href="/movies">Quay lại danh sách phim</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <Toaster />
      
      <Breadcrumb
        items={[
          { label: "Trang chủ", href: "/" },
          { label: "Quản lý phim", href: "/movies" },
          { label: movie.title, href: `/movies/${movie.id}` },
        ]}
      />
      
      {/* Backdrop image */}
      {movie.backdropUrl && (
        <div className="relative w-full h-[300px] rounded-xl overflow-hidden mb-6">
          <Image
            src={movie.backdropUrl}
            alt={movie.title}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
        </div>
      )}
      
      {/* Movie header */}
      <div className="flex flex-col md:flex-row gap-6 mb-8">
        <div className="flex-shrink-0">
          {movie.posterUrl ? (
            <div className="relative w-[200px] h-[300px] rounded-xl overflow-hidden">
              <Image
                src={movie.posterUrl}
                alt={movie.title}
                fill
                className="object-cover"
                priority
              />
            </div>
          ) : (
            <div className="w-[200px] h-[300px] bg-gray-200 dark:bg-gray-800 rounded-xl flex items-center justify-center">
              <p className="text-gray-500">Không có poster</p>
            </div>
          )}
        </div>
        
        <div className="flex flex-col flex-grow">
          <h1 className="text-3xl font-bold mb-2">
            {movie.title} ({movie.releaseYear})
          </h1>
          
          <div className="flex flex-wrap gap-2 mb-4">
            {movie.genres?.map((genre) => (
              <Badge key={genre.id} variant="secondary">
                {genre.name}
              </Badge>
            ))}
          </div>
          
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
            <div className="flex items-center">
              <Clock className="mr-1 h-4 w-4" />
              <span>{movie.duration} phút</span>
            </div>
            <div className="flex items-center">
              <Calendar className="mr-1 h-4 w-4" />
              <span>{movie.releaseYear}</span>
            </div>
            <div className="flex items-center">
              <Eye className="mr-1 h-4 w-4" />
              <span>{movie.views.toLocaleString()} lượt xem</span>
            </div>
            <div className="flex items-center">
              <Star className="mr-1 h-4 w-4" />
              <span>{movie.rating} ★</span>
            </div>
          </div>
          
          <p className="text-muted-foreground mb-6 line-clamp-3">
            {movie.summary}
          </p>
          
          <div className="flex gap-2 mt-auto">
            <Button asChild variant="outline">
              <Link href={`/movies/${movie.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Chỉnh sửa
              </Link>
            </Button>
            
            {movie.trailerUrl && (
              <Button onClick={() => setShowTrailer(true)}>
                <Play className="mr-2 h-4 w-4" />
                Xem trailer
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {/* Trailer modal */}
      {showTrailer && movie.trailerUrl && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="relative w-full max-w-4xl">
            <Button
              variant="destructive"
              size="sm"
              className="absolute -top-10 right-0"
              onClick={() => setShowTrailer(false)}
            >
              Đóng
            </Button>
            <div className="aspect-video w-full">
              <video
                src={movie.trailerUrl}
                controls
                autoPlay
                className="w-full h-full"
              />
            </div>
          </div>
        </div>
      )}
      
      {/* Tabs */}
      <Tabs defaultValue="info" className="mt-8">
        <TabsList className="mb-6">
          <TabsTrigger value="info">Thông tin</TabsTrigger>
          <TabsTrigger value="episodes">Tập phim</TabsTrigger>
          <TabsTrigger value="stats">Thống kê</TabsTrigger>
        </TabsList>
        
        <TabsContent value="info">
          <MovieInfo movie={movie} />
        </TabsContent>
        
        <TabsContent value="episodes">
          <EpisodeManager movieId={Number(id)} movieTitle={movie.title} />
        </TabsContent>
        
        <TabsContent value="stats">
          <MovieStatistics movieId={Number(id)} />
        </TabsContent>
      </Tabs>
    </div>
  )
} 