"use client"

import { useState, useEffect } from "react"
import { toast } from "react-hot-toast"
import {
  Search,
  Trash2,
  Edit,
  Plus,
  Film,
  Save,
  X
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import { api, genreApi } from "@/services/api"

interface Genre {
  id: number
  name: string
}

interface EditDialogProps {
  isOpen: boolean
  onClose: () => void
  onSave: (name: string) => Promise<void>
  initialName?: string
  title: string
}

function EditDialog({ isOpen, onClose, onSave, initialName = "", title }: EditDialogProps) {
  const [name, setName] = useState(initialName)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    setName(initialName)
  }, [initialName])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error("Vui lòng nhập tên thể loại")
      return
    }
    
    try {
      setIsSubmitting(true)
      await onSave(name)
      onClose()
    } catch (error) {
      console.error("Error saving genre:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Nhập tên thể loại phim mới vào form dưới đây.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="py-4">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tên thể loại..."
              disabled={isSubmitting}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Đang lưu..." : "Lưu"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function GenresManagement() {
  const [genres, setGenres] = useState<Genre[]>([])
  const [filteredGenres, setFilteredGenres] = useState<Genre[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [editingGenre, setEditingGenre] = useState<Genre | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)

  // Fetch genres
  const fetchGenres = async () => {
    try {
      setIsLoading(true)
      const response = await genreApi.getAll()
      setGenres(response.data || [])
      setIsLoading(false)
    } catch (error) {
      console.error("Error fetching genres:", error)
      toast.error("Không thể tải danh sách thể loại")
      setIsLoading(false)
      setGenres([])
    }
  }

  useEffect(() => {
    fetchGenres()
  }, [])

  // Apply search filter
  useEffect(() => {
    let result = [...genres]
    
    if (searchTerm) {
      result = result.filter(genre => 
        genre.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    setFilteredGenres(result)
  }, [genres, searchTerm])

  // Handle create genre
  const handleCreateGenre = async (name: string) => {
    try {
      await genreApi.create({ name })
      toast.success("Đã thêm thể loại mới thành công")
      await fetchGenres()
    } catch (error: any) {
      if (error.response?.status === 400) {
        toast.error("Thể loại này đã tồn tại")
      } else {
        toast.error("Không thể thêm thể loại. Vui lòng thử lại.")
      }
      throw error
    }
  }

  // Handle update genre
  const handleUpdateGenre = async (name: string) => {
    if (!editingGenre) return
    
    try {
      await genreApi.update(editingGenre.id, { name })
      toast.success("Đã cập nhật thể loại thành công")
      await fetchGenres()
    } catch (error: any) {
      if (error.response?.status === 400) {
        toast.error("Thể loại này đã tồn tại")
      } else {
        toast.error("Không thể cập nhật thể loại. Vui lòng thử lại.")
      }
      throw error
    }
  }

  // Handle delete genre
  const handleDeleteGenre = async (id: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa thể loại này?")) {
      return
    }
    
    try {
      await genreApi.delete(id)
      toast.success("Đã xóa thể loại thành công")
      await fetchGenres()
    } catch (error: any) {
      if (error.response?.status === 400) {
        toast.error("Không thể xóa thể loại này vì đang được sử dụng bởi một số phim")
      } else {
        toast.error("Không thể xóa thể loại. Vui lòng thử lại.")
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Quản lý Thể loại</h1>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Thêm Thể loại
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Tìm kiếm</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <Input
                  placeholder="Tìm kiếm thể loại..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={() => setSearchTerm("")}
            >
              Xóa tìm kiếm
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Genres table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách thể loại</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Đang tải dữ liệu...</div>
          ) : filteredGenres.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Không có thể loại nào</p>
              <Button 
                className="mt-4"
                onClick={() => setIsAddDialogOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Thêm Thể loại
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Tên thể loại</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredGenres.map((genre) => (
                  <TableRow key={genre.id}>
                    <TableCell>{genre.id}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Film className="text-gray-400" size={16} />
                        <span>{genre.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingGenre(genre)}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Sửa
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteGenre(genre.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Xóa
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add genre dialog */}
      <EditDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onSave={handleCreateGenre}
        title="Thêm thể loại mới"
      />

      {/* Edit genre dialog */}
      <EditDialog
        isOpen={!!editingGenre}
        onClose={() => setEditingGenre(null)}
        onSave={handleUpdateGenre}
        initialName={editingGenre?.name}
        title="Chỉnh sửa thể loại"
      />
    </div>
  )
} 