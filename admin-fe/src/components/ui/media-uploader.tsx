"use client"

import { useState } from "react"
import { Upload, CheckCircle, AlertCircle } from "lucide-react"
import { Progress } from "./progress"
import { Button } from "./button"
import { mediaApi } from "@/services/api"
import { cn } from "@/lib/utils"
import axios from "axios"

interface MediaUploaderProps {
  movieId: number
  episodeId?: number
  fileType: "poster" | "backdrop" | "trailer" | "video" | "thumbnail"
  onUploadComplete: (url: string) => void
  onUploadError: (error: string) => void
  onUploadProgress?: (progress: number) => void
  accept?: string
  className?: string
}

export function MediaUploader({
  movieId,
  episodeId,
  fileType,
  onUploadComplete,
  onUploadError,
  onUploadProgress,
  accept = "image/*,video/*",
  className,
}: MediaUploaderProps) {
  const [file, setFile] = useState<File | null>(null)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState("")

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setStatus("idle")
      setProgress(0)
      setErrorMessage("")
    }
  }

  const uploadWithPresignedUrl = async () => {
    if (!file) return

    try {
      setStatus("uploading")
      setProgress(0)
      
      // Bước 1: Lấy presigned URL
      const presignedResponse = await mediaApi.getPresignedUrl({
        movieId: movieId || null,
        episodeId,
        fileType,
      })
      
      const { presignedUrl, contentType, cdnUrl, expiresIn } = presignedResponse.data
      
      // Bước 2: Upload trực tiếp lên storage
      await axios.put(presignedUrl, file, {
        headers: {
          "Content-Type": contentType || file.type,
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const currentProgress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
            setProgress(currentProgress)
            if (onUploadProgress) {
              onUploadProgress(currentProgress)
            }
          }
        }
      })
      
      // Xây dựng URL dựa trên cấu trúc mới
      let finalUrl = '';
      if (fileType === "poster" || fileType === "backdrop") {
        finalUrl = `${cdnUrl}movies/${movieId}/${fileType}.jpg`;
      } else if (fileType === "trailer") {
        finalUrl = `${cdnUrl}movies/${movieId}/trailer.mp4`;
      } else if (fileType === "video" && episodeId) {
        finalUrl = `${cdnUrl}episodes/${movieId}/${episodeId}/hls/master.m3u8`;
      } else if (fileType === "thumbnail" && episodeId) {
        finalUrl = `${cdnUrl}episodes/${movieId}/${episodeId}/thumbnail.jpg`;
      }
      
      setStatus("success")
      setProgress(100)
      onUploadComplete(finalUrl)
    } catch (error) {
      console.error("Upload error:", error)
      setStatus("error")
      setErrorMessage("Lỗi khi tải file lên")
      onUploadError(errorMessage)
    }
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center space-x-2">
        <input
          type="file"
          id={`file-${fileType}`}
          accept={accept}
          onChange={handleFileChange}
          className="hidden"
          disabled={status === "uploading"}
        />
        <label
          htmlFor={`file-${fileType}`}
          className="cursor-pointer flex items-center space-x-2 p-2 border border-dashed rounded-md hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          <Upload size={20} />
          <span>{file ? file.name : `Chọn file ${fileType}`}</span>
        </label>
        
        {file && status === "idle" && (
          <Button onClick={uploadWithPresignedUrl} size="sm">
            Tải lên
          </Button>
        )}
      </div>

      {status === "uploading" && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm">Đang tải lên...</span>
            <span className="text-sm font-medium">{progress}%</span>
          </div>
          <Progress value={progress} />
        </div>
      )}

      {status === "success" && (
        <div className="flex items-center text-green-500 space-x-2">
          <CheckCircle size={20} />
          <span>Tải lên thành công</span>
        </div>
      )}

      {status === "error" && (
        <div className="flex items-center text-red-500 space-x-2">
          <AlertCircle size={20} />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  )
} 