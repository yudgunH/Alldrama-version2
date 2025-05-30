import { CommentsManagement } from "@/components/comments-management"

export const metadata = {
  title: "Quản lý Bình luận | Alldrama Admin",
  description: "Quản lý bình luận của người dùng trên Alldrama",
}

export default function CommentsPage() {
  return (
    <div className="container mx-auto py-6">
      <CommentsManagement />
    </div>
  )
} 