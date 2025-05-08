"use client"

import type { Movie, Episode } from "@/types"
import Link from "next/link"
import Image from "next/image"
import { useState, useEffect } from "react"
import { generateMovieUrl, generateWatchUrl } from "@/utils/url"
import { Star, Play, Film, Clock, Calendar, Eye, ChevronDown, ChevronUp, Info, Heart, Bookmark, TrendingUp, BarChart3, Layers, Share } from "lucide-react"
import { Button } from "@/components/ui/button"
import CommentSection from "./CommentSection"
import { useMovieDetail } from "@/hooks/api/useMovieDetail"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent } from "@/components/ui/card"
import { useMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"
import MovieGrid from "./MovieGrid"
import MovieSlider from "./MovieSlider"
import { Skeleton } from "@/components/ui/skeleton"
import axios from "axios"
import { API_ENDPOINTS } from "@/lib/api/endpoints"
import { useAuth } from "@/hooks/api/useAuth"
import { toast } from "sonner"
import { useFavorites } from "@/hooks/api/useFavorites"

interface MovieDetailProps {
  movieId: string | number
  initialData?: Movie
}

const MovieDetail = ({ movieId, initialData }: MovieDetailProps) => {
  const { movie, episodes, isLoading, error } = useMovieDetail(movieId, initialData)
  const [showFullDescription, setShowFullDescription] = useState(false)
  const [activeEpisode, setActiveEpisode] = useState<string | null>(null)
  const [isWatchlist, setIsWatchlist] = useState(false)
  const [isLiked, setIsLiked] = useState(false)
  const [relatedMovies, setRelatedMovies] = useState<Movie[]>([])
  const [topRatedMovies, setTopRatedMovies] = useState<Movie[]>([])
  const isMobile = useMobile()
  
  // Auth state and favorites functionality
  const { user, isAuthenticated } = useAuth()
  const { toggleFavorite, isFavorite } = useFavorites()

  // Check if the movie is in favorites when component mounts or movie changes
  useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (isAuthenticated && movie) {
        try {
          console.log('Checking favorite status for movie:', movie.id);
          const favorited = await isFavorite(movie.id);
          console.log('Movie favorite status:', favorited);
          setIsLiked(favorited);
        } catch (error) {
          console.error('Error checking favorite status:', error);
        }
      }
    }
    
    checkFavoriteStatus();
  }, [isAuthenticated, movie, isFavorite]);

  // Handle toggle favorite
  const handleToggleFavorite = async () => {
    console.log('Toggle favorite clicked, auth status:', isAuthenticated);
    
    if (!isAuthenticated) {
      toast.error("Vui lòng đăng nhập để thêm vào danh sách yêu thích");
      return;
    }
    
    if (movie) {
      try {
        console.log('Attempting to toggle favorite for movie:', movie.id);
        // Optimistically update UI
        setIsLiked(!isLiked);
        
        const favorited = await toggleFavorite(movie.id);
        console.log('Toggle favorite response:', favorited);
        
        if (favorited !== null) {
          setIsLiked(favorited);
          toast.success(favorited ? 'Đã thêm vào danh sách yêu thích' : 'Đã xóa khỏi danh sách yêu thích');
        } else {
          // Revert UI if API call failed
          setIsLiked(!isLiked);
        }
      } catch (error) {
        console.error("Error toggling favorite:", error);
        // Revert UI change on error
        setIsLiked(!isLiked);
        toast.error("Không thể thay đổi trạng thái yêu thích");
      }
    }
  }

  // Fetch related movies based on the current movie's genres
  useEffect(() => {
    const fetchRelatedMovies = async () => {
      if (movie && movie.genres && movie.genres.length > 0) {
        try {
          // Get first genre ID to find related movies
          const genreId = typeof movie.genres[0] === 'string' 
            ? movie.genres[0] 
            : movie.genres[0].id
          
          // Fetch movies by genre
          const response = await axios.get(API_ENDPOINTS.GENRES.MOVIES(genreId))
          // Filter out the current movie
          const filtered = response.data.movies.filter((m: Movie) => m.id !== movie.id)
          // Limit to 5 movies
          setRelatedMovies(filtered.slice(0, 5))
        } catch (err) {
          console.error('Error fetching related movies:', err)
        }
      }
    }

    fetchRelatedMovies()
  }, [movie])
  
  // Fetch top rated movies 
  useEffect(() => {
    const fetchTopRatedMovies = async () => {
      try {
        // Fetch top rated movies from the API
        const response = await axios.get(`${API_ENDPOINTS.MOVIES.LIST}?sort=rating&order=DESC&limit=6`)
        
        // Filter out the current movie if it's in the list
        const filtered = response.data.movies.filter((m: Movie) => 
          movie ? m.id !== movie.id : true
        )
        
        // Sort by rating in descending order and take the top 5
        const sorted = filtered.sort((a: Movie, b: Movie) => 
          (b.rating || 0) - (a.rating || 0)
        ).slice(0, 5)
        
        setTopRatedMovies(sorted)
      } catch (err) {
        console.error('Error fetching top rated movies:', err)
      }
    }
    
    fetchTopRatedMovies()
  }, [movie])

  const toggleDescription = () => {
    setShowFullDescription(!showFullDescription)
  }

  useEffect(() => {
    // Reset description state when movie changes
    setShowFullDescription(false)
  }, [movieId])

  // Update the episode watch url generation
  const generateEpisodeLink = (movie: Movie, episode: Episode) => {
    return generateWatchUrl(movie.id, movie.title, episode.id, episode.episodeNumber);
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950">
        <div className="h-[50vh] md:h-[75vh] bg-gray-800 animate-pulse">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-[40vh] md:pt-[65vh]">
            <Skeleton className="h-10 w-3/4 mb-4" />
            <Skeleton className="h-6 w-1/2 mb-6" />
            <div className="flex gap-2 mb-4">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-20" />
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
            <div>
              <Skeleton className="h-80 w-full mb-6" />
            </div>
            <div>
              <Skeleton className="h-60 w-full" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !movie) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center p-8 max-w-md mx-auto">
          <h2 className="text-2xl font-bold text-white mb-4">Không thể tải thông tin phim</h2>
          <p className="text-gray-400 mb-6">{error || 'Đã xảy ra lỗi khi tải thông tin phim. Vui lòng thử lại sau.'}</p>
          <Button asChild>
            <Link href="/">Quay lại trang chủ</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="text-foreground">
      {/* Hero Banner with parallax effect */}
      <div className="relative w-full h-[50vh] md:h-[75vh] overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 w-full h-full">
          <div className="absolute inset-0 bg-gradient-to-r from-gray-800/40 to-gray-900/40 mix-blend-multiply z-5" />
          <div className="absolute inset-0 bg-[url('/images/noise.png')] opacity-[0.02] mix-blend-overlay pointer-events-none z-5" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/90 to-background/30" />
        </div>

        {/* Poster for mobile */}
        <div className="absolute top-4 left-4 md:hidden w-32 h-48 rounded-xl overflow-hidden shadow-2xl shadow-indigo-500/10">
          <Image 
            src={"/images/test.jpg"} 
            alt={movie.title} 
            fill 
            priority
            className="object-cover transform hover:scale-105 transition-transform duration-700" 
          />
          <div className="absolute inset-0 ring-1 ring-indigo-500/20 rounded-xl hover:ring-indigo-500/40 transition-all"></div>
        </div>

        {/* Movie Details */}
        <div className="absolute inset-0 flex items-end">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pb-6 md:pb-12">
            <div className="flex flex-col md:flex-row md:items-end gap-4 md:gap-6">
              {/* Poster with glow effect */}
              <div className="hidden md:block w-48 h-72 md:w-64 md:h-96 flex-shrink-0 relative rounded-xl overflow-hidden shadow-2xl shadow-indigo-500/10 group">
                <Image 
                  src={ "/placeholder.svg"} 
                  alt={movie.title} 
                  fill 
                  className="object-cover transform group-hover:scale-105 transition-transform duration-700" 
                />
                <div className="absolute inset-0 ring-1 ring-indigo-500/20 rounded-xl group-hover:ring-indigo-500/40 transition-all"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-3">
                  <Button className="rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg text-xs md:text-sm px-2 md:px-3 py-1 md:py-1.5">
                    <Play className="h-4 w-4 md:h-5 md:w-5 fill-current mr-1 md:mr-2" /> Xem ngay
                  </Button>
                </div>
              </div>

              {/* Movie Info */}
              <div className="space-y-4 flex-grow">
                <div>
                  <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold text-white mb-1 md:mb-2 drop-shadow-sm">{movie.title}</h1>
                  <div className="relative">
                    <div className="absolute -left-3 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-500 to-purple-500"></div>
                    <p className="text-sm md:text-lg text-gray-300 italic pl-1">{"Một bộ phim đáng xem"}</p>
                  </div>
                </div>

                {/* Movie Metrics */}
                <div className="flex flex-wrap gap-2 md:gap-4 items-center text-xs md:text-base">
                  <div className="flex items-center bg-black/20 backdrop-blur-md px-2 md:px-3 py-1 rounded-full text-indigo-200 border border-indigo-500/20">
                    <Calendar className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2 text-indigo-400" />
                    <span>{movie.releaseYear}</span>
                  </div>
                  
                  <div className="flex items-center bg-black/20 backdrop-blur-md px-2 md:px-3 py-1 rounded-full text-amber-200 border border-amber-500/20">
                    <Star className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2 text-amber-400 fill-amber-400" />
                    <span>{movie.rating || "8.5"}</span>
                  </div>
                  
                  <div className="flex items-center bg-black/20 backdrop-blur-md px-2 md:px-3 py-1 rounded-full text-indigo-200 border border-indigo-500/20">
                    <Eye className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2 text-indigo-400" />
                    <span>{new Intl.NumberFormat("vi-VN").format(movie.views || 0)} lượt xem</span>
                  </div>
                </div>

                {/* Genres */}
                <div className="flex flex-wrap items-center gap-1 md:gap-2">
                  {movie.genres && movie.genres.map((genre, index) => {
                    const genreId = typeof genre === "string" ? genre : genre.id
                    const genreName = typeof genre === "string" ? genre : genre.name

                    return (
                      <Link
                        key={`${genreId}-${index}`}
                        href={`/movie?genre=${encodeURIComponent(genreName)}`}
                        className="px-2 md:px-3 py-0.5 md:py-1 bg-gray-800/80 hover:bg-indigo-600 border border-gray-700 hover:border-indigo-500 rounded-full text-white text-xs md:text-sm transition-all backdrop-blur-sm shadow-sm"
                      >
                        {genreName}
                      </Link>
                    )
                  })}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-1 md:gap-3">
                  {episodes.length > 0 ? (
                    <Button asChild size="sm" className="rounded-full gap-1 md:gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 border-none text-white shadow-lg px-2 md:px-4 py-1 md:py-3 text-xs md:text-base">
                      <Link href={generateEpisodeLink(movie, episodes[0])}>
                        <Play className="h-4 w-4 md:h-5 md:w-5 fill-current" />
                        Xem ngay
                      </Link>
                    </Button>
                  ) : (
                    <Button asChild size="sm" className="rounded-full gap-1 md:gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 border-none text-white shadow-lg px-2 md:px-4 py-1 md:py-3 text-xs md:text-base">
                      <Link href={generateWatchUrl(movie.id, movie.title)}>
                        <Play className="h-4 w-4 md:h-5 md:w-5 fill-current" />
                        Xem phim
                      </Link>
                    </Button>
                  )}
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="rounded-full gap-1 md:gap-2 border-gray-600 bg-gray-900/40 hover:bg-gray-800 text-white backdrop-blur-sm px-2 md:px-4 py-1 md:py-3 text-xs md:text-base"
                    asChild
                  >
                    <Link href={movie.trailerUrl || "#"} target="_blank" rel="noopener noreferrer">
                      <Film className="h-4 w-4 md:h-5 md:w-5" />
                      Xem trailer
                    </Link>
                  </Button>
                  
                  <div className="flex gap-1 md:gap-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className={`rounded-full w-8 h-8 md:w-11 md:h-11 ${isWatchlist 
                              ? 'bg-indigo-600 text-white border-indigo-500' 
                              : 'bg-gray-900/40 border-gray-600 hover:bg-gray-800 text-white backdrop-blur-sm'}`}
                            onClick={() => setIsWatchlist(!isWatchlist)}
                          >
                            <Bookmark className={`h-4 w-4 md:h-5 md:w-5 ${isWatchlist ? 'fill-white' : ''}`} />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="text-xs md:text-sm p-1 md:p-2">
                          <p>{isWatchlist ? 'Đã lưu' : 'Lưu phim'}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className={`rounded-full w-8 h-8 md:w-11 md:h-11 ${isLiked 
                              ? 'bg-pink-600 text-white border-pink-500' 
                              : 'bg-gray-900/40 border-gray-600 hover:bg-gray-800 text-white backdrop-blur-sm'}`}
                            onClick={handleToggleFavorite}
                          >
                            <Heart className={`h-4 w-4 md:h-5 md:w-5 ${isLiked ? 'fill-white' : ''}`} />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="text-xs md:text-sm p-1 md:p-2">
                          <p>{isLiked ? 'Đã thích' : 'Thích phim'}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="rounded-full w-8 h-8 md:w-11 md:h-11 bg-gray-900/40 border-gray-600 hover:bg-gray-800 text-white backdrop-blur-sm"
                          >
                            <Share className="h-4 w-4 md:h-5 md:w-5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="text-xs md:text-sm p-1 md:p-2">
                          <p>Chia sẻ</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
          {/* Main Column */}
          <div>
            <Tabs defaultValue="info" className="mb-8">
              <TabsList className="bg-gray-800/60 border border-gray-700/50 p-0.5 rounded-lg mb-6">
                <TabsTrigger 
                  value="info" 
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-purple-600 data-[state=active]:text-white rounded-md py-2"
                >
                  <Info className="w-4 h-4 mr-2" /> Giới thiệu
                </TabsTrigger>
                {episodes.length > 0 && (
                  <TabsTrigger 
                    value="episodes" 
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-purple-600 data-[state=active]:text-white rounded-md py-2"
                  >
                    <Layers className="w-4 h-4 mr-2" /> Tập phim ({episodes.length})
                  </TabsTrigger>
                )}
                <TabsTrigger 
                  value="comments" 
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-purple-600 data-[state=active]:text-white rounded-md py-2"
                >
                  <TrendingUp className="w-4 h-4 mr-2" /> Bình luận
                </TabsTrigger>
              </TabsList>
              
              {/* Info Tab */}
              <TabsContent value="info" className="space-y-4">
                {/* Nội dung phim */}
                <Card className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 border-gray-700 overflow-hidden">
                  <div className="absolute inset-0 bg-[url('/images/noise.png')] opacity-5 mix-blend-overlay pointer-events-none"></div>
                  <CardContent className="p-6 relative">
                    <h2 className="text-sm sm:text-xl font-bold flex items-center text-white mb-2">
                      <Info className="w-5 h-5 mr-2 text-indigo-400" />
                      <span className="bg-gradient-to-r from-indigo-300 to-purple-300 bg-clip-text text-transparent">
                        Nội dung phim
                      </span>
                    </h2>
                    
                    <div className="text-gray-300 text-xs sm:text-sm leading-relaxed">
                      {movie.summary}
                    </div>
                    
                    <button
                      onClick={toggleDescription}
                      className="mt-2 text-blue-400 hover:text-blue-300 text-xs sm:text-sm flex items-center"
                    >
                      {showFullDescription ? (
                        <>
                          Thu gọn <ChevronUp className="ml-1 w-3 h-3 sm:w-4 sm:h-4" />
                        </>
                      ) : (
                        <>
                          Xem thêm <ChevronDown className="ml-1 w-3 h-3 sm:w-4 sm:h-4" />
                        </>
                      )}
                    </button>
                  </CardContent>
                </Card>

                {/* Movie stats */}
                <Card className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 border-gray-700 overflow-hidden">
                  <div className="absolute inset-0 bg-[url('/images/noise.png')] opacity-5 mix-blend-overlay pointer-events-none"></div>
                  <CardContent className="p-3 sm:p-6 relative">
                    <div className="grid grid-cols-3 gap-2 sm:gap-4 text-xs sm:text-sm">
                      <div className="flex items-center">
                        <Calendar className="h-3 w-3 sm:h-5 sm:w-5 mr-1 sm:mr-2 text-indigo-400" />
                        <div>
                          <p className="text-gray-400 text-[10px] sm:text-sm">Phát hành</p>
                          <p className="text-white text-[10px] sm:text-sm">{movie.releaseYear}</p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-3 w-3 sm:h-5 sm:w-5 mr-1 sm:mr-2 text-indigo-400" />
                        <div>
                          <p className="text-gray-400 text-[10px] sm:text-sm">Thời lượng</p>
                          <p className="text-white text-[10px] sm:text-sm">{movie.duration} phút</p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <BarChart3 className="h-3 w-3 sm:h-5 sm:w-5 mr-1 sm:mr-2 text-indigo-400" />
                        <div>
                          <p className="text-gray-400 text-[10px] sm:text-sm">Đánh giá</p>
                          <p className="text-white text-[10px] sm:text-sm flex items-center">
                            <Star className="h-3 w-3 sm:h-5 sm:w-5 mr-0.5 sm:mr-1 text-yellow-400 fill-yellow-400" />
                            {movie.rating}/10
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Có thể bạn cũng thích */}
                {relatedMovies.length > 0 && (
                  <Card className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 border-gray-700 overflow-hidden">
                    <div className="absolute inset-0 bg-[url('/images/noise.png')] opacity-5 mix-blend-overlay pointer-events-none"></div>
                    <CardContent className="px-4 relative">
                      <MovieSlider
                        title="Có thể bạn cũng thích"
                        movies={relatedMovies}
                        variant="trending"
                        maxItems={5}
                        className="mb-0"
                        size="sm" 
                        showPopover={false}
                      />
                    </CardContent>
                  </Card>
                )}
              </TabsContent>  
              
              {/* Episodes Tab */}
              {episodes.length > 0 && (
                <TabsContent value="episodes">
                  <Card className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 border-gray-700 overflow-hidden">
                    <div className="absolute inset-0 bg-[url('/images/noise.png')] opacity-5 mix-blend-overlay pointer-events-none"></div>
                    <CardContent className="p-6 relative">
                      <h2 className="text-xl font-bold mb-4 flex items-center text-white">
                        <Layers className="w-5 h-5 mr-2 text-indigo-400" />
                        <span className="bg-gradient-to-r from-indigo-300 to-purple-300 bg-clip-text text-transparent">
                          Danh sách tập phim
                        </span>
                      </h2>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {episodes.map((episode) => (
                          <Link
                            key={episode.id}
                            href={generateEpisodeLink(movie, episode)}
                            className="group overflow-hidden rounded-xl hover:shadow-lg hover:shadow-indigo-900/10 border border-gray-700 hover:border-indigo-500/30 transition-all flex flex-col"
                            onMouseEnter={() => setActiveEpisode(String(episode.id))}
                            onMouseLeave={() => setActiveEpisode(null)}
                          >
                            {/* Episode presentation - different for mobile and desktop */}
                            {isMobile ? (
                              // Simple mobile view - just episode info without thumbnails
                              <div className="p-3 bg-gray-800/70 hover:bg-gradient-to-r hover:from-indigo-900/40 hover:to-purple-900/40">
                                <div className="flex justify-between items-center">
                                  <div className="flex items-center space-x-2">
                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center ${activeEpisode === String(episode.id) ? "bg-indigo-600" : "bg-gray-800/80"}`}>
                                      <span className="text-xs font-bold text-white">{episode.episodeNumber}</span>
                                    </div>
                                    <div className="font-medium text-white line-clamp-1">{episode.title}</div>
                                  </div>
                                  <div className="ml-2">
                                    <Play className="h-4 w-4 text-indigo-400" />
                                  </div>
                                </div>
                                
                                <div className="flex justify-between items-center text-sm text-gray-400 mt-2">
                                  <div className="flex items-center">
                                    <Clock className="w-4 h-4 mr-1" />
                                    {Math.floor(episode.duration / 60)} phút
                                  </div>
                                  {episode.isProcessed ? (
                                    <div className="flex items-center text-green-400">
                                      <span className="w-2 h-2 rounded-full bg-green-400 mr-1"></span>
                                      Sẵn sàng
                                    </div>
                                  ) : (
                                    <div className="flex items-center text-amber-400">
                                      <span className="w-2 h-2 rounded-full bg-amber-400 mr-1"></span>
                                      Đang xử lý
                                    </div>
                                  )}
                                </div>
                              </div>
                            ) : (
                              // Desktop view with thumbnails
                              <>
                                <div className="relative aspect-video overflow-hidden">
                                  <Image 
                                    src={episode.thumbnailUrl || "/placeholder.svg"} 
                                    alt={episode.title}
                                    fill
                                    className="object-cover"
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <div className="w-12 h-12 rounded-full bg-indigo-600/80 flex items-center justify-center">
                                      <Play className="h-6 w-6 text-white fill-current ml-1" />
                                    </div>
                                  </div>
                                  <div className={`absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center ${activeEpisode === String(episode.id) ? "bg-indigo-600" : "bg-gray-800/80"}`}>
                                    <span className="text-xs font-bold text-white">{episode.episodeNumber}</span>
                                  </div>
                                  <div className="absolute bottom-0 left-0 right-0 px-3 py-2 bg-gradient-to-t from-black to-transparent">
                                    <div className="font-medium text-white line-clamp-1">{episode.title}</div>
                                  </div>
                                </div>

                                {/* Episode info */}
                                <div className="p-3 bg-gray-800/50 hover:bg-gradient-to-r hover:from-indigo-900/40 hover:to-purple-900/40">
                                  <div className="flex justify-between items-center text-sm text-gray-400">
                                    <div className="flex items-center">
                                      <Clock className="w-4 h-4 mr-1" />
                                      {Math.floor(episode.duration / 60)} phút
                                    </div>
                                    {episode.isProcessed ? (
                                      <div className="flex items-center text-green-400">
                                        <span className="w-2 h-2 rounded-full bg-green-400 mr-1"></span>
                                        Sẵn sàng
                                      </div>
                                    ) : (
                                      <div className="flex items-center text-amber-400">
                                        <span className="w-2 h-2 rounded-full bg-amber-400 mr-1"></span>
                                        Đang xử lý
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </>
                            )}
                          </Link>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              )}
              
              {/* Comments Tab */}
              <TabsContent value="comments">
                <Card className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 border-gray-700 overflow-hidden">
                  <div className="absolute inset-0 bg-[url('/images/noise.png')] opacity-5 mix-blend-overlay pointer-events-none"></div>
                  <CardContent className="p-6 relative">
                    <CommentSection movieId={String(movie.id)} />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            {/* Top Rated Movies */}
            <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-700/50 sticky top-4">
              <div className="absolute inset-0 bg-[url('/images/noise.png')] opacity-5 mix-blend-overlay pointer-events-none"></div>
              <CardContent className="p-6 relative">
                <h2 className="text-xl font-bold mb-4 flex items-center text-white">
                  <TrendingUp className="w-5 h-5 mr-2 text-indigo-400" />
                  <span className="bg-gradient-to-r from-indigo-300 to-purple-300 bg-clip-text text-transparent">
                    Phim đánh giá cao
                  </span>
                </h2>
                
                <div className="space-y-4">
                  {topRatedMovies.map((movie, index) => (
                    <Link
                      key={movie.id}
                      href={generateMovieUrl(movie.id, movie.title)}
                      className="flex gap-3 group items-start hover:bg-gray-800/30 p-2 rounded-lg transition-colors"
                    >
                      <div className="w-12 h-12 flex-shrink-0 bg-gray-700 rounded-full flex items-center justify-center font-bold text-lg border border-gray-600 text-indigo-300">
                        {index + 1}
                      </div>
                      <div className="flex-grow min-w-0">
                        <h3 className="font-medium text-white line-clamp-1 group-hover:text-indigo-400 transition-colors">{movie.title}</h3>
                        <div className="flex items-center text-sm text-gray-400 mt-1">
                          <Star className="w-4 h-4 text-amber-400 fill-amber-400 mr-1" />
                          <span>{movie.rating || "8.5"}</span>
                          <Separator orientation="vertical" className="mx-2 h-3 bg-gray-700" />
                          <span>{movie.releaseYear}</span>
                        </div>
                      </div>
                      <div className="w-16 h-22 flex-shrink-0 rounded-md overflow-hidden relative">
                        <Image
                          src={"/placeholder.svg"}
                          alt={movie.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MovieDetail