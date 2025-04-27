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

  useEffect(() => {
    // Kiểm tra token từ cookie thay vì localStorage
    const token = Cookies.get("token")
    const loggedIn = !!token
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
    // Chỉ lưu token vào cookie, không lưu vào localStorage
    Cookies.set("token", token, {
      path: "/",
      expires: 1, // Hết hạn sau 1 ngày
      sameSite: "strict",
    })
    setIsLoggedIn(true)

    // Chuyển hướng đến trang chủ
    router.push("/")
  }

  const logout = () => {
    // Xóa token từ cookie, không cần xóa từ localStorage
    Cookies.remove("token", { path: "/" })
    setIsLoggedIn(false)

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

