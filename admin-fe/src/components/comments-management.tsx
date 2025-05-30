"use client"

import { useState, useEffect } from "react"
import { toast } from "react-hot-toast"
import {
  Search,
  Trash2,
  Eye,
  CheckCircle,
  Clock,
  MessageCircle,
  User
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
import { Pagination } from "@/components/ui/pagination"

import { api } from "@/services/api"

interface Comment {
  id: number
  movieId: number
  userId: number
  userName: string
  comment: string
  createdAt: string
  updatedAt: string
  user: {
    id: number
    full_name: string
  }
  movie?: {
    id: number
    title: string
  }
}

export function CommentsManagement() {
  const [comments, setComments] = useState<Comment[]>([])
  const [filteredComments, setFilteredComments] = useState<Comment[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [movieFilter, setMovieFilter] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const itemsPerPage = 10

  // Fetch comments
  const fetchComments = async () => {
    try {
      setIsLoading(true)
      const response = await api.get(`/api/comments`, {
        params: {
          page: currentPage,
          limit: itemsPerPage
        }
      })
      
      if (response.data.comments) {
        setComments(response.data.comments)
        if (response.data.pagination) {
          setTotalPages(response.data.pagination.totalPages || 1)
        }
      } else {
        setComments(response.data || [])
        setTotalPages(1)
      }
      
      setIsLoading(false)
    } catch (error) {
      console.error("Error fetching comments:", error)
      toast.error("Không thể tải danh sách bình luận")
      setIsLoading(false)
      setComments([])
      setTotalPages(1)
    }
  }

  useEffect(() => {
    fetchComments()
  }, [currentPage])

  // Apply filters
  useEffect(() => {
    let result = [...comments]
    
    if (searchTerm) {
      result = result.filter(comment => 
        comment.comment.toLowerCase().includes(searchTerm.toLowerCase()) ||
        comment.user.full_name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    if (movieFilter && movieFilter !== "all") {
      result = result.filter(comment => 
        comment.movieId.toString() === movieFilter
      )
    }
    
    setFilteredComments(result)
  }, [comments, searchTerm, movieFilter])

  // Handle delete comment
  const handleDeleteComment = async (id: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa bình luận này?")) {
      return
    }
    
    try {
      await api.delete(`/api/comments/${id}`)
      toast.success("Đã xóa bình luận thành công")
      await fetchComments()
    } catch (error) {
      console.error("Error deleting comment:", error)
      toast.error("Không thể xóa bình luận. Vui lòng thử lại.")
    }
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Quản lý Bình luận</h1>
      </div>

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
                  placeholder="Tìm kiếm bình luận hoặc người dùng..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="w-[200px]">
              <Select value={movieFilter} onValueChange={setMovieFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Lọc theo phim" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả phim</SelectItem>
                  {/* Thêm danh sách phim dynamic ở đây */}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm("")
                  setMovieFilter("all")
                }}
              >
                Xóa bộ lọc
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comments table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách bình luận</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Đang tải dữ liệu...</div>
          ) : filteredComments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Không có bình luận nào</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Người dùng</TableHead>
                    <TableHead>Nội dung</TableHead>
                    <TableHead className="hidden md:table-cell">Phim</TableHead>
                    <TableHead className="hidden lg:table-cell">Thời gian</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredComments.map((comment) => (
                    <TableRow key={comment.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="text-gray-400" size={20} />
                          <span>{comment.user.full_name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[300px] truncate">
                        <div className="flex items-center gap-2">
                          <MessageCircle className="text-gray-400" size={16} />
                          <span>{comment.comment}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {comment.movie?.title || `Phim #${comment.movieId}`}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {formatDate(comment.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              // Hiển thị modal chi tiết bình luận
                            }}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            Chi tiết
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteComment(comment.id)}
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

