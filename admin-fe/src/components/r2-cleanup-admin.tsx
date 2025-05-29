"use client"

import { useState } from "react"
import { toast } from "react-hot-toast"
import { Trash2, RefreshCw, Search, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"

import { mediaApi } from "@/services/api"

export function R2CleanupAdmin() {
  const [isLoading, setIsLoading] = useState(false)
  const [folderPath, setFolderPath] = useState("")
  const [filePath, setFilePath] = useState("")
  const [batchPaths, setBatchPaths] = useState("")
  const [results, setResults] = useState<any[]>([])

  // Xóa folder riêng lẻ
  const handleDeleteFolder = async () => {
    if (!folderPath.trim()) {
      toast.error("Vui lòng nhập đường dẫn folder")
      return
    }

    if (!confirm(`Xóa folder: ${folderPath}?\n\nThao tác này KHÔNG THỂ HOÀN TÁC!`)) {
      return
    }

    try {
      setIsLoading(true)
      const result = await mediaApi.handleR2ApiCall(
        () => mediaApi.deleteR2Folder(folderPath),
        `xóa folder ${folderPath}`
      )
      
      toast.success(`Đã xóa folder: ${folderPath}`)
      setResults(prev => [...prev, { path: folderPath, type: 'folder', success: true, method: result.method }])
      setFolderPath("")
    } catch (error) {
      console.error("Lỗi xóa folder:", error)
      toast.error(`Không thể xóa folder: ${folderPath}`)
      setResults(prev => [...prev, { path: folderPath, type: 'folder', success: false, error: (error as Error).message }])
    } finally {
      setIsLoading(false)
    }
  }

  // Xóa file riêng lẻ
  const handleDeleteFile = async () => {
    if (!filePath.trim()) {
      toast.error("Vui lòng nhập đường dẫn file")
      return
    }

    if (!confirm(`Xóa file: ${filePath}?\n\nThao tác này KHÔNG THỂ HOÀN TÁC!`)) {
      return
    }

    try {
      setIsLoading(true)
      const result = await mediaApi.handleR2ApiCall(
        () => mediaApi.deleteR2File(filePath),
        `xóa file ${filePath}`
      )
      
      toast.success(`Đã xóa file: ${filePath}`)
      setResults(prev => [...prev, { path: filePath, type: 'file', success: true, method: result.method }])
      setFilePath("")
    } catch (error) {
      console.error("Lỗi xóa file:", error)
      toast.error(`Không thể xóa file: ${filePath}`)
      setResults(prev => [...prev, { path: filePath, type: 'file', success: false, error: (error as Error).message }])
    } finally {
      setIsLoading(false)
    }
  }

  // Xóa batch paths
  const handleBatchDelete = async () => {
    const paths = batchPaths.split('\n').filter(p => p.trim())
    
    if (paths.length === 0) {
      toast.error("Vui lòng nhập danh sách đường dẫn")
      return
    }

    if (!confirm(`Xóa ${paths.length} đường dẫn?\n\nThao tác này KHÔNG THỂ HOÀN TÁC!`)) {
      return
    }

    try {
      setIsLoading(true)
      const deletePromises = paths.map(async (path) => {
        try {
          // Tự động detect folder vs file dựa trên có extension hay không
          const isFile = /\.[a-zA-Z0-9]+$/.test(path.trim())
          
          const result = await mediaApi.handleR2ApiCall(
            () => isFile ? mediaApi.deleteR2File(path.trim()) : mediaApi.deleteR2Folder(path.trim()),
            `xóa ${isFile ? 'file' : 'folder'} ${path.trim()}`
          )
          
          return { path: path.trim(), type: isFile ? 'file' : 'folder', success: true, method: result.method }
        } catch (error) {
          return { path: path.trim(), type: 'unknown', success: false, error: (error as Error).message }
        }
      })

      const batchResults = await Promise.all(deletePromises)
      const successful = batchResults.filter(r => r.success).length
      
      setResults(prev => [...prev, ...batchResults])
      toast.success(`Đã xóa ${successful}/${paths.length} đường dẫn`)
      setBatchPaths("")
    } catch (error) {
      console.error("Lỗi batch delete:", error)
      toast.error("Có lỗi trong quá trình xóa batch")
    } finally {
      setIsLoading(false)
    }
  }

  // Xóa episodes của một movie theo pattern
  const handleDeleteMovieEpisodes = async () => {
    const movieId = prompt("Nhập Movie ID để xóa tất cả episodes:")
    if (!movieId || !movieId.trim()) return

    const maxEpisodes = prompt("Số episodes tối đa để scan (mặc định 50):", "50")
    const maxEpisodeId = parseInt(maxEpisodes || "50")

    if (!confirm(`Xóa tất cả episodes của movie ${movieId} (scan từ 1-${maxEpisodeId})?\n\nThao tác này KHÔNG THỂ HOÀN TÁC!`)) {
      return
    }

    try {
      setIsLoading(true)
      const result = await mediaApi.deleteMovieEpisodesByPattern(parseInt(movieId), maxEpisodeId)
      
      toast.success(`Đã xóa ${result.deletedCount}/${result.totalCount} episodes của movie ${movieId}`)
      setResults(prev => [...prev, { 
        path: `episodes/${movieId}/*`, 
        type: 'movie-episodes', 
        success: result.success, 
        deletedCount: result.deletedCount,
        totalCount: result.totalCount
      }])
    } catch (error) {
      console.error("Lỗi xóa movie episodes:", error)
      toast.error(`Không thể xóa episodes của movie ${movieId}`)
    } finally {
      setIsLoading(false)
    }
  }

  // Xóa episodes của movie bằng retry method
  const handleDeleteMovieEpisodesRetry = async () => {
    const movieId = prompt("Nhập Movie ID để xóa episodes bằng retry method:")
    if (!movieId || !movieId.trim()) return

    const maxRetries = prompt("Số lần retry tối đa (mặc định 20):", "20")
    const retryCount = parseInt(maxRetries || "20")

    if (!confirm(`Xóa episodes của movie ${movieId} với ${retryCount} lần retry?\n\nThao tác này KHÔNG THỂ HOÀN TÁC!`)) {
      return
    }

    try {
      setIsLoading(true)
      const result = await mediaApi.deleteMovieEpisodesFolderWithRetry(parseInt(movieId), retryCount)
      
      toast.success(`Đã xóa ${result.deletedCount} episodes của movie ${movieId} (${result.totalAttempts} attempts)`)
      setResults(prev => [...prev, { 
        path: `episodes/${movieId}`, 
        type: 'movie-episodes-retry', 
        success: result.success, 
        deletedCount: result.deletedCount,
        totalCount: result.totalAttempts
      }])
    } catch (error) {
      console.error("Lỗi retry xóa movie episodes:", error)
      toast.error(`Không thể xóa episodes của movie ${movieId}`)
    } finally {
      setIsLoading(false)
    }
  }

  // Clear results
  const clearResults = () => {
    setResults([])
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">R2 Storage Cleanup Admin</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={clearResults} disabled={results.length === 0}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Clear Results
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Single folder deletion */}
        <Card>
          <CardHeader>
            <CardTitle>Xóa Folder</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Ví dụ: episodes/8 hoặc movies/15"
              value={folderPath}
              onChange={(e) => setFolderPath(e.target.value)}
            />
            <Button 
              onClick={handleDeleteFolder}
              disabled={isLoading || !folderPath.trim()}
              variant="destructive"
              className="w-full"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Xóa Folder
            </Button>
          </CardContent>
        </Card>

        {/* Single file deletion */}
        <Card>
          <CardHeader>
            <CardTitle>Xóa File</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Ví dụ: movies/8/poster.jpg hoặc episodes/8/1/original.mp4"
              value={filePath}
              onChange={(e) => setFilePath(e.target.value)}
            />
            <Button 
              onClick={handleDeleteFile}
              disabled={isLoading || !filePath.trim()}
              variant="destructive"
              className="w-full"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Xóa File
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Batch deletion */}
      <Card>
        <CardHeader>
          <CardTitle>Xóa Batch (Nhiều đường dẫn)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder={`Nhập mỗi đường dẫn trên một dòng:
episodes/8
episodes/10
episodes/11/1
movies/8/poster.jpg`}
            value={batchPaths}
            onChange={(e) => setBatchPaths(e.target.value)}
            rows={6}
          />
          <Button 
            onClick={handleBatchDelete}
            disabled={isLoading || !batchPaths.trim()}
            variant="destructive"
            className="w-full"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Xóa Batch ({batchPaths.split('\n').filter(p => p.trim()).length} paths)
          </Button>
        </CardContent>
      </Card>

      {/* System cleanup tools */}
      <Card>
        <CardHeader>
          <CardTitle>System Cleanup Tools</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Button 
              onClick={handleDeleteMovieEpisodes}
              disabled={isLoading}
              variant="outline"
            >
              <Search className="mr-2 h-4 w-4" />
              Xóa Episodes của Movie
            </Button>
            <Button 
              onClick={handleDeleteMovieEpisodesRetry}
              disabled={isLoading}
              variant="outline"
            >
              <Search className="mr-2 h-4 w-4" />
              Xóa Episodes của Movie bằng Retry
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Kết quả ({results.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {results.map((result, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded">
                  <div className="flex-1">
                    <div className="font-mono text-sm">{result.path}</div>
                    <div className="text-xs text-gray-500">
                      {result.type} • {result.method || 'unknown'}
                      {result.deletedCount !== undefined && ` • ${result.deletedCount}/${result.totalCount}`}
                    </div>
                  </div>
                  <div>
                    {result.success ? (
                      <Badge variant="success">Thành công</Badge>
                    ) : (
                      <Badge variant="destructive">Thất bại</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Warning */}
      <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20">
        <CardHeader>
          <CardTitle className="flex items-center text-yellow-800 dark:text-yellow-200">
            <AlertTriangle className="mr-2 h-5 w-5" />
            Cảnh báo
          </CardTitle>
        </CardHeader>
        <CardContent className="text-yellow-700 dark:text-yellow-300">
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>Tất cả thao tác xóa là KHÔNG THỂ HOÀN TÁC</li>
            <li>Hãy kiểm tra kỹ đường dẫn trước khi xóa</li>
            <li>CORS errors với status 200 vẫn được coi là thành công</li>
            <li>Tools này dành cho admin có kinh nghiệm</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
} 