'use client'

import { useState, useEffect, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useFavorites } from '@/hooks/api/useFavorites';
import { useWatchHistory } from '@/hooks/api/useWatchHistory';
import { useAuth } from '@/hooks/api/useAuth';
import { Favorite, WatchHistory } from '@/types';
import { favoriteService } from '@/lib/api/services/favoriteService';
import { authService } from '@/lib/api/services/authService';
import { generateMovieUrl } from '@/utils/url';
import { getSafePosterUrl } from '@/utils/image';

// Tabs
type TabType = 'account' | 'history' | 'favorites' | 'settings';

// Loading component
const ProfilePageLoader = () => {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
        <p className="mt-4 text-white">Đang tải thông tin...</p>
      </div>
    </div>
  );
};

// Main profile content component that uses useSearchParams
const ProfileContent = () => {
  const [activeTab, setActiveTab] = useState<TabType>('account');
  const [isLoading, setIsLoading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [apiStatus, setApiStatus] = useState<{ status: string; message: string } | null>(null);
  const [testingApi, setTestingApi] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Sử dụng auth hook
  const { user, isAuthenticated, changePassword, fetchCurrentUser, loading: authLoading } = useAuth();

  // Sử dụng API hooks
  const { 
    data: favorites, 
    isLoading: loadingFavorites, 
    removeFromFavorites 
  } = useFavorites();
  
  const { 
    watchHistory, 
    loading: loadingWatchHistory 
  } = useWatchHistory();

  // Kiểm tra auth một cách an toàn
  useEffect(() => {
    const checkAuth = async () => {
      // Nếu đang loading auth, chờ
      if (authLoading) {
        return;
      }

      // Nếu đã check auth rồi, không check lại
      if (authChecked) {
        return;
      }

      // Nếu đang redirect, không check nữa
      if (redirecting) {
        return;
      }

      try {
        // Nếu chưa authenticated và chưa có user
      if (!isAuthenticated && !user) {
          console.log("Checking authentication...");
        const currentUser = await fetchCurrentUser();
          
        if (!currentUser) {
            console.log("No authenticated user found, redirecting to login");
            setRedirecting(true);
              router.push('/login');
            return;
          }
        }
        
        setAuthChecked(true);
        } catch (error) {
        console.error("Auth check error:", error);
        setRedirecting(true);
          router.push('/login');
      }
    };
    
    checkAuth();
  }, [isAuthenticated, user, authLoading, authChecked, redirecting, fetchCurrentUser, router]);

  // Lấy tab từ URL nếu có
  useEffect(() => {
    const tabParam = searchParams?.get('tab');
    if (tabParam) {
      switch (tabParam) {
        case 'history':
        case 'favorites':
        case 'settings':
          setActiveTab(tabParam as TabType);
          break;
        default:
          setActiveTab('account');
      }
    }
  }, [searchParams]);

  // Hiển thị loading khi đang check auth hoặc chưa có user
  if (authLoading || !authChecked || redirecting || (!isAuthenticated && !user)) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
          <p className="mt-4 text-white">
            {redirecting ? 'Đang chuyển hướng...' : 'Đang kiểm tra thông tin đăng nhập...'}
          </p>
        </div>
      </div>
    );
  }

  // Nếu đã check auth nhưng vẫn không có user, redirect
  if (authChecked && !isAuthenticated && !user) {
    if (!redirecting) {
      setRedirecting(true);
      router.push('/login');
    }
    return null;
  }

  // Đảm bảo user không null trước khi render
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
          <p className="mt-4 text-white">Đang tải thông tin người dùng...</p>
        </div>
      </div>
    );
  }

  const handleTabClick = (tab: TabType) => {
    setActiveTab(tab);
    // Cập nhật URL để phản ánh tab hiện tại, giúp cho việc reload trang
    router.push(`/profile?tab=${tab}`, { scroll: false });
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset trạng thái
    setPasswordError('');
    setPasswordSuccess('');
    
    // Kiểm tra user trước khi thực hiện (đã đảm bảo user không null ở trên)
    if (!user) {
      setPasswordError('Không thể xác định thông tin người dùng.');
      return;
    }
    
    // Kiểm tra mật khẩu
    if (!newPassword || !confirmPassword) {
      setPasswordError('Vui lòng điền đầy đủ thông tin.');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setPasswordError('Mật khẩu mới và xác nhận mật khẩu không khớp.');
      return;
    }
    
    if (newPassword.length < 8) {
      setPasswordError('Mật khẩu phải có ít nhất 8 ký tự.');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Gọi API đổi mật khẩu
        const response = await changePassword(
          user.id,
          user.full_name || '',
          user.email || '',
          newPassword
        );
        
        if (response) {
          setPasswordSuccess('Mật khẩu đã được cập nhật thành công!');
          setNewPassword('');
          setConfirmPassword('');
      }
    } catch (error: any) {
      setPasswordError(error.message || 'Có lỗi xảy ra khi đổi mật khẩu. Vui lòng thử lại sau.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveFavorite = async (movieId: number) => {
    if (!removeFromFavorites) return;
    
    try {
      await removeFromFavorites(movieId);
    } catch (error) {
      console.error('Lỗi khi xóa phim yêu thích:', error);
    }
  };

  // Format timestamp to local date time
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format seconds to MM:SS
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Render the account info tab
  const renderAccountInfo = () => (
    <div className="bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center mb-8">
        <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center text-white text-3xl font-bold mb-4 sm:mb-0 sm:mr-6">
          {user?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">{user?.full_name || 'Người dùng'}</h2>
          <p className="text-gray-400">{user?.email}</p>
          <p className="text-gray-400 mt-1">
            Loại tài khoản: <span className="capitalize">{user?.role}</span>
          </p>
          <p className="text-gray-400 mt-1">
            Ngày tham gia: {formatDate(user?.createdAt)}
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-700 rounded-lg p-5">
          <h3 className="text-white font-semibold text-lg mb-4">Hoạt động của bạn</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">Phim đã xem:</span>
              <span className="text-white font-medium">{watchHistory?.length || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Phim yêu thích:</span>
              <span className="text-white font-medium">{favorites?.length || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Bình luận:</span>
              <span className="text-white font-medium">0</span>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-700 rounded-lg p-5">
          <h3 className="text-white font-semibold text-lg mb-4">Cài đặt nhanh</h3>
          <div className="space-y-4">
            <button 
              onClick={() => handleTabClick('settings')}
              className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-md transition-colors"
            >
              Đổi mật khẩu
            </button>
            <button className="w-full bg-gray-600 hover:bg-gray-500 text-white py-2 rounded-md transition-colors">
              Chỉnh sửa hồ sơ
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Render the watch history tab
  const renderWatchHistory = () => (
    <div className="bg-gray-800 rounded-lg shadow-lg p-4 sm:p-6">
      <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">Lịch sử xem phim</h2>
      
      {loadingWatchHistory ? (
        <div className="bg-gray-700 rounded-lg p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 sm:h-10 sm:w-10 border-b-2 border-red-500 mx-auto"></div>
          <p className="text-base sm:text-lg text-gray-400 mt-3">Đang tải lịch sử xem phim...</p>
        </div>
      ) : watchHistory?.length === 0 ? (
        <div className="bg-gray-700 rounded-lg p-6 text-center">
          <p className="text-base sm:text-lg text-gray-400">Bạn chưa xem phim nào.</p>
          <Link 
            href="/" 
            className="mt-4 inline-block bg-red-600 hover:bg-red-700 text-white px-4 sm:px-6 py-2 rounded-md transition-colors text-sm sm:text-base"
          >
            Khám phá phim ngay
          </Link>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {watchHistory?.map((item) => (
            <div key={item.id} className="bg-gray-700 rounded-lg p-3 sm:p-4 flex flex-col sm:flex-row">
              <div className="w-full sm:w-32 h-40 sm:h-44 mb-3 sm:mb-0 sm:mr-4 relative">
                <Image 
                  src={item.movie ? getSafePosterUrl(item.movie.posterUrl, item.movie.id) : '/placeholders/movie.png'} 
                  alt={item.movie?.title || 'Movie'}
                  fill
                  className="rounded-md object-cover"
                  sizes="(max-width: 640px) 100vw, 128px"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/placeholder.svg';
                  }}
                />
              </div>
              <div className="flex-1">
                {item.movie && (
                  <Link 
                    href={generateMovieUrl(item.movie.id, item.movie.title)}
                    className="text-lg sm:text-xl font-semibold text-white hover:text-red-500 transition-colors line-clamp-1"
                  >
                    {item.movie.title}
                  </Link>
                )}
                {item.episode && (
                  <p className="text-sm sm:text-base text-gray-400 mt-1">
                    Tập {item.episode.episodeNumber}: {item.episode.title}
                  </p>
                )}
                <div className="mt-2 flex items-center text-xs sm:text-sm text-gray-400">
                  <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Xem lúc: {formatDate(item.watchedAt)}
                </div>
                <div className="mt-3 sm:mt-4">
                  {item.isCompleted ? (
                    <span className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-medium bg-green-900 text-green-300">
                      Đã xem xong
                    </span>
                  ) : (
                    <>
                      <div className="flex justify-between text-xs sm:text-sm text-gray-400 mb-1">
                        <span>Tiến độ: {formatTime(item.progress)}</span>
                        <span>Tổng thời gian: {formatTime(item.duration)}</span>
                      </div>
                      <div className="w-full bg-gray-600 rounded-full h-1.5 sm:h-2">
                        <div 
                          className="bg-red-600 h-1.5 sm:h-2 rounded-full" 
                          style={{ width: `${(item.progress / item.duration) * 100}%` }}
                        ></div>
                      </div>
                    </>
                  )}
                </div>
                {item.movie && item.episode && (
                  <div className="mt-3 sm:mt-4">
                    <Link 
                      href={`/watch/${generateMovieUrl(item.movie.id, item.movie.title).replace('/movie/', '')}?episode=${item.episode.id}&ep=${item.episode.episodeNumber}&progress=${item.progress}`}
                      className="inline-block bg-red-600 hover:bg-red-700 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm transition-colors"
                    >
                      {item.isCompleted ? 'Xem lại' : 'Tiếp tục xem'}
                    </Link>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Render the favorites tab
  const renderFavorites = () => (
    <div className="bg-gray-800 rounded-lg shadow-lg p-4 sm:p-6">
      <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">Phim yêu thích</h2>
      
      {loadingFavorites ? (
        <div className="bg-gray-700 rounded-lg p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 sm:h-10 sm:w-10 border-b-2 border-red-500 mx-auto"></div>
          <p className="text-base sm:text-lg text-gray-400 mt-3">Đang tải danh sách phim yêu thích...</p>
        </div>
      ) : !favorites || favorites.length === 0 ? (
        <div className="bg-gray-700 rounded-lg p-6 text-center">
          <p className="text-base sm:text-lg text-gray-400">Bạn chưa thêm phim yêu thích nào.</p>
          <Link 
            href="/" 
            className="mt-4 inline-block bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-md transition-colors"
          >
            Khám phá phim ngay
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {favorites.map((favorite) => {
            // Generate movie title and URL slug
            const movieTitle = favorite.movie?.title || `Phim ${favorite.movieId}`;
            const movieSlug = favorite.movie?.title?.toLowerCase().replace(/\s+/g, '-') || `movie-${favorite.movieId}`;
            const posterUrl = getSafePosterUrl(favorite.movie?.posterUrl, favorite.movieId);
            
            return (
              <div key={favorite.id} className="bg-gray-700 rounded-lg overflow-hidden">
                <div className="relative w-full h-40 sm:h-60">
                  <Image 
                    src={posterUrl}
                    alt={movieTitle}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 33vw"
                    onError={(e) => {
                      // Fallback to placeholder if image fails to load
                      const target = e.target as HTMLImageElement;
                      target.src = '/placeholder.svg';
                    }}
                  />
                  <div className="absolute top-2 right-2">
                    <button 
                      className="bg-gray-800/80 hover:bg-red-600/80 p-1.5 sm:p-2 rounded-full transition-colors"
                      aria-label="Remove from favorites"
                      onClick={() => handleRemoveFavorite(favorite.movieId)}
                    >
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="p-2 sm:p-4">
                  <Link 
                    href={generateMovieUrl(favorite.movieId, movieSlug)}
                    className="text-sm sm:text-lg font-semibold text-white hover:text-red-500 transition-colors line-clamp-1"
                  >
                    {movieTitle}
                  </Link>
                  <p className="text-xs sm:text-sm text-gray-400 mt-1 line-clamp-1">
                    Đã thêm: {formatDate(favorite.favoritedAt)}
                  </p>
                  {favorite.movie?.releaseYear && (
                    <p className="text-xs sm:text-sm text-gray-500 mt-1">
                      Năm: {favorite.movie.releaseYear}
                    </p>
                  )}
                  <div className="mt-2 sm:mt-4 flex space-x-2">
                    <Link 
                      href={generateMovieUrl(favorite.movieId, movieSlug)}
                      className="flex-1 bg-gray-600 hover:bg-gray-500 text-white py-1.5 sm:py-2 text-center rounded-md text-xs sm:text-sm transition-colors"
                    >
                      Chi tiết
                    </Link>
                    <Link 
                      href={`/watch/${generateMovieUrl(favorite.movieId, movieSlug).replace('/movie/', '')}`}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white py-1.5 sm:py-2 text-center rounded-md text-xs sm:text-sm transition-colors"
                    >
                      Xem ngay
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  // Render the settings tab
  const renderSettings = () => (
    <div className="space-y-6">
      {/* Password Change Section */}
      <div className="bg-gray-800 rounded-lg shadow-lg p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6">Đổi mật khẩu</h2>
        
        <form onSubmit={handleChangePassword}>
          {passwordError && (
            <div className="bg-red-900/60 text-white text-xs sm:text-sm p-3 rounded-md mb-4">
              {passwordError}
            </div>
          )}
          
          {passwordSuccess && (
            <div className="bg-green-900/60 text-white text-xs sm:text-sm p-3 rounded-md mb-4">
              {passwordSuccess}
            </div>
          )}
          
          <div className="space-y-3 sm:space-y-4">
            <div>
              <label htmlFor="current-password" className="block text-xs sm:text-sm font-medium text-gray-300 mb-1">
                Mật khẩu hiện tại
              </label>
              <input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 sm:px-4 py-2 text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                required
              />
            </div>
            
            <div>
              <label htmlFor="new-password" className="block text-xs sm:text-sm font-medium text-gray-300 mb-1">
                Mật khẩu mới
              </label>
              <input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 sm:px-4 py-2 text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                required
                minLength={8}
              />
              <p className="text-xs text-gray-400 mt-1">
                Mật khẩu phải có ít nhất 8 ký tự
              </p>
            </div>
            
            <div>
              <label htmlFor="confirm-password" className="block text-xs sm:text-sm font-medium text-gray-300 mb-1">
                Xác nhận mật khẩu
              </label>
              <input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 sm:px-4 py-2 text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                required
              />
            </div>
          </div>
          
          <div className="mt-4 sm:mt-6">
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full bg-red-600 hover:bg-red-700 text-white py-2 sm:py-3 rounded-md transition-colors text-sm sm:text-base ${
                isLoading ? 'opacity-75 cursor-not-allowed' : ''
              }`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 sm:h-5 sm:w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Đang xử lý...
                </div>
              ) : (
                'Cập nhật mật khẩu'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  // Render the active tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'account':
        return renderAccountInfo();
      case 'history':
        return renderWatchHistory();
      case 'favorites':
        return renderFavorites();
      case 'settings':
        return renderSettings();
      default:
        return renderAccountInfo();
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8">
        {/* Tabs Navigation */}
        <div className="flex overflow-x-auto space-x-1 sm:space-x-4 bg-gray-800 p-1 sm:p-2 rounded-lg mb-4 sm:mb-6">
          <button
            onClick={() => handleTabClick('account')}
            className={`px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg whitespace-nowrap transition-colors text-xs sm:text-base ${
              activeTab === 'account' ? 'bg-red-600 text-white' : 'text-gray-400 hover:bg-gray-700'
            }`}
          >
            Thông tin
          </button>
          <button
            onClick={() => handleTabClick('history')}
            className={`px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg whitespace-nowrap transition-colors text-xs sm:text-base ${
              activeTab === 'history' ? 'bg-red-600 text-white' : 'text-gray-400 hover:bg-gray-700'
            }`}
          >
            Lịch sử
          </button>
          <button
            onClick={() => handleTabClick('favorites')}
            className={`px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg whitespace-nowrap transition-colors text-xs sm:text-base ${
              activeTab === 'favorites' ? 'bg-red-600 text-white' : 'text-gray-400 hover:bg-gray-700'
            }`}
          >
            Yêu thích
          </button>
          <button
            onClick={() => handleTabClick('settings')}
            className={`px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg whitespace-nowrap transition-colors text-xs sm:text-base ${
              activeTab === 'settings' ? 'bg-red-600 text-white' : 'text-gray-400 hover:bg-gray-700'
            }`}
          >
            Cài đặt
          </button>
        </div>
        
        {/* Tab Content */}
        {activeTab === 'account' && renderAccountInfo()}
        {activeTab === 'history' && renderWatchHistory()}
        {activeTab === 'favorites' && renderFavorites()}
        {activeTab === 'settings' && renderSettings()}
      </div>
    </div>
  );
};

// Wrapper component with Suspense boundary
const ProfilePage = () => {
  return (
    <Suspense fallback={<ProfilePageLoader />}>
      <ProfileContent />
    </Suspense>
  );
};

export default ProfilePage;
