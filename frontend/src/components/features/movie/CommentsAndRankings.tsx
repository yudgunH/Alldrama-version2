'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, ArrowRight, MessageSquare, Star, Eye, ThumbsUp, TrendingUp, ArrowUp, ArrowDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useMobile } from '@/hooks/use-mobile'
import { useComments } from '@/hooks/api/useComments'
import { movieService } from '@/lib/api/services/movieService'
import { Comment } from '@/types/comment'
import { Movie } from '@/types/movie'
import { GenreStat } from '@/types/stats'
import { genreService } from '@/lib/api/services/genreService'

// --------------------------------
// TOP COMMENTS CAROUSEL COMPONENTS
// --------------------------------

interface CommentCardProps {
  comment: Comment
}

const CommentCard = ({ comment }: CommentCardProps) => {
  return (
    <Card className="w-[320px] min-w-[320px] flex-shrink-0 hover:shadow-lg transition-shadow bg-gray-800/50 border-gray-700">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src="/images/placeholder-user.jpg" alt={comment.user?.full_name || 'User'} />
            <AvatarFallback>{(comment.user?.full_name || 'U').charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <h4 className="font-medium text-sm text-gray-200">{comment.user?.full_name || 'Anonymous'}</h4>
            <p className="text-xs text-gray-400">
              {new Date(comment.createdAt).toLocaleDateString('vi-VN')}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        <p className="text-sm line-clamp-3 text-gray-300">{comment.comment}</p>
      </CardContent>
      <CardFooter className="pt-0 flex justify-between text-xs text-gray-400">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Eye className="h-3.5 w-3.5" />
            235
          </span>
          <span className="flex items-center gap-1">
            <MessageSquare className="h-3.5 w-3.5" />
            {comment.replies?.length || 0}
          </span>
        </div>
        <span className="flex items-center gap-1">
          <ThumbsUp className="h-3.5 w-3.5" />
          42
        </span>
      </CardFooter>
    </Card>
  )
}

// ----------------------------
// RANKINGS & ACTIVITY SECTIONS
// ----------------------------

interface PopularMovie {
  id: number;
  title: string;
  views: number;
  rating?: number;
  poster_path?: string;
}

interface TrendingMovieProps {
  movie: Movie
  rank: number
  trend?: 'up' | 'down' | 'stable'
}

const TrendingMovie = ({ movie, rank, trend = 'up' }: TrendingMovieProps) => {
  const trendIcon = {
    up: <ArrowUp className="h-3.5 w-3.5 text-emerald-500" />,
    down: <ArrowDown className="h-3.5 w-3.5 text-rose-500" />,
    stable: <span className="h-3.5 w-3.5 inline-block border-t-2 border-gray-400" />
  }
  
  return (
    <div className="flex items-center gap-3 mb-3">
      <div className="flex items-center justify-center font-bold text-lg min-w-[30px] text-gray-300">
        {rank}
      </div>
      <div className="h-12 w-[22px] aspect-[2/3] rounded-sm overflow-hidden flex-shrink-0">
        <img 
          src={movie.posterUrl || "/placeholder.svg"} 
          alt={movie.title} 
          className="h-full w-full object-cover"
        />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-sm truncate text-gray-200">{movie.title}</h4>
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <Eye className="h-3 w-3" />
          <span>{((movie.views || 0) / 1000).toFixed(0)}K</span>
          {trendIcon[trend]}
        </div>
      </div>
    </div>
  )
}

interface TopTrendingProps {
  movies?: Movie[]
}

const TopTrending = ({ movies = [] }: TopTrendingProps) => {
  const trends: ('up' | 'down' | 'stable')[] = ['up', 'up', 'down', 'stable', 'up']
  
  return (
    <Card className="h-full bg-gray-800/50 border-gray-700">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-amber-500" />
          <CardTitle className="text-base">
            <span className="bg-gradient-to-r from-amber-500 to-red-500 bg-clip-text text-transparent">Sôi Nổi Nhất</span>
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        {movies.slice(0, 5).map((movie, idx) => (
          <TrendingMovie 
            key={movie.id} 
            movie={movie} 
            rank={idx + 1} 
            trend={trends[idx]} 
          />
        ))}
      </CardContent>
      <CardFooter className="pt-0">
        <Button variant="ghost" size="sm" className="w-full flex items-center gap-1 text-xs text-gray-400 hover:text-gray-200 hover:bg-gray-800">
          Xem thêm
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </CardFooter>
    </Card>
  )
}

interface MostLikedProps {
  movies?: Movie[]
}

const MostLiked = ({ movies = [] }: MostLikedProps) => {
  return (
    <Card className="h-full bg-gray-800/50 border-gray-700">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <ThumbsUp className="h-4 w-4 text-rose-500" />
          <CardTitle className="text-base">
            <span className="bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent">Yêu Thích Nhất</span>
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        {movies.map((movie, idx) => (
          <div key={movie.id} className="flex items-center gap-3 mb-3">
            <div className="flex items-center justify-center font-bold text-lg min-w-[30px] text-gray-300">
              {idx + 1}
            </div>
            <div className="h-12 w-[22px] aspect-[2/3] rounded-sm overflow-hidden flex-shrink-0">
              <img 
                src={movie.posterUrl || "/images/placeholder.svg"} 
                alt={movie.title} 
                className="h-full w-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm truncate text-gray-200">{movie.title}</h4>
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                <span>{movie.rating || 4.5}/5</span>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
      <CardFooter className="pt-0">
        <Button variant="ghost" size="sm" className="w-full flex items-center gap-1 text-xs text-gray-400 hover:text-gray-200 hover:bg-gray-800">
          Xem thêm
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </CardFooter>
    </Card>
  )
}

interface HotGenresProps {
  genres?: GenreStat[]
}

const HotGenres = ({ genres = [] }: HotGenresProps) => {
  // Different colors for genre badges
  const colors = [
    'bg-rose-900/50 text-rose-200',
    'bg-blue-900/50 text-blue-200',
    'bg-amber-900/50 text-amber-200',
    'bg-emerald-900/50 text-emerald-200',
    'bg-purple-900/50 text-purple-200',
    'bg-teal-900/50 text-teal-200',
    'bg-indigo-900/50 text-indigo-200',
    'bg-pink-900/50 text-pink-200',
  ]
  
  return (
    <Card className="h-full bg-gray-800/50 border-gray-700">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-blue-500" />
          <CardTitle className="text-base">
            <span className="bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">Thể Loại Hot</span>
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        <div className="flex flex-wrap gap-2">
          {genres.map((genre, idx) => (
            <Link href={`/movie?genre=${genre.name}`} key={genre._id}>
              <Badge variant="outline" className={`${colors[idx % colors.length]} border-gray-700 hover:opacity-90`}>
                {genre.name} ({genre.movieCount})
              </Badge>
            </Link>
          ))}
        </div>
        
        <div className="mt-6">
          <h4 className="text-sm font-medium mb-2 text-white">Xu hướng thể loại mới</h4>
          <div className="space-y-2">
            {genres.slice(0, 3).map((genre, idx) => (
              <div key={`trend-${genre._id}`} className="flex items-center justify-between">
                <span className="text-xs text-white">{genre.name}</span>
                <div className="w-2/3 bg-gray-700 rounded-full h-1.5">
                  <div 
                    className="bg-primary h-1.5 rounded-full" 
                    style={{ width: `${65 - idx * 15}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface RecentCommentsProps {
  comments?: Comment[]
  movies?: Movie[]
}

const RecentComments = ({ comments = [], movies = [] }: RecentCommentsProps) => {
  return (
    <Card className="h-full bg-gray-800/50 border-gray-700">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-emerald-500" />
          <CardTitle className="text-base">
            <span className="bg-gradient-to-r from-emerald-500 to-green-500 bg-clip-text text-transparent">Bình Luận Mới</span>
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pb-3 overflow-hidden">
        <ScrollArea className="h-[280px] pr-3">
          {comments.map((comment) => (
            <div key={comment.id} className="mb-4">
              <div className="flex items-center gap-2 mb-1">
                <Avatar className="h-6 w-6">
                  <AvatarImage src="/images/placeholder-user.jpg" alt={comment.user?.full_name || 'User'} />
                  <AvatarFallback>{(comment.user?.full_name || 'U').charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium text-gray-200">{comment.user?.full_name || 'Anonymous'}</span>
                <span className="text-xs text-gray-500">
                  {new Date(comment.createdAt).toLocaleDateString('vi-VN')}
                </span>
              </div>
              <p className="text-xs line-clamp-2 ml-8 text-gray-300">{comment.comment}</p>
              <div className="ml-8 mt-1">
                <Badge variant="outline" className="text-[10px] h-4 px-1 border-gray-700 bg-gray-700/50 text-gray-300">
                  {movies.find(m => m.id === comment.movieId)?.title || 'Unknown movie'}
                </Badge>
              </div>
            </div>
          ))}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

// Main component
interface CommentsAndRankingsProps {
  initialMovieId?: string | number
}

const CommentsAndRankings = ({
  initialMovieId = 1
}: CommentsAndRankingsProps) => {
  const commentsContainerRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)
  const isMobile = useMobile()
  
  // State for API data
  const [popularMovies, setPopularMovies] = useState<Movie[]>([])
  const [topRatedMovies, setTopRatedMovies] = useState<Movie[]>([])
  const [genreStats, setGenreStats] = useState<GenreStat[]>([])
  const [loading, setLoading] = useState(true)

  // Get comments using the hook
  const { 
    comments, 
    loading: loadingComments 
  } = useComments(initialMovieId, 1, 30)

  // Fetch movie data
  useEffect(() => {
    const fetchMovieData = async () => {
      try {
        setLoading(true)
        
        // Fetch popular movies
        const popularResponse = await movieService.getPopularMovies(10)
        setPopularMovies(popularResponse.movies || [])
        
        // Fetch top rated movies
        const topRatedResponse = await movieService.getMovies({
          sort: 'rating',
          order: 'DESC',
          limit: 10
        })
        setTopRatedMovies(topRatedResponse.movies || [])
        
        const genreStatsResponse = await genreService.getAllGenres()

      } catch (error) {
        console.error('Error fetching movie data:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchMovieData()
  }, [])

  // Update scroll buttons state
  const updateScrollButtons = () => {
    if (commentsContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = commentsContainerRef.current
      setCanScrollLeft(scrollLeft > 0)
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)
    }
  }

  // Attach scroll listener
  useEffect(() => {
    const container = commentsContainerRef.current
    if (container) {
      container.addEventListener('scroll', updateScrollButtons)
      // Initial check
      updateScrollButtons()
      return () => container.removeEventListener('scroll', updateScrollButtons)
    }
  }, [])

  // Scroll handler
  const scroll = (direction: 'left' | 'right') => {
    if (commentsContainerRef.current) {
      const scrollAmount = direction === 'left' ? -340 : 340
      commentsContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' })
    }
  }

  if (isMobile) {
    return null
  }

  // Show loading state or empty arrays if data is loading
  const displayComments = loadingComments ? [] : comments
  const displayPopularMovies = loading ? [] : popularMovies
  const displayTopRatedMovies = loading ? [] : topRatedMovies
  
  // Combined all movies for reference in comments
  const allMovies = [...popularMovies, ...topRatedMovies]
  const uniqueMovies = allMovies.filter((movie, index, self) => 
    self.findIndex(m => m.id === movie.id) === index
  )

  return (
    <div className="container mx-auto py-6">
      <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-lg shadow-black/20 overflow-hidden">
        {/* Top Comments Section */}
        <div className="p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-blue-500" />
              <h2 className="text-xl font-bold">
                <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">Bình Luận Nổi Bật</span>
              </h2>
            </div>
            <div className="flex gap-2">
              <Button 
                size="icon" 
                variant="outline" 
                onClick={() => scroll('left')} 
                disabled={!canScrollLeft}
                className="h-8 w-8 rounded-full bg-gray-800 border-gray-700 hover:bg-gray-700 hover:border-gray-600 disabled:bg-gray-800/50"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button 
                size="icon" 
                variant="outline" 
                onClick={() => scroll('right')} 
                disabled={!canScrollRight}
                className="h-8 w-8 rounded-full bg-gray-800 border-gray-700 hover:bg-gray-700 hover:border-gray-600 disabled:bg-gray-800/50"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div 
            ref={commentsContainerRef}
            className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-2"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {displayComments.slice(0, 8).map((comment) => (
              <CommentCard key={comment.id} comment={comment} />
            ))}
          </div>
        </div>
        
        {/* Divider */}
        <div className="h-px bg-gray-800"></div>
        
        {/* Rankings & Activity Grid - 4 columns */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <TopTrending movies={displayPopularMovies} />
            <MostLiked movies={displayTopRatedMovies} />
            <HotGenres genres={genreStats} />
            <RecentComments comments={displayComments} movies={uniqueMovies} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default CommentsAndRankings 