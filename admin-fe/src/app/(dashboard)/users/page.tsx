"use client"

import { Suspense } from "react"
import { UsersManagement } from "@/components/users-management"
import { Loader2 } from "lucide-react"
import { ErrorBoundary } from "react-error-boundary"

function FallbackComponent({ error }: { error: Error }) {
  return (
    <div className="p-6 bg-red-50 border border-red-200 rounded-md text-red-700">
      <h2 className="text-lg font-semibold mb-2">Đã xảy ra lỗi:</h2>
      <p>{error.message}</p>
    </div>
  )
}

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center h-[50vh]">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <span className="ml-2">Đang tải dữ liệu...</span>
    </div>
  )
}

export default function UsersPage() {
  return (
    <ErrorBoundary FallbackComponent={FallbackComponent}>
      <Suspense fallback={<LoadingFallback />}>
        <UsersManagement />
      </Suspense>
    </ErrorBoundary>
  )
}

