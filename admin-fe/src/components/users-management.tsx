"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Toaster, toast } from "react-hot-toast"
import { Loader2 } from "lucide-react"
import { userApi } from "@/services/api"

interface User {
  id: number
  email: string
  full_name: string
  registrationDate: string
  isAdmin: boolean
}

interface ApiUser {
  id: number
  email: string
  full_name: string
  username?: string
  created_at: string
  createdAt: string
  role: string
}

export function UsersManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    setIsLoading(true)
    setError(null)
    try {
      console.log("Đang tải danh sách người dùng...")
      // Sử dụng userApi đã cấu hình
      const response = await userApi.getAll()

      console.log("Phản hồi API:", response.data)
      
      // Kiểm tra cấu trúc dữ liệu trả về từ API
      let userData: ApiUser[];
      if (Array.isArray(response.data)) {
        userData = response.data;
      } else if (response.data.users && Array.isArray(response.data.users)) {
        userData = response.data.users;
      } else {
        throw new Error("Cấu trúc dữ liệu không đúng định dạng");
      }

      console.log("Dữ liệu người dùng:", userData)

      // Chuyển đổi dữ liệu từ API sang định dạng của component
      const transformedUsers: User[] = userData.map((user: ApiUser) => ({
        id: user.id,
        email: user.email,
        full_name: user.full_name || user.username || user.email.split("@")[0],
        registrationDate: new Date(user.created_at || user.createdAt).toISOString().split("T")[0], // Format ngày tháng
        isAdmin: user.role === "admin",
      }))

      setUsers(transformedUsers)
      console.log("Đã tải xong danh sách người dùng:", transformedUsers.length)
    } catch (err: any) {
      console.error("Lỗi khi tải danh sách người dùng:", err)
      
      // Hiển thị thông báo lỗi chi tiết hơn
      const errorMessage = err.response?.data?.message || err.message || "Không thể tải danh sách người dùng. Vui lòng thử lại sau."
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteUser = async (id: number) => {
    try {
      // Xác nhận trước khi xóa
      if (!confirm("Bạn có chắc chắn muốn xóa người dùng này? Hành động này không thể hoàn tác.")) {
        return;
      }
      
      await userApi.delete(id)
      setUsers(users.filter((user) => user.id !== id))
      toast.success("Xóa người dùng thành công")
    } catch (err: any) {
      console.error("Lỗi khi xóa người dùng:", err)
      const errorMessage = err.response?.data?.message || err.message || "Lỗi khi xóa người dùng"
      toast.error(errorMessage)
    }
  }

  const handleToggleAdmin = async (id: number) => {
    try {
      const user = users.find((u) => u.id === id)
      if (!user) return

      const newRole = user.isAdmin ? "user" : "admin"
      
      await userApi.update(id, {
        role: newRole
      })

      setUsers(users.map((user) => (user.id === id ? { ...user, isAdmin: !user.isAdmin } : user)))
      toast.success(`Người dùng đã được ${user.isAdmin ? "hủy quyền" : "cấp quyền"} admin`)
    } catch (err: any) {
      console.error("Lỗi khi cập nhật quyền người dùng:", err)
      const errorMessage = err.response?.data?.message || err.message || "Lỗi khi cập nhật quyền người dùng"
      toast.error(errorMessage)
    }
  }

  // Tìm kiếm người dùng
  const filteredUsers = users.filter(
    (user) =>
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.full_name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Nếu không tìm thấy người dùng, hiển thị thông báo phù hợp
  const noUsersMessage = searchTerm 
    ? "Không tìm thấy người dùng phù hợp với từ khóa tìm kiếm" 
    : "Chưa có người dùng nào trong hệ thống";

  return (
    <div className="container mx-auto p-6 space-y-4">
      <Toaster />
      <h1 className="text-3xl font-bold">Quản lý Người dùng</h1>

      <div className="flex justify-between items-center">
        <Input
          type="text"
          placeholder="Tìm kiếm theo email hoặc tên người dùng..."
          value={searchTerm}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Button onClick={fetchUsers} disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang tải...
            </>
          ) : (
            'Làm mới'
          )}
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Đang tải dữ liệu...</span>
        </div>
      ) : error ? (
        <div className="p-4 border border-red-300 bg-red-50 text-red-700 rounded-md">{error}</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Tên người dùng</TableHead>
              <TableHead>Ngày đăng ký</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10">
                  {noUsersMessage}
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.id}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.full_name}</TableCell>
                  <TableCell>{user.registrationDate}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${user.isAdmin ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"}`}
                    >
                      {user.isAdmin ? "Admin" : "Người dùng"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" onClick={() => handleToggleAdmin(user.id)} className="mr-2">
                      {user.isAdmin ? "Hủy quyền Admin" : "Cấp quyền Admin"}
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDeleteUser(user.id)}>
                      Xóa
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      )}
    </div>
  )
}

