"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MoviesManagement } from "@/components/movies-management"

export default function MoviesPage() {
  const router = useRouter()
  
  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Quản lý phim</h1>
        <Button onClick={() => router.push("/movies/new")}>
          <Plus className="mr-2 h-4 w-4" /> Thêm phim mới
        </Button>
      </div>
      <MoviesManagement />
    </div>
  )
}

