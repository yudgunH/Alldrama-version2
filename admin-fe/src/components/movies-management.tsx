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

import { api, movieApi } from "@/services/api"
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
  const handleDeleteMovie = async (id: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa phim này?")) {
      return
    }
    
    try {
      await movieApi.delete(id)
      toast.success("Đã xóa phim thành công")
      fetchMovies()
    } catch (error) {
      console.error("Error deleting movie:", error)
      toast.error("Không thể xóa phim")
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
                            onClick={() => handleDeleteMovie(movie.id)}
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