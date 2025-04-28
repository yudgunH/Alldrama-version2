"use client"

import { useEffect, useRef, useState } from "react"
import type Hls from "hls.js"
import { cn } from "@/lib/utils"

interface HLSPlayerProps {
  src: string
  className?: string
  poster?: string
  autoPlay?: boolean
  controls?: boolean
  width?: number | string
  height?: number | string
}

export function HLSPlayer({
  src,
  className,
  poster,
  autoPlay = false,
  controls = true,
  width = "100%",
  height = "auto",
}: HLSPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSupported, setIsSupported] = useState(true)

  useEffect(() => {
    const videoElement = videoRef.current
    if (!videoElement) return

    // Lazy load HLS.js dynamically
    import("hls.js").then((HlsModule) => {
      const Hls = HlsModule.default

      // Kiểm tra HLS.js có được hỗ trợ không
      if (!Hls.isSupported()) {
        setIsSupported(false)
        // Nếu trình duyệt hỗ trợ HLS (như Safari), vẫn có thể sử dụng
        if (videoElement.canPlayType("application/vnd.apple.mpegurl")) {
          videoElement.src = src
          return
        } else {
          setError("Trình duyệt của bạn không hỗ trợ phát video HLS")
          return
        }
      }

      // Tạo instance HLS.js
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
      })

      try {
        // Tải và parse m3u8 file
        hls.loadSource(src)
        hls.attachMedia(videoElement)

        // Xử lý sự kiện
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          if (autoPlay) {
            videoElement.play().catch((e) => {
              console.error("Error playing video:", e)
            })
          }
        })

        hls.on(Hls.Events.ERROR, (_event: any, data: { fatal: boolean; type: string }) => {
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                console.error("Network error:", data)
                hls.startLoad() // Thử tải lại
                break
              case Hls.ErrorTypes.MEDIA_ERROR:
                console.error("Media error:", data)
                hls.recoverMediaError() // Thử khôi phục
                break
              default:
                console.error("Unrecoverable error:", data)
                hls.destroy()
                setError("Không thể phát video này")
                break
            }
          }
        })

        // Cleanup khi component unmount
        return () => {
          hls.destroy()
        }
      } catch (e) {
        console.error("Error setting up HLS player:", e)
        setError("Không thể khởi tạo trình phát video")
      }
    }).catch(error => {
      console.error("Failed to load HLS.js:", error)
      setError("Không thể tải thư viện phát video")
    })
  }, [src, autoPlay])

  // Hiển thị lỗi nếu có
  if (error) {
    return <div className="bg-red-100 p-4 rounded text-red-700">{error}</div>
  }

  // Hiển thị thông báo nếu không hỗ trợ
  if (!isSupported) {
    return (
      <div className="bg-yellow-100 p-4 rounded text-yellow-700">
        Trình duyệt của bạn không hỗ trợ phát video HLS.{" "}
        <a href={src} target="_blank" rel="noopener noreferrer" className="underline">
          Tải video
        </a>
      </div>
    )
  }

  return (
    <video
      ref={videoRef}
      className={cn("rounded-lg", className)}
      poster={poster}
      controls={controls}
      width={width}
      height={height}
      playsInline
    />
  )
} 