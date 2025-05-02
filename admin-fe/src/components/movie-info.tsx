"use client"

import { Movie } from "@/models"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDate } from "@/lib/utils"

interface MovieInfoProps {
  movie: Movie
}

export function MovieInfo({ movie }: MovieInfoProps) {
  return (
    <div className="space-y-6">
      {/* Mô tả */}
      <Card>
        <CardHeader>
          <CardTitle>Mô tả</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{movie.summary || "Chưa có mô tả cho phim này."}</p>
        </CardContent>
      </Card>
      
      {/* Thông tin chi tiết */}
      <Card>
        <CardHeader>
          <CardTitle>Thông tin chi tiết</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between border-b pb-2">
                <span className="font-medium">ID phim:</span>
                <span>{movie.id}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="font-medium">Số tập:</span>
                <span>{movie.totalEpisodes || 0}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="font-medium">Thời lượng:</span>
                <span>{movie.duration} phút</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="font-medium">Năm phát hành:</span>
                <span>{movie.releaseYear}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="font-medium">Lượt xem:</span>
                <span>{movie.views?.toLocaleString() || 0}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="font-medium">Đánh giá:</span>
                <span>{movie.rating} ★</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between border-b pb-2">
                <span className="font-medium">Ngày tạo:</span>
                <span>{movie.createdAt ? formatDate(movie.createdAt) : "-"}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="font-medium">Cập nhật cuối:</span>
                <span>{movie.updatedAt ? formatDate(movie.updatedAt) : "-"}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="font-medium">Trạng thái:</span>
                <span>{movie.isProcessed === false ? "Đang xử lý" : "Hoàn thành"}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="font-medium">URL Poster:</span>
                <span className="truncate max-w-[200px]" title={movie.posterUrl || "-"}>
                  {movie.posterUrl ? "✓" : "-"}
                </span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="font-medium">URL Backdrop:</span>
                <span className="truncate max-w-[200px]" title={movie.backdropUrl || "-"}>
                  {movie.backdropUrl ? "✓" : "-"}
                </span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="font-medium">URL Trailer:</span>
                <span className="truncate max-w-[200px]" title={movie.trailerUrl || "-"}>
                  {movie.trailerUrl ? "✓" : "-"}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Thể loại */}
      <Card>
        <CardHeader>
          <CardTitle>Thể loại</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {movie.genres && movie.genres.length > 0 ? (
              movie.genres.map((genre) => (
                <span
                  key={genre.id}
                  className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm"
                >
                  {genre.name}
                </span>
              ))
            ) : (
              <p className="text-muted-foreground">Chưa có thể loại nào</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 