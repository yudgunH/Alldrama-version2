"use client"

import { Toaster } from "react-hot-toast"
import { Breadcrumb } from "@/components/ui/breadcrumb"
import { MoviesManagement } from "@/components/movies-management"

export default function MoviesPage() {
  return (
    <div className="container mx-auto px-4 py-6">
      <Toaster />
      <Breadcrumb
        items={[
          { label: "Trang chủ", href: "/" },
          { label: "Quản lý phim", href: "/movies" },
        ]}
      />
      <MoviesManagement />
    </div>
  )
} 