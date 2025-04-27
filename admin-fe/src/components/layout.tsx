"use client"

import { Button } from "@/components/ui/button"
import { BarChart3, DollarSign, Film, LogOut, MessageSquare, Settings, Users } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { useRouter, usePathname } from "next/navigation"
import type React from "react"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  const handleLogout = () => {
    logout()
  }

  const handleNavigation = (path: string) => {
    router.push(path)
  }

  const isActive = (path: string) => {
    return pathname === path
  }

  return (
    <div className="grid lg:grid-cols-[280px_1fr]">
      <aside className="border-r bg-background/50 backdrop-blur">
        <div className="flex h-16 items-center gap-2 border-b px-6">
          <Settings className="h-6 w-6" />
          <span className="font-bold">Admin Dashboard</span>
        </div>
        <nav className="space-y-2 px-2 py-4">
          <Button
            variant={isActive("/") ? "default" : "ghost"}
            className="w-full justify-start gap-2"
            onClick={() => handleNavigation("/")}
          >
            <BarChart3 className="h-4 w-4" />
            Dashboard
          </Button>
          <Button
            variant={isActive("/movies") ? "default" : "ghost"}
            className="w-full justify-start gap-2"
            onClick={() => handleNavigation("/movies")}
          >
            <Film className="h-4 w-4" />
            Movies
          </Button>
          <Button
            variant={isActive("/comments") ? "default" : "ghost"}
            className="w-full justify-start gap-2"
            onClick={() => handleNavigation("/comments")}
          >
            <MessageSquare className="h-4 w-4" />
            Comments
          </Button>
          <Button
            variant={isActive("/users") ? "default" : "ghost"}
            className="w-full justify-start gap-2"
            onClick={() => handleNavigation("/users")}
          >
            <Users className="h-4 w-4" />
            Users
          </Button>
          <Button
            variant={isActive("/ads") ? "default" : "ghost"}
            className="w-full justify-start gap-2"
            onClick={() => handleNavigation("/ads")}
          >
            <DollarSign className="h-4 w-4" />
            Ads
          </Button>
          <Button
            variant={isActive("/settings") ? "default" : "ghost"}
            className="w-full justify-start gap-2"
            onClick={() => handleNavigation("/settings")}
          >
            <Settings className="h-4 w-4" />
            Settings
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 text-red-500 hover:text-red-600 hover:bg-red-500/10"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            Đăng xuất
          </Button>
        </nav>
      </aside>
      <main className="p-6">{children}</main>
    </div>
  )
}

