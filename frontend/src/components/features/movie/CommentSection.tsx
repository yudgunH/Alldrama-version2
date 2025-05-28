'use client'

import { useState, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { MessageCircle, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { API_ENDPOINTS } from "@/lib/api/endpoints"
import { useAuth } from "@/hooks/api/useAuth"
import { Comment } from "@/types"
import { formatDistance } from "date-fns"
import { vi } from "date-fns/locale"
import { Skeleton } from "@/components/ui/skeleton"
import { apiClient } from "@/lib/api/apiClient"
import { useRouter } from "next/navigation"

interface CommentSectionProps {
  movieId: string
}

function Textarea({ className, placeholder, value, onChange }: { className?: string; placeholder?: string; value: string; onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void }) {
  return (
    <textarea
      className={`w-full rounded-lg p-3 bg-gray-700 text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none ${className}`}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
    />
  )
}

export default function CommentSection({ movieId }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { user, isAuthenticated, token } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const router = useRouter()

  const fetchComments = async (pageNum: number = 1, append: boolean = false) => {
    if (pageNum === 1) setIsLoading(true)
    else setIsLoadingMore(true)
    
    setError(null)
    try {
      const response = await apiClient.get<Comment[]>(
        `/api/comments/movies/${movieId}?page=${pageNum}&limit=10&sort=createdAt&order=DESC`
      )
      
      if (response) {
        const newComments = Array.isArray(response) ? response : []
        setComments(prev => append ? [...prev, ...newComments] : newComments)
        setHasMore(newComments.length === 10) // Nếu nhận được 10 comment thì còn comment để load thêm
      }
    } catch (err: any) {
      console.error(err)
      setError(err.response?.data?.message || "Không thể tải bình luận")
      toast.error("Không thể tải bình luận")
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
    }
  }

  useEffect(() => {
    if (movieId) fetchComments()
  }, [movieId])

  const loadMore = () => {
    const nextPage = page + 1
    setPage(nextPage)
    fetchComments(nextPage, true)
  }

  const submitComment = async () => {
    if (!newComment.trim()) return
    if (!isAuthenticated || !user || !token) {
      toast.error("Vui lòng đăng nhập để bình luận")
      router.push('/login')
      return
    }
    setIsSubmitting(true)
    try {
      if (!user.id || !user.full_name || !user.email) throw new Error("Thông tin người dùng không đầy đủ")
      const response = await apiClient.post<{comment: Comment}>(
        API_ENDPOINTS.COMMENTS.CREATE,
        { movieId: Number(movieId), comment: newComment },
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
      )
      const commentWithUser: Comment = {
        ...response.comment,
        user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role, avatar_url: user.avatar_url }
      }
      setComments(prev => [commentWithUser, ...prev])
      setNewComment("")
      toast.success("Đã thêm bình luận")
    } catch (err: any) {
      console.error(err)
      if (err.response?.status === 401) {
        toast.error("Phiên đăng nhập đã hết hạn.")
        router.push('/login')
      } else {
        toast.error(err.response?.data?.message || "Không thể gửi bình luận")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatDate = (dateString: string) => {
    try { return formatDistance(new Date(dateString), new Date(), { locale: vi }) }
    catch { return '' }
  }

  const getUserInitial = (user: Comment['user']) => user?.full_name?.[0]?.toUpperCase() || 'U'

  return (
    <div className="max-w-4xl bg-gradient-to-br from-gray-800/60 to-gray-900/60 border border-gray-700 overflow-hidden rounded-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-2 p-4">
        <MessageCircle className="w-6 h-6 text-indigo-400" />
        <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-300 to-purple-300 bg-clip-text text-transparent">Bình luận</h2>
      </div>

      {/* Comment Form */}
      {isAuthenticated && user ? (
        <div className="p-4 border-b border-gray-700">
          <div className="flex gap-4">
            <Avatar className="w-10 h-10">
              <AvatarImage src={user.avatar_url} alt={user.full_name} />
              <AvatarFallback>{user.full_name[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <form onSubmit={e => { e.preventDefault(); submitComment() }}>
                <Textarea
                  placeholder="Chia sẻ suy nghĩ của bạn về bộ phim này..."
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  className="resize-none"
                />
                <div className="flex justify-end mt-2">
                  <Button type="submit" disabled={isSubmitting || !newComment.trim()} className="bg-indigo-600 hover:bg-indigo-700">
                    {isSubmitting ? 'Đang gửi...' : 'Gửi'}
                  </Button>
                </div>
                {error && <p className="mt-2 text-red-500 text-sm">{error}</p>}
              </form>
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-8 bg-gray-800/50 text-center p-4">
          <p className="text-gray-300 mb-4">Vui lòng đăng nhập để bình luận</p>
          <Button asChild className="bg-indigo-600 hover:bg-indigo-700">
            <a href="/login">Đăng nhập</a>
          </Button>
        </div>
      )}

      {/* Comments List */}
      {isLoading ? (
        <div className="space-y-4 p-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-gray-800/30 rounded-lg p-4">
              <div className="flex gap-4">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-16 w-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : comments.length > 0 ? (
        <div className="space-y-4 p-4">
          {comments.map(comment => (
            <div key={comment.id} className="rounded-lg p-4 hover:bg-gray-800/40 transition">
              <div className="flex gap-4">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={comment.user?.avatar_url} alt={comment.user?.full_name || 'User'} />
                  <AvatarFallback>{getUserInitial(comment.user)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-lg font-semibold text-indigo-200">{comment.user?.full_name}</h4>
                    <span className="text-sm text-gray-400">• {formatDate(comment.createdAt)}</span>
                  </div>
                  <p className="text-gray-300">{comment.comment}</p>
                </div>
              </div>
            </div>
          ))}
          
          {/* Load More Button */}
          {hasMore && (
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
                onClick={loadMore}
                disabled={isLoadingMore}
              >
                {isLoadingMore ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Đang tải...
                  </>
                ) : (
                  'Xem thêm bình luận'
                )}
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-gray-800/30 text-center p-4">
          <p className="text-gray-400 py-8">Chưa có bình luận nào. Hãy là người đầu tiên!</p>
        </div>
      )}
    </div>
  )
}