"use client"

import { useState } from "react"
import { toast } from "react-hot-toast"
import { Trash2, RefreshCw, Search, AlertTriangle, Info, BarChart3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

import { mediaApi } from "@/services/api"

interface ChunkingProgress {
  step?: 'movies' | 'episodes' | 'complete'
  deleted?: number
  chunks?: number
  moviesDeleted?: number
  episodesDeleted?: number
  totalChunks?: number
  // Recursive progress
  listed?: number
  batches?: number
  totalBatches?: number
  currentBatch?: number
  failed?: number
  moviesListed?: number
  moviesFailed?: number
  episodesListed?: number
  episodesFailed?: number
  // Force cleanup progress
  type?: 'movies' | 'episodes' | 'individual'
  attempted?: number
  current?: string
}

export function R2CleanupAdmin() {
  const [isLoading, setIsLoading] = useState(false)
  const [folderPath, setFolderPath] = useState("")
  const [filePath, setFilePath] = useState("")
  const [batchPaths, setBatchPaths] = useState("")
  const [results, setResults] = useState<any[]>([])
  const [chunkingProgress, setChunkingProgress] = useState<ChunkingProgress | null>(null)
  const [folderSizeInfo, setFolderSizeInfo] = useState<any>(null)

  // Estimate folder size trước khi xóa
  const handleEstimateFolderSize = async () => {
    if (!folderPath.trim()) {
      toast.error("Vui lòng nhập đường dẫn folder")
      return
    }

    try {
      setIsLoading(true)
      const sizeInfo = await mediaApi.estimateFolderSize(folderPath)
      setFolderSizeInfo(sizeInfo)
      toast.success(`Folder ${folderPath}: ${sizeInfo.totalObjects} objects, ${sizeInfo.sizeFormatted}`)
    } catch (error) {
      console.error("Lỗi estimate size:", error)
      toast.error("Không thể estimate size folder")
      setFolderSizeInfo(null)
    } finally {
      setIsLoading(false)
    }
  }

  // Xóa folder với chunking
  const handleDeleteFolderChunking = async () => {
    if (!folderPath.trim()) {
      toast.error("Vui lòng nhập đường dẫn folder")
      return
    }

    const maxChunks = prompt("Số chunks tối đa (mặc định 50):", "50")
    const chunks = parseInt(maxChunks || "50")

    if (!confirm(`Xóa folder: ${folderPath} với chunking (${chunks} chunks)?\n\nThao tác này KHÔNG THỂ HOÀN TÁC!`)) {
      return
    }

    try {
      setIsLoading(true)
      setChunkingProgress({ deleted: 0, chunks: 0 })
      
      const result = await mediaApi.deleteR2FolderWithChunking(
        folderPath,
        chunks,
        (progress) => {
          setChunkingProgress(progress)
        }
      )
      
      toast.success(`Đã xóa ${result.totalDeleted} chunks của folder: ${folderPath}`)
      setResults(prev => [...prev, { 
        path: folderPath, 
        type: 'folder-chunking', 
        success: result.success, 
        totalDeleted: result.totalDeleted,
        totalChunks: result.totalChunks,
        method: result.method
      }])
      setFolderPath("")
      setFolderSizeInfo(null)
    } catch (error) {
      console.error("Lỗi xóa folder chunking:", error)
      toast.error(`Không thể xóa folder: ${folderPath}`)
      setResults(prev => [...prev, { 
        path: folderPath, 
        type: 'folder-chunking', 
        success: false, 
        error: (error as Error).message 
      }])
    } finally {
      setIsLoading(false)
      setChunkingProgress(null)
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

  // Xóa episode cụ thể
  const handleDeleteSpecificEpisode = async () => {
    const movieId = prompt("Nhập Movie ID:")
    if (!movieId || !movieId.trim()) return
    
    const episodeId = prompt("Nhập Episode ID:")
    if (!episodeId || !episodeId.trim()) return

    if (!confirm(`Xóa episode ${episodeId} của movie ${movieId}?\n\nThao tác này KHÔNG THỂ HOÀN TÁC!`)) {
      return
    }

    try {
      setIsLoading(true)
      const result = await mediaApi.handleR2ApiCall(
        () => mediaApi.deleteEpisodeR2Folder(parseInt(movieId), parseInt(episodeId)),
        `xóa episode ${episodeId} của movie ${movieId}`
      )
      
      toast.success(`Đã xóa episode ${episodeId} của movie ${movieId}`)
      setResults(prev => [...prev, { 
        path: `episodes/${movieId}/${episodeId}`, 
        type: 'single-episode', 
        success: true, 
        method: result.method
      }])
    } catch (error) {
      // Check for CORS success
      if ((error as Error).message?.includes('200 (OK)') || 
          (error as Error).message?.includes('net::ERR_FAILED 200')) {
        toast.success(`Đã xóa episode ${episodeId} của movie ${movieId} (CORS nhưng status 200)`)
        setResults(prev => [...prev, { 
          path: `episodes/${movieId}/${episodeId}`, 
          type: 'single-episode', 
          success: true, 
          method: 'cors-success'
        }])
      } else {
        console.error("Lỗi xóa episode:", error)
        toast.error(`Không thể xóa episode ${episodeId} của movie ${movieId}`)
        setResults(prev => [...prev, { 
          path: `episodes/${movieId}/${episodeId}`, 
          type: 'single-episode', 
          success: false, 
          error: (error as Error).message
        }])
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Xóa episodes của movie với chunking
  const handleDeleteMovieEpisodesChunking = async () => {
    const movieId = prompt("Nhập Movie ID để xóa episodes với chunking:")
    if (!movieId || !movieId.trim()) return

    const maxChunks = prompt("Số chunks tối đa (mặc định 100):", "100")
    const chunks = parseInt(maxChunks || "100")

    if (!confirm(`Xóa episodes của movie ${movieId} với chunking (${chunks} chunks)?\n\nThao tác này KHÔNG THỂ HOÀN TÁC!`)) {
      return
    }

    try {
      setIsLoading(true)
      setChunkingProgress({ deleted: 0, chunks: 0 })
      
      const result = await mediaApi.deleteMovieEpisodesWithChunking(
        parseInt(movieId),
        chunks,
        (progress) => {
          setChunkingProgress(progress)
        }
      )
      
      toast.success(`Đã xóa ${result.totalDeleted} chunks episodes của movie ${movieId}`)
      setResults(prev => [...prev, { 
        path: `episodes/${movieId}`, 
        type: 'movie-episodes-chunking', 
        success: result.success, 
        totalDeleted: result.totalDeleted,
        totalChunks: result.totalChunks,
        method: result.method
      }])
    } catch (error) {
      console.error("Lỗi xóa movie episodes chunking:", error)
      toast.error(`Không thể xóa episodes của movie ${movieId}`)
    } finally {
      setIsLoading(false)
      setChunkingProgress(null)
    }
  }

  // Xóa movie hoàn toàn với chunking
  const handleDeleteCompleteMovieChunking = async () => {
    const movieId = prompt("Nhập Movie ID để xóa hoàn toàn với chunking:")
    if (!movieId || !movieId.trim()) return

    if (!confirm(`Xóa HOÀN TOÀN movie ${movieId} với chunking (movies + episodes)?\n\nThao tác này KHÔNG THỂ HOÀN TÁC!`)) {
      return
    }

    try {
      setIsLoading(true)
      setChunkingProgress({ step: 'movies', deleted: 0, chunks: 0, moviesDeleted: 0, episodesDeleted: 0, totalChunks: 0 })
      
      const result = await mediaApi.deleteCompleteMovieWithChunking(
        parseInt(movieId),
        (progress) => {
          setChunkingProgress(progress)
        }
      )
      
      toast.success(`Đã xóa hoàn toàn movie ${movieId}: ${result.totalDeleted} chunks (${result.moviesDeleted} movies + ${result.episodesDeleted} episodes)`)
      setResults(prev => [...prev, { 
        path: `movie-${movieId}-complete`, 
        type: 'complete-movie-chunking', 
        success: result.success, 
        moviesDeleted: result.moviesDeleted,
        episodesDeleted: result.episodesDeleted,
        totalDeleted: result.totalDeleted,
        totalChunks: result.totalChunks,
        method: result.method
      }])
    } catch (error) {
      console.error("Lỗi xóa complete movie chunking:", error)
      toast.error(`Không thể xóa hoàn toàn movie ${movieId}`)
    } finally {
      setIsLoading(false)
      setChunkingProgress(null)
    }
  }

  // Xóa folder riêng lẻ (không chunking)
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
      setFolderSizeInfo(null)
    } catch (error) {
      console.error("Lỗi xóa folder:", error)
      toast.error(`Không thể xóa folder: ${folderPath}`)
      setResults(prev => [...prev, { path: folderPath, type: 'folder', success: false, error: (error as Error).message }])
    } finally {
      setIsLoading(false)
    }
  }

  // Xóa folder với recursive deletion (list-then-delete)
  const handleDeleteFolderRecursive = async () => {
    if (!folderPath.trim()) {
      toast.error("Vui lòng nhập đường dẫn folder")
      return
    }

    if (!confirm(`Xóa folder RECURSIVE: ${folderPath}?\n\nSẽ list tất cả objects trước rồi xóa từng batch.\nThao tác này KHÔNG THỂ HOÀN TÁC!`)) {
      return
    }

    try {
      setIsLoading(true)
      setChunkingProgress({ listed: 0, deleted: 0, batches: 0, currentBatch: 0, failed: 0 })
      
      const result = await mediaApi.deleteR2FolderRecursive(
        folderPath,
        (progress) => {
          setChunkingProgress(progress)
        }
      )
      
      toast.success(`Đã xóa RECURSIVE ${result.totalDeleted}/${result.totalListed} objects của folder: ${folderPath}`)
      setResults(prev => [...prev, { 
        path: folderPath, 
        type: 'folder-recursive', 
        success: result.success, 
        totalListed: result.totalListed,
        totalDeleted: result.totalDeleted,
        totalBatches: result.totalBatches,
        totalFailed: result.totalFailed,
        method: result.method
      }])
      setFolderPath("")
      setFolderSizeInfo(null)
    } catch (error) {
      console.error("Lỗi xóa folder recursive:", error)
      toast.error(`Không thể xóa folder recursive: ${folderPath}`)
      setResults(prev => [...prev, { 
        path: folderPath, 
        type: 'folder-recursive', 
        success: false, 
        error: (error as Error).message 
      }])
    } finally {
      setIsLoading(false)
      setChunkingProgress(null)
    }
  }

  // Xóa episodes với recursive deletion
  const handleDeleteMovieEpisodesRecursive = async () => {
    const movieId = prompt("Nhập Movie ID để xóa episodes với RECURSIVE deletion:")
    if (!movieId || !movieId.trim()) return

    if (!confirm(`Xóa episodes của movie ${movieId} với RECURSIVE deletion?\n\nSẽ list tất cả objects trước rồi xóa từng batch.\nThao tác này KHÔNG THỂ HOÀN TÁC!`)) {
      return
    }

    try {
      setIsLoading(true)
      setChunkingProgress({ listed: 0, deleted: 0, batches: 0, currentBatch: 0, failed: 0 })
      
      const result = await mediaApi.deleteMovieEpisodesRecursive(
        parseInt(movieId),
        (progress) => {
          setChunkingProgress(progress)
        }
      )
      
      toast.success(`Đã xóa RECURSIVE ${result.totalDeleted}/${result.totalListed} objects episodes của movie ${movieId}`)
      setResults(prev => [...prev, { 
        path: `episodes/${movieId}`, 
        type: 'movie-episodes-recursive', 
        success: result.success, 
        totalListed: result.totalListed,
        totalDeleted: result.totalDeleted,
        totalBatches: result.totalBatches,
        totalFailed: result.totalFailed,
        method: result.method
      }])
    } catch (error) {
      console.error("Lỗi xóa movie episodes recursive:", error)
      toast.error(`Không thể xóa episodes recursive của movie ${movieId}`)
    } finally {
      setIsLoading(false)
      setChunkingProgress(null)
    }
  }

  // Xóa movie hoàn toàn với recursive deletion
  const handleDeleteCompleteMovieRecursive = async () => {
    const movieId = prompt("Nhập Movie ID để xóa HOÀN TOÀN với RECURSIVE deletion:")
    if (!movieId || !movieId.trim()) return

    if (!confirm(`Xóa HOÀN TOÀN movie ${movieId} với RECURSIVE deletion?\n\nSẽ list và xóa từng batch tất cả objects trong movies + episodes.\nThao tác này KHÔNG THỂ HOÀN TÁC!`)) {
      return
    }

    try {
      setIsLoading(true)
      setChunkingProgress({ 
        step: 'movies', 
        moviesListed: 0, moviesDeleted: 0, moviesFailed: 0,
        episodesListed: 0, episodesDeleted: 0, episodesFailed: 0,
        totalBatches: 0, currentBatch: 0
      })
      
      const result = await mediaApi.deleteCompleteMovieRecursive(
        parseInt(movieId),
        (progress) => {
          setChunkingProgress(progress)
        }
      )
      
      toast.success(`Đã xóa RECURSIVE hoàn toàn movie ${movieId}: ${result.totalDeleted}/${result.totalListed} objects (${result.totalFailed} failed)`)
      setResults(prev => [...prev, { 
        path: `movie-${movieId}-complete-recursive`, 
        type: 'complete-movie-recursive', 
        success: result.success, 
        totalListed: result.totalListed,
        totalDeleted: result.totalDeleted,
        totalFailed: result.totalFailed,
        moviesResult: result.moviesResult,
        episodesResult: result.episodesResult,
        method: result.method
      }])
    } catch (error) {
      console.error("Lỗi xóa complete movie recursive:", error)
      toast.error(`Không thể xóa hoàn toàn recursive movie ${movieId}`)
    } finally {
      setIsLoading(false)
      setChunkingProgress(null)
    }
  }

  // Force cleanup movie với pattern matching
  const handleForceCleanupMovie = async () => {
    const movieId = prompt("Nhập Movie ID để FORCE CLEANUP với pattern matching:")
    if (!movieId || !movieId.trim()) return

    if (!confirm(`FORCE CLEANUP movie ${movieId}?\n\nSẽ thử xóa tất cả patterns có thể (movies, episodes, files cụ thể).\nThao tác này KHÔNG THỂ HOÀN TÁC!`)) {
      return
    }

    try {
      setIsLoading(true)
      setChunkingProgress({ type: 'movies', attempted: 0, deleted: 0, failed: 0, current: '' })
      
      const result = await mediaApi.forceCleanupMoviePattern(
        parseInt(movieId),
        (progress) => {
          setChunkingProgress(progress)
        }
      )
      
      toast.success(`FORCE CLEANUP hoàn thành movie ${movieId}: ${result.totalDeleted}/${result.totalAttempted} patterns đã xóa`)
      setResults(prev => [...prev, { 
        path: `movie-${movieId}-force-cleanup`, 
        type: 'force-cleanup', 
        success: result.success, 
        totalAttempted: result.totalAttempted,
        totalDeleted: result.totalDeleted,
        totalFailed: result.totalFailed,
        method: result.method
      }])
    } catch (error) {
      console.error("Lỗi force cleanup movie:", error)
      toast.error(`Không thể force cleanup movie ${movieId}`)
    } finally {
      setIsLoading(false)
      setChunkingProgress(null)
    }
  }

  // Clear results
  const clearResults = () => {
    setResults([])
  }

  // Render chunking progress
  const renderChunkingProgress = () => {
    if (!chunkingProgress) return null

    const { step, deleted, chunks, moviesDeleted, episodesDeleted, totalChunks, 
            listed, batches, totalBatches, currentBatch, failed,
            moviesListed, moviesDeleted: moviesDeletedRecursive, moviesFailed,
            episodesListed, episodesDeleted: episodesDeletedRecursive, episodesFailed,
            type, attempted, current } = chunkingProgress

    // Force cleanup progress
    if (type && attempted !== undefined) {
      return (
        <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
          <CardHeader>
            <CardTitle className="text-red-800 dark:text-red-200">
              🔥 Force Cleanup đang chạy...
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span>Type: {type}</span>
                <Badge variant="destructive">Force Cleanup</Badge>
              </div>
              <div className="text-sm space-y-1">
                <div>Attempted: {attempted} patterns</div>
                <div>Deleted: {deleted || 0} objects</div>
                <div>Failed: {failed || 0} patterns</div>
                <div className="font-mono text-xs break-all">Current: {current}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )
    }

    // Recursive deletion progress
    if (listed !== undefined || batches !== undefined) {
      if (step) {
        // Complete movie recursive deletion progress
        return (
          <Card className="border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-900/20">
            <CardHeader>
              <CardTitle className="text-purple-800 dark:text-purple-200">
                🔄 Recursive Deletion - Movie hoàn toàn...
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span>Step: {step === 'movies' ? 'Movies Folder' : step === 'episodes' ? 'Episodes Folder' : 'Hoàn thành'}</span>
                  <Badge variant={step === 'complete' ? 'success' : 'default'}>
                    {step === 'complete' ? 'Hoàn thành' : 'Đang xử lý'}
                  </Badge>
                </div>
                <div className="text-sm space-y-1">
                  <div>Movies: {moviesDeletedRecursive || 0}/{moviesListed || 0} objects ({moviesFailed || 0} failed)</div>
                  <div>Episodes: {episodesDeletedRecursive || 0}/{episodesListed || 0} objects ({episodesFailed || 0} failed)</div>
                  <div>Total batches: {totalBatches || 0} | Current: {currentBatch || 0}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      } else {
        // Simple folder recursive deletion progress
        return (
          <Card className="border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-900/20">
            <CardHeader>
              <CardTitle className="text-purple-800 dark:text-purple-200">
                🔄 Recursive Deletion đang chạy...
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span>Listed: {listed || 0} objects</span>
                  <span>Batches: {batches || 0}</span>
                </div>
                <div className="text-sm space-y-1">
                  <div>Deleted: {deleted || 0} objects</div>
                  <div>Failed: {failed || 0} objects</div>
                  <div>Current batch: {currentBatch || 0}/{batches || 0}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      }
    }

    // Original chunking progress (fallback)
    if (step) {
      // Complete movie deletion progress
      return (
        <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20">
          <CardHeader>
            <CardTitle className="text-blue-800 dark:text-blue-200">
              Đang xóa movie hoàn toàn...
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span>Step: {step === 'movies' ? 'Movies Folder' : step === 'episodes' ? 'Episodes Folder' : 'Hoàn thành'}</span>
                <Badge variant={step === 'complete' ? 'success' : 'default'}>
                  {step === 'complete' ? 'Hoàn thành' : 'Đang xử lý'}
                </Badge>
              </div>
              <div className="text-sm space-y-1">
                <div>Movies deleted: {moviesDeleted || 0} chunks</div>
                <div>Episodes deleted: {episodesDeleted || 0} chunks</div>
                <div>Total chunks: {totalChunks || 0}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )
    } else {
      // Simple folder deletion progress
      return (
        <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20">
          <CardHeader>
            <CardTitle className="text-blue-800 dark:text-blue-200">
              Đang xóa với chunking...
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <span>Đã xóa: {deleted || 0} chunks</span>
              <span>Chunk hiện tại: {chunks || 0}</span>
            </div>
          </CardContent>
        </Card>
      )
    }
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
            <CardTitle>Xóa Folder với Chunking</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Ví dụ: episodes/8 hoặc movies/15"
              value={folderPath}
              onChange={(e) => setFolderPath(e.target.value)}
            />
            
            {/* Folder size info */}
            {folderSizeInfo && (
              <Card className="bg-gray-50 dark:bg-gray-800">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="h-4 w-4" />
                    <span className="font-semibold">Folder Info</span>
                  </div>
                  <div className="text-sm space-y-1">
                    <div>Objects: {folderSizeInfo.totalObjects}</div>
                    <div>Size: {folderSizeInfo.sizeFormatted}</div>
                    <div>Estimated chunks: {folderSizeInfo.estimatedChunks}</div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            <div className="flex gap-2">
              <Button 
                onClick={handleEstimateFolderSize}
                disabled={isLoading || !folderPath.trim()}
                variant="outline"
                className="flex-1"
              >
                <Info className="mr-2 h-4 w-4" />
                Estimate Size
              </Button>
              <Button 
                onClick={handleDeleteFolder}
                disabled={isLoading || !folderPath.trim()}
                variant="destructive"
                className="flex-1"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Xóa Ngay
              </Button>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={handleDeleteFolderChunking}
                disabled={isLoading || !folderPath.trim()}
                variant="destructive"
                className="flex-1"
              >
                <BarChart3 className="mr-2 h-4 w-4" />
                Xóa với Chunking
              </Button>
              <Button 
                onClick={handleDeleteFolderRecursive}
                disabled={isLoading || !folderPath.trim()}
                variant="destructive"
                className="flex-1"
              >
                <Search className="mr-2 h-4 w-4" />
                Xóa Recursive
              </Button>
            </div>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
            <Button 
              onClick={handleDeleteSpecificEpisode}
              disabled={isLoading}
              variant="outline"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Xóa Episode Cụ Thể
            </Button>
            <Button 
              onClick={handleDeleteMovieEpisodesChunking}
              disabled={isLoading}
              variant="secondary"
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              Xóa Episodes với Chunking
            </Button>
            <Button 
              onClick={handleDeleteCompleteMovieChunking}
              disabled={isLoading}
              variant="destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Xóa Movie Hoàn Toàn (Chunking)
            </Button>
            <Button 
              onClick={handleDeleteMovieEpisodesRecursive}
              disabled={isLoading}
              variant="secondary"
            >
              <Search className="mr-2 h-4 w-4" />
              Xóa Episodes RECURSIVE
            </Button>
            <Button 
              onClick={handleDeleteCompleteMovieRecursive}
              disabled={isLoading}
              variant="destructive"
            >
              <Search className="mr-2 h-4 w-4" />
              Xóa Movie RECURSIVE
            </Button>
            <Button 
              onClick={handleForceCleanupMovie}
              disabled={isLoading}
              variant="destructive"
              className="bg-red-600 hover:bg-red-700"
            >
              <AlertTriangle className="mr-2 h-4 w-4" />
              FORCE CLEANUP Movie
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
                      {result.totalDeleted !== undefined && ` • ${result.totalDeleted} chunks`}
                      {result.moviesDeleted !== undefined && ` • Movies: ${result.moviesDeleted}`}
                      {result.episodesDeleted !== undefined && ` • Episodes: ${result.episodesDeleted}`}
                      {result.totalListed !== undefined && ` • Listed: ${result.totalListed}`}
                      {result.totalBatches !== undefined && ` • Batches: ${result.totalBatches}`}
                      {result.totalFailed !== undefined && ` • Failed: ${result.totalFailed}`}
                      {result.totalAttempted !== undefined && ` • Attempted: ${result.totalAttempted}`}
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
            <li><strong>Xóa Ngay:</strong> Dùng cho folders nhỏ, xóa toàn bộ trong 1 lần gọi API</li>
            <li><strong>Chunking:</strong> Dùng cho folders lớn, tự động chia nhỏ việc xóa thành chunks</li>
            <li><strong>Recursive:</strong> List tất cả objects trước, rồi xóa từng batch (hiệu quả nhất)</li>
            <li><strong>Force Cleanup:</strong> Thử xóa tất cả patterns có thể, dùng khi các method khác thất bại</li>
            <li>Dùng "Estimate Size" để kiểm tra folder trước khi xóa</li>
            <li>Tools này dành cho admin có kinh nghiệm</li>
          </ul>
        </CardContent>
      </Card>

      {/* Chunking progress */}
      {renderChunkingProgress()}
    </div>
  )
} 