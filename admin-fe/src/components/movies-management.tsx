"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { toast } from "react-hot-toast"
import {
  PlusCircle,
  Search,
  Edit,
  Trash2,
  Eye,
  Video,
  CheckCircle,
  Clock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Pagination } from "@/components/ui/pagination"

import { api, movieApi, mediaApi } from "@/services/api"
import { Movie, UploadProgress } from "@/models"

export function MoviesManagement() {
  const router = useRouter()
  const [movies, setMovies] = useState<Movie[]>([])
  const [filteredMovies, setFilteredMovies] = useState<Movie[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [genreFilter, setGenreFilter] = useState<string>("all")
  const [yearFilter, setYearFilter] = useState<string>("all")
  const [uploadingMovies, setUploadingMovies] = useState<UploadProgress[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const itemsPerPage = 10

  // Error boundary
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error("Unhandled Promise Rejection:", event.reason)
      event.preventDefault() // Prevent page refresh
    }
    
    const handleError = (event: ErrorEvent) => {
      console.error("Unhandled Error:", event.error)
      event.preventDefault() // Prevent page refresh
    }
    
    window.addEventListener('unhandledrejection', handleUnhandledRejection)
    window.addEventListener('error', handleError)
    
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
      window.removeEventListener('error', handleError)
    }
  }, [])

  // Fetch movies
  const fetchMovies = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await movieApi.getAll(currentPage, itemsPerPage)
      
      // API mới trả về cấu trúc { movies: [...], pagination: {...} }
      if (response.data.movies) {
        setMovies(response.data.movies || [])
        if (response.data.pagination) {
          setTotalPages(response.data.pagination.totalPages || 1)
        }
      } else {
        // Fallback cho trường hợp API trả về dữ liệu khác cấu trúc
        setMovies(response.data.items || response.data || [])
        if (response.data.total) {
          setTotalPages(Math.ceil(response.data.total / itemsPerPage))
        } else {
          setTotalPages(1)
        }
      }
      
      setIsLoading(false)
    } catch (error) {
      console.error("Error fetching movies:", error)
      toast.error("Không thể tải danh sách phim")
      setIsLoading(false)
      setMovies([]) // Đặt mảng rỗng khi lỗi
      setTotalPages(1)
    }
  }, [currentPage, itemsPerPage])

  useEffect(() => {
    fetchMovies()
  }, [fetchMovies, currentPage])

  // Apply filters
  useEffect(() => {
    let result = [...movies]
    
    if (searchTerm) {
      result = result.filter(movie => 
        movie.title.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    if (genreFilter && genreFilter !== "all") {
      result = result.filter(movie => 
        movie.genres.some(g => g.id.toString() === genreFilter)
      )
    }
    
    if (yearFilter && yearFilter !== "all") {
      const yearValue = typeof yearFilter === 'string' ? parseInt(yearFilter) : yearFilter;
      result = result.filter(movie => 
        movie.releaseYear === yearValue
      )
    }
    
    setFilteredMovies(result)
  }, [movies, searchTerm, genreFilter, yearFilter])

  // Handle delete movie
  const handleDeleteMovie = async (id: number, event?: React.MouseEvent) => {
    // Prevent any default behavior
    if (event) {
      event.preventDefault()
      event.stopPropagation()
    }
    
    if (!confirm("Bạn có chắc chắn muốn xóa phim này?\n\nViệc này sẽ xóa:\n• Thông tin phim trong database\n• Tất cả media của phim (poster, backdrop, trailer)\n• TẤT CẢ TẬP PHIM và video của phim này\n\nThao tác này KHÔNG THỂ HOÀN TÁC!")) {
      return
    }
    
    console.log(`🗑️ Bắt đầu xóa movie ${id}...`)
    
    try {
      // Debug: Kiểm tra tình trạng storage trước khi xóa
      console.log(`🔍 Kiểm tra storage trước khi xóa movie ${id}...`)
      try {
        const beforeStatus = await mediaApi.checkMovieStorageStatus(id)
        console.log(`📂 Storage trước khi xóa:`, beforeStatus)
      } catch (debugError) {
        console.warn(`Không thể kiểm tra storage trước khi xóa:`, debugError)
      }
      
      // Bước 1: Xóa database trước (để tránh trạng thái inconsistent)
      console.log(`🗄️ Xóa movie ${id} từ database...`)
      await movieApi.delete(id)
      console.log(`✅ Đã xóa movie ${id} từ database`)
      
      // Bước 2: Xóa toàn bộ folder của movie trên R2 (movies + episodes)
      console.log(`📁 Bắt đầu xóa R2 storage cho movie ${id}...`)
      try {
        // Sử dụng helper function để xóa complete movie
        const results = await Promise.allSettled([
          mediaApi.handleR2ApiCall(
            () => mediaApi.deleteMovieR2Folder(id),
            `xóa movies folder ${id}`
          ),
          // Sử dụng retry method cho episodes vì API chỉ xóa 1 episode mỗi lần
          mediaApi.deleteMovieEpisodesFolderWithRetry(id, 20)
        ])
        
        const moviesResult = results[0]
        const episodesResult = results[1]
        
        console.log(`Movies folder: ${moviesResult.status}`)
        console.log(`Episodes folder: ${episodesResult.status === 'fulfilled' ? 
          `${episodesResult.value.deletedCount} episodes deleted` : 'failed'}`)
        
        const moviesSuccess = moviesResult.status === 'fulfilled'
        const episodesSuccess = episodesResult.status === 'fulfilled' && episodesResult.value.success
        
        if (!episodesSuccess) {
          console.warn(`Episodes retry method không thành công, thử individual deletion...`)
          
          try {
            const individualResult = await mediaApi.deleteAllMovieEpisodesIndividually(id)
            console.log(`Individual episodes: ${individualResult.deletedCount}/${individualResult.totalCount}`)
          } catch (individualError) {
            console.warn(`Không thể xóa individual episodes:`, individualError)
            
            // Fallback cuối cùng: Xóa theo pattern
            try {
              console.log(`🚨 Fallback: Thử xóa episodes theo pattern...`)
              const patternResult = await mediaApi.deleteMovieEpisodesByPattern(id, 50)
              console.log(`Pattern deletion: ${patternResult.deletedCount}/${patternResult.totalCount}`)
            } catch (patternError) {
              console.warn(`Pattern deletion cũng thất bại:`, patternError)
            }
          }
        }
        
        if (!moviesSuccess && !episodesSuccess) {
          console.warn("Không thể xóa R2 storage, nhưng database đã xóa thành công")
        }
      } catch (completeError) {
        console.warn(`Complete cleanup thất bại cho movie ${id}:`, completeError)
        
        // Fallback: Xóa từng item riêng lẻ
        try {
          console.log(`🔄 Fallback: Xóa từng file riêng lẻ...`)
          const cleanupResults = await Promise.allSettled([
            // Movie media files
            mediaApi.handleR2ApiCall(
              () => mediaApi.deleteMoviePosterFile(id),
              `xóa poster movie ${id}`
            ).catch(() => api.delete(`/api/media/movies/${id}/poster`)),
            
            mediaApi.handleR2ApiCall(
              () => mediaApi.deleteMovieBackdropFile(id),
              `xóa backdrop movie ${id}`
            ).catch(() => api.delete(`/api/media/movies/${id}/backdrop`)), 
            
            mediaApi.handleR2ApiCall(
              () => mediaApi.deleteMovieTrailerFile(id),
              `xóa trailer movie ${id}`
            ).catch(() => api.delete(`/api/media/movies/${id}/trailer`)),
          ])
          
          // Xóa episodes bằng individual method
          let episodesResult = { success: false, deletedCount: 0, totalCount: 0 }
          try {
            episodesResult = await mediaApi.deleteAllMovieEpisodesIndividually(id)
          } catch (episodesError) {
            console.warn(`Individual episodes deletion failed:`, episodesError)
            
            // Fallback cuối cùng: Xóa theo pattern
            try {
              console.log(`🚨 Fallback: Thử xóa episodes theo pattern...`)
              const patternResult = await mediaApi.deleteMovieEpisodesByPattern(id, 50)
              episodesResult = {
                success: patternResult.success,
                deletedCount: patternResult.deletedCount,
                totalCount: patternResult.totalCount
              }
              console.log(`Pattern deletion: ${episodesResult.deletedCount}/${episodesResult.totalCount}`)
            } catch (patternError) {
              console.warn(`Pattern deletion cũng thất bại:`, patternError)
            }
          }
          
          const mediaSuccessful = cleanupResults.filter(r => r.status === 'fulfilled').length
          console.log(`Đã xóa ${mediaSuccessful}/3 file media + ${episodesResult.deletedCount}/${episodesResult.totalCount} episodes của movie ${id}`)
        } catch (individualError) {
          console.warn(`Không thể xóa các file media riêng lẻ của movie ${id}:`, individualError)
        }
      }
      
      // Debug: Kiểm tra tình trạng storage sau khi xóa
      setTimeout(async () => {
        console.log(`🔍 Kiểm tra storage sau khi xóa movie ${id}...`)
        try {
          const afterStatus = await mediaApi.checkMovieStorageStatus(id)
          console.log(`📂 Storage sau khi xóa:`, afterStatus)
          
          if (afterStatus.episodesFolder && afterStatus.episodesFolder.length > 0) {
            console.warn(`⚠️ Vẫn còn ${afterStatus.episodesFolder.length} files trong episodes/${id}:`, afterStatus.episodesFolder)
          }
        } catch (debugError) {
          console.log(`✅ Storage đã được xóa hoàn toàn (không tìm thấy folder)`)
        }
      }, 2000)
      
      console.log(`✅ Hoàn thành xóa movie ${id}`)
      toast.success("Đã xóa phim và tất cả media liên quan thành công")
      
      // Refresh danh sách movies
      await fetchMovies()
      
    } catch (error) {
      console.error(`❌ Lỗi khi xóa movie ${id}:`, error)
      toast.error("Không thể xóa phim. Vui lòng thử lại.")
      
      // Không để error làm crash trang
      return false
    }
  }

  // Render status badge
  const renderStatusBadge = (movie: Movie) => {
    if (movie.isProcessed === false) {
      return (
        <Badge variant="warning" className="flex items-center gap-1">
          <Clock size={14} />
          <span>Đang xử lý</span>
        </Badge>
      )
    } else {
      return (
        <Badge variant="success" className="flex items-center gap-1">
          <CheckCircle size={14} />
          <span>Hoạt động</span>
        </Badge>
      )
    }
  }

  // Render movie genres
  const renderGenres = (movie: Movie) => {
    if (!movie.genres || movie.genres.length === 0) {
      return <span className="text-gray-400">-</span>
    }

    if (movie.genres.length <= 2) {
      return movie.genres.map(g => g.name).join(", ")
    }

    return (
      <>
        {movie.genres[0].name}, {movie.genres[1].name}{" "}
        <span className="text-gray-500">+{movie.genres.length - 2}</span>
      </>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Quản lý Phim</h1>
        <Button asChild>
          <Link href="/movies/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Thêm Phim Mới
          </Link>
        </Button>
      </div>

      {/* Hiển thị tiến trình upload */}
      {uploadingMovies.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Đang tải lên</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {uploadingMovies.map((upload) => (
              <div key={upload.id} className="space-y-2">
                <div className="flex justify-between">
                  <span>{upload.title}</span>
                  <span>{upload.progress}%</span>
                </div>
                <Progress value={upload.progress} />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Bộ lọc</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <Input
                  placeholder="Tìm kiếm phim..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="w-[150px]">
              <Select value={genreFilter} onValueChange={setGenreFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Thể loại" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả thể loại</SelectItem>
                  <SelectItem value="1">Hành động</SelectItem>
                  <SelectItem value="2">Tình cảm</SelectItem>
                  <SelectItem value="3">Hài hước</SelectItem>
                  <SelectItem value="4">Kinh dị</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-[150px]">
              <Select 
                value={yearFilter} 
                onValueChange={(value) => setYearFilter(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Năm" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả năm</SelectItem>
                  {[...Array(10)].map((_, i) => {
                    const year = new Date().getFullYear() - i
                    return (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm("")
                  setGenreFilter("all")
                  setYearFilter("all")
                }}
              >
                Xóa bộ lọc
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Movies table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách phim</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Đang tải dữ liệu...</div>
          ) : filteredMovies.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Không có phim nào</p>
              <Button asChild className="mt-4">
                <Link href="/movies/new">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Thêm Phim Mới
                </Link>
              </Button>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60px]">Poster</TableHead>
                    <TableHead>Tên Phim</TableHead>
                    <TableHead className="hidden md:table-cell">Năm</TableHead>
                    <TableHead className="hidden md:table-cell">Thời lượng</TableHead>
                    <TableHead className="hidden lg:table-cell">Thể loại</TableHead>
                    <TableHead className="hidden lg:table-cell">Số tập</TableHead>
                    <TableHead className="hidden lg:table-cell">Lượt xem</TableHead>
                    <TableHead className="hidden md:table-cell">Rating</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMovies.map((movie) => (
                    <TableRow key={movie.id}>
                      <TableCell className="p-2">
                        {movie.posterUrl ? (
                          <div className="relative w-[40px] h-[60px] overflow-hidden rounded">
                            <Image
                              src={movie.posterUrl}
                              alt={movie.title}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-[40px] h-[60px] bg-gray-200 dark:bg-gray-800 rounded flex items-center justify-center">
                            <Video className="text-gray-400" size={20} />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        <Link 
                          href={`/movies/${movie.id}`} 
                          className="hover:text-blue-600 hover:underline"
                        >
                          {movie.title}
                        </Link>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {movie.releaseYear}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {movie.duration} phút
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {renderGenres(movie)}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {movie.totalEpisodes}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {movie.views.toLocaleString()}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {movie.rating} ★
                      </TableCell>
                      <TableCell>
                        {renderStatusBadge(movie)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                          >
                            <Link href={`/movies/${movie.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              Chi tiết
                            </Link>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                          >
                            <Link href={`/movies/${movie.id}/edit`}>
                              <Edit className="mr-2 h-4 w-4" />
                              Sửa
                            </Link>
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={(e) => handleDeleteMovie(movie.id, e)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Xóa
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {totalPages > 1 && (
                <div className="mt-6">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={(page) => setCurrentPage(page)}
                  />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 