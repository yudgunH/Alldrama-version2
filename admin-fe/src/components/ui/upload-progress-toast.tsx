"use client"

import { useState, useEffect } from "react"
import { X, Upload, Settings, CheckCircle, AlertCircle, Clock } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface UploadStep {
  id: string
  name: string
  status: "pending" | "processing" | "completed" | "error"
  progress?: number
  startTime?: number
  endTime?: number
}

interface UploadProgressToastProps {
  isVisible: boolean
  title: string
  currentStep: string
  progress: number
  steps: UploadStep[]
  onClose: () => void
  estimatedTimeRemaining?: string
  showCloseButton?: boolean
  isCompact?: boolean
}

export function UploadProgressToast({
  isVisible,
  title,
  currentStep,
  progress,
  steps,
  onClose,
  estimatedTimeRemaining,
  showCloseButton = false,
  isCompact = false
}: UploadProgressToastProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  
  const isCompleted = progress >= 100
  const hasError = steps.some(step => step.status === "error")
  
  const getStepIcon = (step: UploadStep) => {
    switch (step.status) {
      case "completed":
        return <CheckCircle size={16} className="text-green-500" />
      case "processing":
        return <Clock size={16} className="text-blue-500 animate-spin" />
      case "error":
        return <AlertCircle size={16} className="text-red-500" />
      default:
        return <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
    }
  }
  
  const formatDuration = (startTime?: number, endTime?: number) => {
    if (!startTime) return ""
    const duration = (endTime || Date.now()) - startTime
    const seconds = Math.floor(duration / 1000)
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    return `${minutes}m ${seconds % 60}s`
  }

  if (!isVisible) return null

  const content = (
    <Card className={`shadow-lg border-l-4 ${
      hasError ? 'border-l-red-500' : 
      isCompleted ? 'border-l-green-500' : 
      'border-l-blue-500'
    } ${isCompact ? 'shadow-none border border-gray-200' : ''}`}>
      <CardContent className={isCompact ? "p-3" : "p-4"}>
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            {hasError ? (
              <AlertCircle size={20} className="text-red-500" />
            ) : isCompleted ? (
              <CheckCircle size={20} className="text-green-500" />
            ) : (
              <Upload size={20} className="text-blue-500" />
            )}
            <h4 className="font-medium text-sm text-gray-900">{title}</h4>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-6 w-6 p-0"
            >
              <Settings size={14} />
            </Button>
            {(showCloseButton || isCompleted || hasError) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-6 w-6 p-0"
              >
                <X size={14} />
              </Button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-3">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>{currentStep}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress 
            value={progress} 
            className={`h-2 ${
              hasError ? '[&>div]:bg-red-500' : 
              isCompleted ? '[&>div]:bg-green-500' : 
              '[&>div]:bg-blue-500'
            }`}
          />
          {estimatedTimeRemaining && !isCompleted && !hasError && (
            <p className="text-xs text-gray-500 mt-1">
              Còn lại: {estimatedTimeRemaining}
            </p>
          )}
        </div>

        {/* Steps Detail */}
        {isExpanded && (
          <div className="space-y-2">
            <div className="text-xs font-medium text-gray-700 mb-2">
              Chi tiết tiến trình:
            </div>
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  {getStepIcon(step)}
                  <span className={`${
                    step.status === "completed" ? "text-green-700" :
                    step.status === "processing" ? "text-blue-700" :
                    step.status === "error" ? "text-red-700" :
                    "text-gray-500"
                  }`}>
                    {step.name}
                    {step.status === "processing" && step.progress && (
                      <span className="ml-1">({step.progress}%)</span>
                    )}
                  </span>
                </div>
                <span className="text-gray-400">
                  {formatDuration(step.startTime, step.endTime)}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Success/Error Message */}
        {isCompleted && (
          <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded-md">
            <p className="text-xs text-green-700 font-medium">
              ✅ Upload và xử lý video hoàn thành!
            </p>
          </div>
        )}

        {hasError && (
          <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-md">
            <p className="text-xs text-red-700 font-medium">
              ❌ Có lỗi xảy ra trong quá trình xử lý
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )

  if (isCompact) {
    return content
  }

  return (
    <div className="fixed top-4 right-4 z-50 w-96 animate-in slide-in-from-right duration-300">
      {content}
    </div>
  )
} 