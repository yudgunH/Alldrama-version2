"use client"

import { useState, useEffect } from "react"
import { ChevronDown, ChevronUp, X, Minimize2, Maximize2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { UploadProgressToast } from "./upload-progress-toast"

export interface UploadProgressData {
  id: string
  title: string
  currentStep: string
  progress: number
  steps: Array<{
    id: string
    name: string
    status: "pending" | "processing" | "completed" | "error"
    progress?: number
    startTime?: number
    endTime?: number
  }>
  estimatedTimeRemaining?: string
  isCompleted: boolean
  hasError: boolean
}

interface UploadProgressManagerProps {
  uploads: UploadProgressData[]
  onRemoveUpload: (id: string) => void
  onClearCompleted: () => void
}

export function UploadProgressManager({
  uploads,
  onRemoveUpload,
  onClearCompleted
}: UploadProgressManagerProps) {
  const [isMinimized, setIsMinimized] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  
  const activeUploads = uploads.filter(upload => !upload.isCompleted && !upload.hasError)
  const completedUploads = uploads.filter(upload => upload.isCompleted)
  const errorUploads = uploads.filter(upload => upload.hasError)
  
  // Tự động hiển thị khi có upload mới
  useEffect(() => {
    if (uploads.length > 0 && !isVisible) {
      setIsVisible(true)
    }
  }, [uploads.length])
  
  // Tự động ẩn khi không còn upload nào
  useEffect(() => {
    if (uploads.length === 0) {
      setIsVisible(false)
    }
  }, [uploads.length])

  if (!isVisible || uploads.length === 0) {
    return (
      <>
        {uploads.length > 0 && (
          <Button
            onClick={() => setIsVisible(true)}
            className="fixed bottom-4 right-4 z-50 h-12 w-12 rounded-full shadow-lg"
            size="sm"
          >
            {uploads.length}
          </Button>
        )}
      </>
    )
  }

  return (
    <div className="fixed top-4 right-4 z-50 w-96 max-h-[80vh] animate-in slide-in-from-right duration-300">
      <Card className="shadow-lg border border-gray-200">
        <CardContent className="p-0">
          {/* Header */}
          <div className="flex items-center justify-between p-3 bg-gray-50 border-b">
            <div className="flex items-center space-x-2">
              <h3 className="font-medium text-sm text-gray-900">
                Tiến trình upload ({uploads.length})
              </h3>
              {activeUploads.length > 0 && (
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                  {activeUploads.length} đang xử lý
                </span>
              )}
              {completedUploads.length > 0 && (
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                  {completedUploads.length} hoàn thành
                </span>
              )}
              {errorUploads.length > 0 && (
                <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                  {errorUploads.length} lỗi
                </span>
              )}
            </div>
            <div className="flex items-center space-x-1">
              {completedUploads.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClearCompleted}
                  className="h-6 px-2 text-xs"
                >
                  Xóa hoàn thành
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(!isMinimized)}
                className="h-6 w-6 p-0"
              >
                {isMinimized ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsVisible(false)}
                className="h-6 w-6 p-0"
              >
                <X size={14} />
              </Button>
            </div>
          </div>

          {/* Content */}
          {!isMinimized && (
            <div className="max-h-[60vh] overflow-y-auto">
              {uploads.length === 0 ? (
                <div className="p-4 text-center text-gray-500 text-sm">
                  Không có tiến trình nào
                </div>
              ) : (
                <div className="space-y-2 p-2">
                  {uploads.map((upload) => (
                    <div key={upload.id} className="border rounded-lg">
                      <UploadProgressToast
                        isVisible={true}
                        title={upload.title}
                        currentStep={upload.currentStep}
                        progress={upload.progress}
                        steps={upload.steps}
                        estimatedTimeRemaining={upload.estimatedTimeRemaining}
                        onClose={() => onRemoveUpload(upload.id)}
                        showCloseButton={upload.isCompleted || upload.hasError}
                        isCompact={true}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 