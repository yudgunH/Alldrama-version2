"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import axios from "axios"
import Cookies from "js-cookie"
import { Toaster, toast } from "react-hot-toast"
import { Loader2 } from "lucide-react"

interface User {
  id: number
  email: string
  username: string
  registrationDate: string
  isAdmin: boolean
}

interface ApiUser {
  id: number
  email: string
  username: string
  created_at: string
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
      const token = Cookies.get("token")
      const response = await axios.get("https://alldramaz.com/api/customers/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true,
      })

      // Chuyển đổi dữ liệu từ API sang định dạng của component
      const transformedUsers: User[] = response.data.map((user: ApiUser) => ({
        id: user.id,
        email: user.email,
        username: user.username || user.email.split("@")[0], // Sử dụng phần đầu của email nếu không có username
        registrationDate: new Date(user.created_at).toISOString().split("T")[0], // Format ngày tháng
        isAdmin: user.role === "admin",
      }))

      setUsers(transformedUsers)
    } catch (err) {
      console.error("Error fetching users:", err)
      setError("Không thể tải danh sách người dùng. Vui lòng thử lại sau.")
      toast.error("Lỗi khi tải danh sách người dùng")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteUser = async (id: number) => {
    try {
      const token = Cookies.get("token")
      await axios.delete(`https://alldramaz.com/api/customers/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true,
      })

      setUsers(users.filter((user) => user.id !== id))
      toast.success("Xóa người dùng thành công")
    } catch (err) {
      console.error("Error deleting user:", err)
      toast.error("Lỗi khi xóa người dùng")
    }
  }

  const handleToggleAdmin = async (id: number) => {
    try {
      const user = users.find((u) => u.id === id)
      if (!user) return

      const token = Cookies.get("token")
      await axios.put(
        `https://alldramaz.com/api/customers/${id}`,
        {
          role: user.isAdmin ? "user" : "admin",
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          withCredentials: true,
        },
      )

      setUsers(users.map((user) => (user.id === id ? { ...user, isAdmin: !user.isAdmin } : user)))
      toast.success(`Người dùng đã được ${user.isAdmin ? "hủy quyền" : "cấp quyền"} admin`)
    } catch (err) {
      console.error("Error updating user role:", err)
      toast.error("Lỗi khi cập nhật quyền người dùng")
    }
  }

  const filteredUsers = users.filter(
    (user) =>
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase()),
  )

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
        <Button onClick={fetchUsers}>Làm mới</Button>
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
                  {searchTerm ? "Không tìm thấy người dùng phù hợp" : "Chưa có người dùng nào"}
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.id}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.username}</TableCell>
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

