"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { api, movieApi } from "@/services/api"
import { toast } from "react-hot-toast"

interface MovieStatisticsProps {
  movieId: number
}

export function MovieStatistics({ movieId }: MovieStatisticsProps) {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        setLoading(true)
        const response = await movieApi.getStatistics(movieId)
        setStats(response.data)
        setLoading(false)
      } catch (error) {
        console.error("Error fetching statistics:", error)
        toast.error("Không thể tải thống kê phim")
        setLoading(false)
      }
    }

    fetchStatistics()
  }, [movieId])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p>Đang tải thống kê...</p>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <p>Không có thông tin thống kê</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Thống kê xem phim */}
      <Card>
        <CardHeader>
          <CardTitle>Thống kê lượt xem</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-secondary/20 p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">Tổng lượt xem</p>
              <p className="text-2xl font-bold">{stats.totalViews?.toLocaleString() || 0}</p>
            </div>
            <div className="bg-secondary/20 p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">Lượt xem hôm nay</p>
              <p className="text-2xl font-bold">{stats.todayViews?.toLocaleString() || 0}</p>
            </div>
            <div className="bg-secondary/20 p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">Lượt xem tuần này</p>
              <p className="text-2xl font-bold">{stats.weeklyViews?.toLocaleString() || 0}</p>
            </div>
            <div className="bg-secondary/20 p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">Lượt xem tháng này</p>
              <p className="text-2xl font-bold">{stats.monthlyViews?.toLocaleString() || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Thống kê tập phim */}
      <Card>
        <CardHeader>
          <CardTitle>Thống kê tập phim</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-secondary/20 p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">Tổng số tập</p>
              <p className="text-2xl font-bold">{stats.totalEpisodes || 0}</p>
            </div>
            <div className="bg-secondary/20 p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">Tập đã xử lý</p>
              <p className="text-2xl font-bold">{stats.processedEpisodes || 0}</p>
            </div>
            <div className="bg-secondary/20 p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">Tập đang xử lý</p>
              <p className="text-2xl font-bold">{stats.processingEpisodes || 0}</p>
            </div>
            <div className="bg-secondary/20 p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">Tỷ lệ hoàn thành</p>
              <p className="text-2xl font-bold">
                {stats.totalEpisodes > 0
                  ? `${Math.round((stats.processedEpisodes / stats.totalEpisodes) * 100)}%`
                  : "0%"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Thống kê đánh giá */}
      <Card>
        <CardHeader>
          <CardTitle>Thống kê đánh giá</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-secondary/20 p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">Đánh giá trung bình</p>
              <p className="text-2xl font-bold">{stats.averageRating?.toFixed(1) || 0} ★</p>
            </div>
            <div className="bg-secondary/20 p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">Tổng lượt đánh giá</p>
              <p className="text-2xl font-bold">{stats.totalRatings?.toLocaleString() || 0}</p>
            </div>
            <div className="bg-secondary/20 p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">Đánh giá cao nhất</p>
              <p className="text-2xl font-bold">{stats.highestRatedEpisode?.rating || 0} ★</p>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.highestRatedEpisode?.title || "Không có"}
              </p>
            </div>
            <div className="bg-secondary/20 p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">Đánh giá thấp nhất</p>
              <p className="text-2xl font-bold">{stats.lowestRatedEpisode?.rating || 0} ★</p>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.lowestRatedEpisode?.title || "Không có"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Tập phim phổ biến nhất */}
      <Card>
        <CardHeader>
          <CardTitle>Tập phim phổ biến nhất</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.popularEpisodes && stats.popularEpisodes.length > 0 ? (
            <div className="space-y-4">
              {stats.popularEpisodes.map((episode: any, index: number) => (
                <div key={episode.id} className="flex items-center gap-4">
                  <div className="bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-grow">
                    <p className="font-medium">
                      Tập {episode.episodeNumber}: {episode.title}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {episode.views?.toLocaleString() || 0} lượt xem • {episode.rating} ★
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">Chưa có dữ liệu</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 