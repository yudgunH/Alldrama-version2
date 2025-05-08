'use client'

import { ReactNode, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/api/useAuth'
import { toast } from 'react-hot-toast'

interface ProtectedRouteProps {
  children: ReactNode
  adminOnly?: boolean
  redirectTo?: string
}

export function ProtectedRoute({ 
  children, 
  adminOnly = false, 
  redirectTo = '/login' 
}: ProtectedRouteProps) {
  const { isAuthenticated, isAdmin, loading, user } = useAuth()
  const router = useRouter()
  
  useEffect(() => {
    // Nếu không đang tải và không xác thực => chuyển hướng
    if (!loading && !isAuthenticated) {
      toast.error('Vui lòng đăng nhập để tiếp tục')
      router.push(redirectTo)
      return
    }
    
    // Nếu yêu cầu admin và người dùng không phải admin
    if (!loading && adminOnly && !isAdmin) {
      toast.error('Bạn không có quyền truy cập trang này')
      router.push('/')
      return
    }
  }, [isAuthenticated, isAdmin, loading, adminOnly, redirectTo, router, user])
  
  // Hiển thị trạng thái loading
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-amber-500 mx-auto"></div>
          <p className="mt-4 text-white">Đang tải...</p>
        </div>
      </div>
    )
  }
  
  // Chỉ render children nếu:
  // 1. Người dùng đã xác thực
  // 2. Không yêu cầu admin HOẶC người dùng là admin
  if (isAuthenticated && (!adminOnly || isAdmin)) {
    return <>{children}</>
  }
  
  // Fallback an toàn - không hiển thị nội dung
  return null
}

export function AdminRoute({ children, redirectTo = '/' }: Omit<ProtectedRouteProps, 'adminOnly'>) {
  return <ProtectedRoute adminOnly redirectTo={redirectTo}>{children}</ProtectedRoute>
} 