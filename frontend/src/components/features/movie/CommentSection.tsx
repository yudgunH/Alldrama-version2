'use client'

import { useState, useEffect, FormEvent, useRef } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Star, MessageCircle } from "lucide-react"
// import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { API_ENDPOINTS } from "@/lib/api/endpoints"
import { useAuth } from "@/hooks/api/useAuth"
import { Comment } from "@/types"
import { formatDistance } from "date-fns"
import { vi } from "date-fns/locale"
import { Skeleton } from "@/components/ui/skeleton"
import { apiClient } from "@/lib/api/apiClient"

interface CommentSectionProps {
  movieId: string
}

// Simple Textarea component to avoid dependency issues
function Textarea({ 
  className, 
  placeholder, 
  value, 
  onChange 
}: { 
  className?: string, 
  placeholder?: string, 
  value: string, 
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void 
}) {
  return (
    <textarea
      className={`w-full rounded-md p-3 ${className}`}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
    />
  )
}

export default function CommentSection({ movieId }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState("")
  const [rating, setRating] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { user, isAuthenticated } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  // Fetch comments
  useEffect(() => {
    const fetchComments = async () => {
      setIsLoading(true)
      
      try {
        // Sử dụng apiClient thay vì axios trực tiếp
        const response = await apiClient.get<{comments: Comment[]}>(API_ENDPOINTS.COMMENTS.BY_MOVIE(movieId))
        setComments(response.comments || [])
      } catch (error) {
        console.error("Error fetching comments:", error)
        toast.error("Không thể tải bình luận")
      } finally {
        setIsLoading(false)
      }
    }
    
    if (movieId) {
      fetchComments()
    }
  }, [movieId])

  // Submit comment
  const submitComment = async () => {
    if (!newComment.trim()) return
    
    if (!isAuthenticated) {
      toast.error("Vui lòng đăng nhập để bình luận")
      return
    }
    
    setIsSubmitting(true)
    
    try {
      // Sử dụng apiClient thay vì axios trực tiếp
      const response = await apiClient.post<{comment: Comment}>(API_ENDPOINTS.COMMENTS.CREATE, {
        movieId,
        text: newComment,
        rating: rating || 5 // Default to 5 if no rating
      })
      
      // Thêm comment mới vào danh sách
      setComments(prev => [response.comment, ...prev])
      
      // Reset input
      setNewComment("")
      setRating(0)
      toast.success("Đã thêm bình luận")
    } catch (error) {
      console.error("Error submitting comment:", error)
      toast.error("Không thể gửi bình luận")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Format date to friendly string
  const formatDate = (dateString: string) => {
    if (!dateString) return ''
    
    try {
      return formatDistance(new Date(dateString), new Date(), { locale: vi })
    } catch (err) {
      console.error("Error formatting date:", err)
      return ''
    }
  }

  // Safe getter for user initials
  const getUserInitial = (user: Comment['user'] | undefined): string => {
    if (!user || !user.full_name || user.full_name.length === 0) return 'U'
    return user.full_name[0].toUpperCase()
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-4 flex items-center text-white">
        <MessageCircle className="w-5 h-5 mr-2 text-indigo-400" />
        <span className="bg-gradient-to-r from-indigo-300 to-purple-300 bg-clip-text text-transparent">
          Bình luận và đánh giá
        </span>
      </h2>

      {/* Comment form */}
      {isAuthenticated ? (
        <form onSubmit={(e) => { e.preventDefault(); submitComment() }} className="mb-8">
          <div className="flex items-start gap-4">
            <Avatar className="w-10 h-10">
              <AvatarImage src={user?.avatar_url} alt={user?.full_name} />
              <AvatarFallback>{user?.full_name?.[0] || 'U'}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-3">
              <Textarea
                placeholder="Chia sẻ suy nghĩ của bạn về bộ phim này..."
                className="min-h-24 bg-gray-800/50 border border-gray-700 focus:border-indigo-500"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
              />
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className={`p-1 focus:outline-none ${star <= rating ? 'text-yellow-400' : 'text-gray-500'}`}
                      onClick={() => setRating(star)}
                    >
                      <Star className={`w-5 h-5 ${star <= rating ? 'fill-yellow-400' : ''}`} />
                    </button>
                  ))}
                  <span className="ml-2 text-sm text-gray-400">
                    {rating > 0 ? `${rating}/5 sao` : 'Chọn đánh giá'}
                  </span>
                </div>
                <Button 
                  type="submit" 
                  disabled={isSubmitting || !newComment.trim()}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  {isSubmitting ? 'Đang gửi...' : 'Gửi'}
                </Button>
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
            </div>
          </div>
        </form>
      ) : (
        <div className="p-4 mb-6 bg-gray-800/50 rounded-lg border border-gray-700 text-center">
          <p className="text-gray-300 mb-3">Vui lòng đăng nhập để bình luận về bộ phim này</p>
          <Button asChild className="bg-indigo-600 hover:bg-indigo-700">
            <a href="/login">Đăng nhập</a>
          </Button>
        </div>
      )}

      {/* Comments list */}
      <div className="space-y-6">
        {isLoading ? (
          <div className="text-center py-6">
            <Skeleton className="h-10 w-full" />
          </div>
        ) : comments.length > 0 ? (
          comments.map((comment) => (
            <div key={comment.id} className="flex gap-4 p-4 rounded-lg bg-gray-800/30 border border-gray-700/50">
              <Avatar className="w-10 h-10">
                <AvatarImage src={comment.user?.avatar_url} alt={comment.user?.full_name || 'User'} />
                <AvatarFallback>{getUserInitial(comment.user)}</AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-white">{comment.user?.full_name || 'Anonymous'}</h4>
                  <span className="text-sm text-gray-400">{formatDate(comment.createdAt)}</span>
                </div>
                <div className="flex items-center mt-1 mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star 
                      key={star} 
                      className={`w-4 h-4 ${star <= (comment.rating || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-500'}`} 
                    />
                  ))}
                </div>
                <p className="text-gray-300 text-sm">{comment.comment}</p>
              </div>
            </div>
          ))
        ) : error ? (
          <div className="text-center py-6">
            <p className="text-gray-400">{error}</p>
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-gray-400">Chưa có bình luận nào. Hãy là người đầu tiên bình luận!</p>
          </div>
        )}
      </div>
    </div>
  )
} 