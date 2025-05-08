'use client'

import { useState, useEffect, FormEvent } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Star, MessageCircle } from "lucide-react"
import axios from "axios"
import { API_ENDPOINTS } from "@/lib/api/endpoints"
import { useAuth } from "@/hooks/api/useAuth"
import { Card, CardContent } from "@/components/ui/card"
import { Comment } from "@/types/comment"


interface CommentsSectionProps {
  contentId: string;
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

export default function CommentsSection({ contentId }: CommentsSectionProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState("")
  const [rating, setRating] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [containsSpoilers, setContainsSpoilers] = useState(false)
  const { user, isAuthenticated } = useAuth()
  
  // Define the common glass background style
  const GLASS_BG = "bg-gradient-to-br from-gray-800/70 to-gray-900/80 border-gray-700/60 backdrop-blur-sm shadow-lg";

  // Fetch comments when component mounts or contentId changes
  useEffect(() => {
    const fetchComments = async () => {
      try {
        if (!contentId) {
          console.error("No contentId provided to CommentsSection");
          setError("Không thể tải bình luận. Thiếu ID nội dung.");
          return;
        }
        
        const response = await axios.get(API_ENDPOINTS.COMMENTS.BY_MOVIE(contentId))
        
        // Ensure we have valid comments data
        if (Array.isArray(response.data)) {
          // Filter out comments with malformed user data
          const validComments = response.data.filter(comment => 
            comment && comment.user && typeof comment.user.name === 'string'
          );
          setComments(validComments)
        } else {
          console.error("Invalid comments data format:", response.data);
          setComments([])
        }
      } catch (err) {
        console.error("Error fetching comments:", err)
        setError("Không thể tải bình luận. Vui lòng thử lại sau.")
      }
    }

    if (contentId) {
      fetchComments()
    }
  }, [contentId])

  // Submit a new comment
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    
    if (!isAuthenticated) {
      setError("Vui lòng đăng nhập để bình luận")
      return
    }
    
    if (!newComment.trim()) {
      setError("Vui lòng nhập nội dung bình luận")
      return
    }
    
    setIsSubmitting(true)
    setError(null)
    
    try {
      const response = await axios.post(API_ENDPOINTS.COMMENTS.CREATE, {
        movieId: contentId,
        text: newComment,
        rating: rating || 5, // Default to 5 if no rating
        containsSpoilers
      })
      
      // Add new comment to list
      setComments([response.data, ...comments])
      
      // Reset form
      setNewComment("")
      setRating(0)
      setContainsSpoilers(false)
    } catch (err) {
      console.error("Error posting comment:", err)
      setError("Không thể đăng bình luận. Vui lòng thử lại sau.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Format date to friendly string
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    
    try {
      return new Date(dateString).toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (err) {
      console.error("Error formatting date:", err);
      return '';
    }
  }

  // Safe getter for user initials
  const getUserInitial = (user: Comment['user'] | undefined): string => {
    if (!user || !user.full_name || user.full_name.length === 0) return 'U';
    return user.full_name[0].toUpperCase();
  }
  
  return (
    <Card className={GLASS_BG}>
      <CardContent className="p-4">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
          <MessageCircle className="w-5 h-5 mr-2 text-amber-400" />
          <span className="bg-gradient-to-r from-amber-300 to-amber-500 bg-clip-text text-transparent">
            Bình luận
          </span>
        </h2>

        {/* Comment form */}
        {isAuthenticated ? (
          <form onSubmit={handleSubmit} className="mb-6">
            <div className="flex-1 space-y-3">
              <Textarea
              placeholder="Viết bình luận..."
                className="min-h-24 bg-gray-700/50 border border-gray-600 focus:border-amber-500 text-white placeholder-gray-400 resize-none focus:ring-0 focus:outline-none"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
            />
              <div className="flex justify-between items-center">
                <div className="flex items-center">
              <label className="flex items-center text-sm text-gray-300">
                    <input 
                      type="checkbox" 
                      className="mr-2 rounded bg-gray-600 border-gray-500"
                      checked={containsSpoilers}
                      onChange={(e) => setContainsSpoilers(e.target.checked)}
                    />
                Ẩn nội dung spoil
              </label>
                </div>
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
              <Button 
                    type="submit" 
                    disabled={isSubmitting || !newComment.trim()}
                    variant="default" 
                    size="sm" 
                    className="ml-3 bg-amber-500 hover:bg-amber-600 text-gray-900"
              >
                    {isSubmitting ? 'Đang gửi...' : 'Gửi'}
              </Button>
                </div>
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
            </div>
          </form>
        ) : (
          <div className="p-4 mb-6 bg-gray-700/50 rounded-lg border border-gray-600 text-center">
            <p className="text-gray-300 mb-3">Vui lòng đăng nhập để bình luận</p>
            <Button asChild className="bg-amber-500 hover:bg-amber-600 text-gray-900">
              <a href="/login">Đăng nhập</a>
            </Button>
          </div>
        )}

        {/* Comments list */}
        <div className="space-y-4">
          {comments.length > 0 ? (
            comments.map((comment) => (
              <div key={comment.id} className="flex gap-4 p-4 rounded-lg bg-gray-700/50 border border-gray-600/50">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={comment.user?.avatar_url} alt={comment.user?.avatar_url || 'User'} />
                  <AvatarFallback>{getUserInitial(comment.user)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-white">{comment.user?.avatar_url || 'Anonymous'}</h4>
                    <span className="text-sm text-gray-400">{formatDate(comment.createdAt)}</span>
                  </div>
                  <div className="flex items-center mt-1 mb-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star 
                        key={star} 
                        className={`w-4 h-4 ${star <= (comment.movie?.rating || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-500'}`} 
                      />
                    ))}
                  </div>
                  {comment.containsSpoilers ? (
                    <details className="text-gray-300 text-sm">
                      <summary className="cursor-pointer text-amber-400 font-medium">Cảnh báo: Có spoiler! (Bấm để xem)</summary>
                      <p className="mt-2">{comment.comment}</p>
                    </details>
                  ) : (
                    <p className="text-gray-300 text-sm">{comment.comment}</p>
                  )}
                </div>
              </div>
            ))
          ) : error ? (
            <div className="text-center py-4">
              <p className="text-gray-400">{error}</p>
            </div>
          ) : (
          <div className="text-center text-gray-400 text-sm py-4">
            Chưa có bình luận nào
          </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
