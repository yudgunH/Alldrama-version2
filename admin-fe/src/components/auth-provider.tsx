"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Cookies from "js-cookie"

interface AuthContextType {
  isLoggedIn: boolean
  login: (token: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  // Hàm kiểm tra token hợp lệ
  const verifyToken = () => {
    try {
      const token = Cookies.get("token")
      if (!token) return false
      
      // Kiểm tra nếu token đã hết hạn
      // Nếu có thể decode jwt, có thể kiểm tra exp
      // Đây chỉ là kiểm tra đơn giản về sự tồn tại của token
      return true
    } catch (error) {
      console.error("Lỗi xác thực token:", error)
      return false
    }
  }

  useEffect(() => {
    // Kiểm tra token có hợp lệ không
    const loggedIn = verifyToken()
    setIsLoggedIn(loggedIn)

    // Nếu chưa đăng nhập và không ở trang login, chuyển hướng đến trang login
    if (!loggedIn && pathname !== "/login") {
      router.push("/login")
    }

    // Nếu đã đăng nhập và đang ở trang login, chuyển hướng đến trang chủ
    if (loggedIn && pathname === "/login") {
      router.push("/")
    }
  }, [pathname, router])

  const login = (token: string) => {
    if (!token) {
      console.error("Token không hợp lệ")
      return
    }

    // Lưu token vào cookie với các tùy chọn bảo mật
    Cookies.set("token", token, {
      path: "/",
      expires: 1, // Hết hạn sau 1 ngày
      secure: process.env.NODE_ENV === "production", // Chỉ gửi qua HTTPS trong môi trường production
      sameSite: "strict",
    })
    
    setIsLoggedIn(true)
    console.log("Đăng nhập thành công, token đã được lưu")

    // Chuyển hướng đến trang chủ
    router.push("/")
  }

  const logout = () => {
    // Xóa token từ cookie
    Cookies.remove("token", { path: "/" })
    setIsLoggedIn(false)
    console.log("Đã đăng xuất, token đã bị xóa")

    // Chuyển hướng đến trang đăng nhập
    router.push("/login")
  }

  return <AuthContext.Provider value={{ isLoggedIn, login, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

