"use client"

import { useState, useEffect, useCallback } from "react"
import { toast } from "react-hot-toast"
import {
  Search,
  Trash2,
  Eye,
  CheckCircle,
  Clock,
  MessageCircle,
  User,
  Calendar,
  TrendingUp,
  Filter,
  RefreshCw,
  BarChart3,
  Users,
  Film
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

import { commentApi } from "@/services/api"
import { Comment, CommentStats, CommentPagination } from "@/models"

export function CommentsManagement() {
  const [comments, setComments] = useState<Comment[]>([])
  const [stats, setStats] = useState<CommentStats | null>(null)
  const [latestComments, setLatestComments] = useState<Comment[]>([])
  const [pagination, setPagination] = useState<CommentPagination>({
    total: 0,
    totalPages: 1,
    currentPage: 1,
    limit: 20
  })
  
  // Filters
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    search: "",
    movieId: "",
    userId: "",
    dateFrom: "",
    dateTo: "",
    sort: "createdAt",
    order: "DESC" as 'ASC' | 'DESC'
  })
  
  const [isLoading, setIsLoading] = useState(true)
  const [isStatsLoading, setIsStatsLoading] = useState(true)
  const [selectedComment, setSelectedComment] = useState<Comment | null>(null)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)

  // Fetch comments với filters
  const fetchComments = useCallback(async () => {
    try {
      setIsLoading(true)
      const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== "")
      )
      
      const response = await commentApi.getAll(cleanFilters)
      setComments(response.data.comments || [])
      setPagination(response.data.pagination || {
        total: 0,
        totalPages: 1,
        currentPage: 1,
        limit: 20
      })
    } catch (error: any) {
      console.error("Error fetching comments:", error)
      toast.error("Không thể tải danh sách bình luận")
      setComments([])
    } finally {
      setIsLoading(false)
    }
  }, [filters])

  // Fetch statistics
  const fetchStats = useCallback(async () => {
    try {
      setIsStatsLoading(true)
      const response = await commentApi.getStats()
      setStats(response.data)
    } catch (error) {
      console.error("Error fetching stats:", error)
      toast.error("Không thể tải thống kê bình luận")
    } finally {
      setIsStatsLoading(false)
    }
  }, [])

  // Fetch latest comments
  const fetchLatestComments = useCallback(async () => {
    try {
      const response = await commentApi.getLatest(5)
      setLatestComments(response.data || [])
    } catch (error) {
      console.error("Error fetching latest comments:", error)
    }
  }, [])

  useEffect(() => {
    fetchComments()
  }, [fetchComments])

  useEffect(() => {
    fetchStats()
    fetchLatestComments()
  }, [fetchStats, fetchLatestComments])

  // Handle filter changes
  const handleFilterChange = (key: string, value: string | number) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: key !== "page" ? 1 : Number(value), // Đảm bảo page luôn là number
    }))
  }

  // Clear all filters
  const clearAllFilters = () => {
    setFilters({
      page: 1,
      limit: 20,
      search: "",
      movieId: "",
      userId: "",
      dateFrom: "",
      dateTo: "",
      sort: "createdAt",
      order: "DESC"
    })
  }

  // Handle delete comment
  const handleDeleteComment = async (id: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa bình luận này?")) {
      return
    }
    
    try {
      await commentApi.delete(id)
      toast.success("Đã xóa bình luận thành công")
      await fetchComments()
      await fetchStats() // Refresh stats after deletion
    } catch (error: any) {
      console.error("Error deleting comment:", error)
      const errorMessage = error.response?.data?.message || "Không thể xóa bình luận"
      toast.error(errorMessage)
    }
  }

  // Show comment detail
  const showCommentDetail = (comment: Comment) => {
    setSelectedComment(comment)
    setIsDetailDialogOpen(true)
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

  // Format relative time
  const formatRelativeTime = (dateString: string) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return "Vừa xong"
    if (diffInHours < 24) return `${diffInHours} giờ trước`
    if (diffInHours < 24 * 7) return `${Math.floor(diffInHours / 24)} ngày trước`
    return formatDate(dateString)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Quản lý Bình luận</h1>
        <Button onClick={() => { fetchComments(); fetchStats(); fetchLatestComments(); }}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Làm mới
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <MessageCircle className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Tổng bình luận</p>
                <p className="text-2xl font-bold">
                  {isStatsLoading ? "..." : stats?.totalComments?.toLocaleString() || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Hôm nay</p>
                <p className="text-2xl font-bold">
                  {isStatsLoading ? "..." : stats?.commentsToday?.toLocaleString() || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Tuần này</p>
                <p className="text-2xl font-bold">
                  {isStatsLoading ? "..." : stats?.commentsThisWeek?.toLocaleString() || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <BarChart3 className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Tháng này</p>
                <p className="text-2xl font-bold">
                  {isStatsLoading ? "..." : stats?.commentsThisMonth?.toLocaleString() || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Latest Comments & Top Movies */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Latest Comments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="mr-2 h-5 w-5" />
              Bình luận mới nhất
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {latestComments.map((comment) => (
                <div key={comment.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {comment.user.full_name}
                      </p>
                      <span className="text-xs text-gray-500">
                        {formatRelativeTime(comment.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {comment.comment}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      trên {comment.movie.title}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Commented Movies */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Film className="mr-2 h-5 w-5" />
              Phim có nhiều bình luận nhất
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats?.topCommentedMovies?.map((movie, index) => (
                <div key={movie.movieId} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 rounded-full text-sm font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{movie.movieTitle}</p>
                      <p className="text-xs text-gray-500">ID: {movie.movieId}</p>
                    </div>
                  </div>
                  <Badge variant="secondary">
                    {movie.commentCount} bình luận
                  </Badge>
                </div>
              )) || (
                <p className="text-gray-500 text-center py-4">Chưa có dữ liệu</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="mr-2 h-5 w-5" />
            Bộ lọc và tìm kiếm
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <Label htmlFor="search">Tìm kiếm</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <Input
                  id="search"
                  placeholder="Nội dung hoặc tên người dùng..."
                  className="pl-10"
                  value={filters.search}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                />
              </div>
            </div>

            {/* Movie ID */}
            <div>
              <Label htmlFor="movieId">ID Phim</Label>
              <Input
                id="movieId"
                type="number"
                placeholder="ID phim..."
                value={filters.movieId}
                onChange={(e) => handleFilterChange("movieId", e.target.value)}
              />
            </div>

            {/* User ID */}
            <div>
              <Label htmlFor="userId">ID Người dùng</Label>
              <Input
                id="userId"
                type="number"
                placeholder="ID người dùng..."
                value={filters.userId}
                onChange={(e) => handleFilterChange("userId", e.target.value)}
              />
            </div>

            {/* Date From */}
            <div>
              <Label htmlFor="dateFrom">Từ ngày</Label>
              <Input
                id="dateFrom"
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
              />
            </div>

            {/* Date To */}
            <div>
              <Label htmlFor="dateTo">Đến ngày</Label>
              <Input
                id="dateTo"
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange("dateTo", e.target.value)}
              />
            </div>

            {/* Sort */}
            <div>
              <Label htmlFor="sort">Sắp xếp theo</Label>
              <Select 
                value={filters.sort} 
                onValueChange={(value) => handleFilterChange("sort", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt">Ngày tạo</SelectItem>
                  <SelectItem value="updatedAt">Ngày cập nhật</SelectItem>
                  <SelectItem value="userName">Tên người dùng</SelectItem>
                  <SelectItem value="comment">Nội dung</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Order */}
            <div>
              <Label htmlFor="order">Thứ tự</Label>
              <Select 
                value={filters.order} 
                onValueChange={(value) => handleFilterChange("order", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DESC">Giảm dần</SelectItem>
                  <SelectItem value="ASC">Tăng dần</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Clear Filters */}
            <div className="flex items-end">
              <Button variant="outline" onClick={clearAllFilters} className="w-full">
                Xóa bộ lọc
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comments Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Danh sách bình luận
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({pagination.total} bình luận)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="mx-auto h-8 w-8 animate-spin text-gray-400" />
              <p className="mt-2 text-gray-500">Đang tải dữ liệu...</p>
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-gray-500">Không tìm thấy bình luận nào</p>
            </div>
          ) : (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Người dùng</TableHead>
                    <TableHead>Phim</TableHead>
                    <TableHead>Nội dung</TableHead>
                    <TableHead>Ngày tạo</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {comments.map((comment) => (
                    <TableRow key={comment.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full">
                            <User size={16} />
                          </div>
                          <div>
                            <p className="font-medium">{comment.user.full_name}</p>
                            <p className="text-sm text-gray-500">ID: {comment.userId}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{comment.movie.title}</p>
                          <p className="text-sm text-gray-500">ID: {comment.movieId}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="max-w-md truncate" title={comment.comment}>
                          {comment.comment}
                        </p>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm">{formatDate(comment.createdAt)}</p>
                          <p className="text-xs text-gray-500">
                            {formatRelativeTime(comment.createdAt)}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => showCommentDetail(comment)}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            Xem
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

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <div className="text-sm text-gray-500">
                    Hiển thị {((pagination.currentPage - 1) * pagination.limit) + 1} - {Math.min(pagination.currentPage * pagination.limit, pagination.total)} 
                    trong tổng số {pagination.total} bình luận
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.currentPage <= 1}
                      onClick={() => handleFilterChange("page", pagination.currentPage - 1)}
                    >
                      Trước
                    </Button>
                    
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                        const page = i + 1
                        return (
                          <Button
                            key={page}
                            variant={pagination.currentPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleFilterChange("page", page)}
                          >
                            {page}
                          </Button>
                        )
                      })}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.currentPage >= pagination.totalPages}
                      onClick={() => handleFilterChange("page", pagination.currentPage + 1)}
                    >
                      Sau
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Comment Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Chi tiết bình luận</DialogTitle>
          </DialogHeader>
          
          {selectedComment && (
            <div className="space-y-4">
              {/* User Info */}
              <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-center w-12 h-12 bg-blue-100 text-blue-600 rounded-full">
                  <User size={20} />
                </div>
                <div>
                  <h3 className="font-semibold">{selectedComment.user.full_name}</h3>
                  <p className="text-sm text-gray-500">ID: {selectedComment.userId}</p>
                  {selectedComment.user.email && (
                    <p className="text-sm text-gray-500">{selectedComment.user.email}</p>
                  )}
                </div>
              </div>

              {/* Movie Info */}
              <div className="p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Film className="h-5 w-5 text-gray-400" />
                  <div>
                    <h4 className="font-medium">{selectedComment.movie.title}</h4>
                    <p className="text-sm text-gray-500">ID Phim: {selectedComment.movieId}</p>
                  </div>
                </div>
              </div>

              {/* Comment Content */}
              <div className="space-y-2">
                <Label>Nội dung bình luận:</Label>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="whitespace-pre-wrap">{selectedComment.comment}</p>
                </div>
              </div>

              {/* Timestamps */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Ngày tạo:</Label>
                  <p className="text-sm">{formatDate(selectedComment.createdAt)}</p>
                </div>
                <div>
                  <Label>Cập nhật cuối:</Label>
                  <p className="text-sm">{formatDate(selectedComment.updatedAt)}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setIsDetailDialogOpen(false)}
                >
                  Đóng
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setIsDetailDialogOpen(false)
                    handleDeleteComment(selectedComment.id)
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Xóa bình luận
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

