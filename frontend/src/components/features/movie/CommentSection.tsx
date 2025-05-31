'use client'

import { useState, useEffect, useMemo } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { MessageCircle, Loader2, Crown, Star, Shield, Zap, Heart, Flame, Award, Trophy } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/hooks/api/useAuth"
import { useComments } from "@/hooks/api/useComments"
import { Comment } from "@/types"
import { formatDistance } from "date-fns"
import { vi } from "date-fns/locale"
import { Skeleton } from "@/components/ui/skeleton"
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

// Utility function to get user badges based on role and registration time
const getUserBadges = (user: Comment['user']) => {
  if (!user) return [];
  
  const badges = [];
  const now = new Date();
  const createdAt = user.createdAt ? new Date(user.createdAt) : new Date();
  const daysSinceRegistration = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
  
  // Role-based badges
  if (user.role === 'admin') {
    badges.push({
      text: 'Admin',
      icon: Crown,
      gradient: 'from-yellow-400 via-orange-500 to-red-500',
      textColor: 'text-white',
      borderColor: 'border-yellow-400/50',
      glow: 'shadow-yellow-500/25'
    });
  }
  
  // Since only 'user' and 'admin' roles exist according to the type definition,
  // we'll create premium/subscriber logic based on subscription status
  if (user.role === 'user' && (user as any).subscriptionExpiredAt) {
    const subscriptionExpired = new Date((user as any).subscriptionExpiredAt) < new Date();
    if (!subscriptionExpired) {
      badges.push({
        text: 'Premium',
        icon: Star,
        gradient: 'from-purple-400 via-pink-500 to-purple-600',
        textColor: 'text-white',
        borderColor: 'border-purple-400/50',
        glow: 'shadow-purple-500/25'
      });
    }
  }
  
  // Time-based badges
  if (daysSinceRegistration >= 365) {
    const years = Math.floor(daysSinceRegistration / 365);
    if (years >= 3) {
      badges.push({
        text: 'Huyền thoại',
        icon: Trophy,
        gradient: 'from-amber-400 via-yellow-500 to-orange-600',
        textColor: 'text-white',
        borderColor: 'border-amber-400/50',
        glow: 'shadow-amber-500/25'
      });
    } else if (years >= 2) {
      badges.push({
        text: 'Kỳ cựu',
        icon: Award,
        gradient: 'from-emerald-400 via-teal-500 to-cyan-600',
        textColor: 'text-white',
        borderColor: 'border-emerald-400/50',
        glow: 'shadow-emerald-500/25'
      });
    } else {
      badges.push({
        text: 'Lão làng',
        icon: Flame,
        gradient: 'from-orange-400 via-red-500 to-pink-600',
        textColor: 'text-white',
        borderColor: 'border-orange-400/50',
        glow: 'shadow-orange-500/25'
      });
    }
  } else if (daysSinceRegistration >= 180) {
    badges.push({
      text: 'Thành viên tích cực',
      icon: Zap,
      gradient: 'from-cyan-400 via-blue-500 to-indigo-600',
      textColor: 'text-white',
      borderColor: 'border-cyan-400/50',
      glow: 'shadow-cyan-500/25'
    });
  } else if (daysSinceRegistration >= 30) {
    badges.push({
      text: 'Thành viên',
      icon: Heart,
      gradient: 'from-pink-400 via-rose-500 to-red-500',
      textColor: 'text-white',
      borderColor: 'border-pink-400/50',
      glow: 'shadow-pink-500/25'
    });
  } else if (daysSinceRegistration >= 7) {
    badges.push({
      text: 'Người mới',
      icon: Star,
      gradient: 'from-green-400 via-emerald-500 to-teal-600',
      textColor: 'text-white',
      borderColor: 'border-green-400/50',
      glow: 'shadow-green-500/25'
    });
  } else {
    badges.push({
      text: 'Newbie',
      icon: Zap,
      gradient: 'from-slate-400 via-gray-500 to-slate-600',
      textColor: 'text-white',
      borderColor: 'border-slate-400/50',
      glow: 'shadow-slate-500/25'
    });
  }
  
  return badges;
};

// Badge component
const UserBadge = ({ badge }: { badge: any }) => {
  const Icon = badge.icon;
  
  return (
    <div className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-medium border ${badge.borderColor} ${badge.glow} shadow-lg bg-gradient-to-r ${badge.gradient} ${badge.textColor} animate-pulse hover:animate-none transition-all duration-300`}>
      <Icon className="w-2.5 h-2.5" />
      <span className="font-semibold tracking-wide text-xs">{badge.text}</span>
    </div>
  );
};

export default function CommentSection({ movieId }: CommentSectionProps) {
  const { user, isAuthenticated } = useAuth()
  const [newComment, setNewComment] = useState('')
  const [page, setPage] = useState(1)
  const router = useRouter()

  // Use the useComments hook instead of direct API calls
  const {
    comments,
    total,
    loading: isLoading,
    isValidating,
    addComment,
    deleteComment,
    goToPage,
    currentPage,
    hasNextPage,
    setLimit,
    error: commentsError
  } = useComments(movieId, 1, 10)

  // Memoize formatted comments with user data
  const formattedComments = useMemo(() => {
    const formatted = comments.map(comment => ({
      ...comment,
      user: comment.user || {
        id: comment.userId,
        full_name: comment.userName || 'Người dùng ẩn danh',
        role: 'user' as const,
        email: '',
        createdAt: comment.createdAt
    }
    }));
    return formatted;
  }, [comments]);

  const loadMore = () => {
    if (hasNextPage && !isValidating) {
      const nextPage = currentPage + 1;
      goToPage(nextPage);
  }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isAuthenticated || !user) {
      toast.error('Vui lòng đăng nhập để bình luận')
      router.push('/login')
      return
    }
    
    if (!newComment.trim()) {
      toast.error('Vui lòng nhập nội dung bình luận')
      return
    }

    try {
      const result = await addComment(newComment.trim())
      if (result) {
        setNewComment('')
        toast.success('Bình luận đã được thêm!')
      }
    } catch (error) {
      console.error('Error adding comment:', error)
      toast.error('Không thể thêm bình luận')
    }
  }

  const handleDelete = async (commentId: number) => {
    if (!isAuthenticated || !user) {
      toast.error('Vui lòng đăng nhập để xóa bình luận')
      return
    }

    const comment = formattedComments.find(c => c.id === commentId)
    if (!comment) return

    if (comment.userId !== user.id && user.role !== 'admin') {
      toast.error('Bạn không có quyền xóa bình luận này')
      return
    }

    try {
      const success = await deleteComment(commentId)
      if (success) {
        toast.success('Bình luận đã được xóa!')
      }
    } catch (error) {
      console.error('Error deleting comment:', error)
      toast.error('Không thể xóa bình luận')
    }
  }

  const formatDate = (dateString: string) => {
    try { 
      return formatDistance(new Date(dateString), new Date(), { 
        addSuffix: true,
        locale: vi 
      })
    } catch { 
      return 'vừa xong' 
    }
  }

  const getUserInitial = (user: Comment['user']) => user?.full_name?.[0]?.toUpperCase() || 'U'

  // Show error state if there's an error loading comments
  if (commentsError) {
    return (
      <div className="max-w-4xl bg-gradient-to-br from-gray-800/60 to-gray-900/60 border border-gray-700 overflow-hidden rounded-lg mx-auto">
        <div className="flex items-center gap-2 p-4">
          <MessageCircle className="w-6 h-6 text-indigo-400" />
          <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-300 to-purple-300 bg-clip-text text-transparent">Bình luận</h2>
        </div>
        <div className="bg-red-500/10 border border-red-500/20 text-center p-8">
          <p className="text-red-400">Không thể tải bình luận. Vui lòng thử lại sau.</p>
        </div>
      </div>
    )
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="max-w-4xl bg-gradient-to-br from-gray-800/60 to-gray-900/60 border border-gray-700 overflow-hidden rounded-lg mx-auto">
        <div className="flex items-center gap-2 p-4">
          <MessageCircle className="w-6 h-6 text-indigo-400" />
          <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-300 to-purple-300 bg-clip-text text-transparent">Bình luận</h2>
        </div>
        <div className="space-y-4 p-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-gray-800/30 rounded-lg p-4">
              <div className="flex gap-4">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-16 w-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl bg-gradient-to-br from-gray-800/60 to-gray-900/60 border border-gray-700 overflow-hidden rounded-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-2 p-4">
        <MessageCircle className="w-6 h-6 text-indigo-400" />
        <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-300 to-purple-300 bg-clip-text text-transparent">Bình luận</h2>
        {total > 0 && (
          <span className="text-sm text-gray-400">({total})</span>
        )}
      </div>

      {/* Comment Form */}
      {isAuthenticated && user ? (
        <div className="p-4 border-b border-gray-700">
          <div className="flex gap-4">
            <Avatar className="w-10 h-10">
              <AvatarImage src={user.avatar_url} alt={user.full_name} />
              <AvatarFallback>{user.full_name?.[0] || 'U'}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <form onSubmit={handleSubmit}>
                <Textarea
                  placeholder="Chia sẻ suy nghĩ của bạn về bộ phim này..."
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  className="resize-none"
                />
                <div className="flex justify-end mt-2">
                  <Button 
                    type="submit" 
                    disabled={!newComment.trim()} 
                    className="bg-indigo-600 hover:bg-indigo-700"
                  >
                    Gửi
                  </Button>
                </div>
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
      {formattedComments.length > 0 ? (
        <div className="space-y-4 p-4">
          {formattedComments.map(comment => {
            const badges = getUserBadges(comment.user);
            
            return (
              <div key={comment.id} className="rounded-lg p-4 hover:bg-gray-800/40 transition-all duration-200 border border-transparent hover:border-gray-700/50">
                <div className="flex gap-4">
                  <Avatar className="w-10 h-10 ring-2 ring-gray-600 hover:ring-indigo-400 transition-all duration-200">
                    <AvatarImage src={comment.user?.avatar_url} alt={comment.user?.full_name || 'User'} />
                    <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-semibold">
                      {getUserInitial(comment.user)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex flex-col justify-center h-10 gap-0.5">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-medium bg-gradient-to-r from-indigo-200 to-purple-200 bg-clip-text text-transparent leading-tight">
                            {comment.user?.full_name || comment.userName || 'Người dùng ẩn danh'}
                          </h4>
                          <span className="text-xs text-gray-400 leading-tight">• {formatDate(comment.createdAt)}</span>
                        </div>
                        {/* User badges */}
                        <div className="flex flex-wrap gap-1">
                          {badges.map((badge, index) => (
                            <UserBadge key={index} badge={badge} />
                          ))}
                        </div>
                      </div>
                      {/* Delete button for comment owner or admin */}
                      {isAuthenticated && user && (comment.userId === user.id || user.role === 'admin') && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(comment.id)}
                          className="text-gray-400 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                        >
                          Xóa
                        </Button>
                      )}
                    </div>
                    <p className="text-gray-300">
                      {comment.comment}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
          
          {/* Load More Button */}
          {hasNextPage && (
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white hover:border-indigo-500 transition-all duration-200"
                onClick={loadMore}
                disabled={isValidating}
              >
                {isValidating ? (
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
        <div className="bg-gray-800/30 text-center p-8">
          <div className="flex flex-col items-center gap-4">
            <MessageCircle className="w-16 h-16 text-gray-500" />
            <p className="text-gray-400 text-lg">Chưa có bình luận nào. Hãy là người đầu tiên!</p>
          </div>
        </div>
      )}
    </div>
  )
}