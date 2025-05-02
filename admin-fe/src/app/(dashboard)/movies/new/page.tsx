"use client"

import { Toaster } from "react-hot-toast"
import { Breadcrumb } from "@/components/ui/breadcrumb"
import { NewMovieForm } from "@/components/new-movie-form"

export default function NewMoviePage() {
  return (
    <div className="container mx-auto px-4 py-6">
      <Toaster />
      <Breadcrumb
        items={[
          { label: "Trang chủ", href: "/" },
          { label: "Quản lý phim", href: "/movies" },
          { label: "Thêm phim mới", href: "/movies/new" },
        ]}
      />
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Thêm Phim Mới</h1>
      </div>
      <NewMovieForm />
    </div>
  )
} 