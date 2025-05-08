'use client'

import { useState, useEffect, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { useFavorites } from '@/hooks/api/useFavorites';
import { useWatchHistory } from '@/hooks/api/useWatchHistory';
import { useAuth } from '@/hooks/api/useAuth';
import { Favorite, WatchHistory } from '@/types';
import { favoriteService } from '@/lib/api/services/favoriteService';

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
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Sử dụng auth hook
  const { user, isAuthenticated, changePassword, fetchCurrentUser } = useAuth();

  // Sử dụng API hooks
  const { 
    favorites, 
    loading: loadingFavorites, 
    removeFromFavorites 
  } = useFavorites();
  
  const { 
    watchHistory, 
    loading: loadingWatchHistory 
  } = useWatchHistory();

  // Kiểm tra nếu chưa đăng nhập, chuyển hướng đến trang đăng nhập
  useEffect(() => {
    const checkAuth = async () => {
      if (!isAuthenticated) {
        // Thử lấy thông tin user trước khi chuyển hướng
        const currentUser = await fetchCurrentUser();
        if (!currentUser) {
          router.push('/login');
        }
      }
    };
    
    checkAuth();
  }, [isAuthenticated, router, fetchCurrentUser]);

  // Lấy tab từ URL nếu có
  useEffect(() => {
    const tabParam = searchParams.get('tab');
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

  // Nếu chưa đăng nhập hoặc đang chuyển hướng, hiển thị màn hình loading
  if (!isAuthenticated || !user) {
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
    
    // Kiểm tra mật khẩu
    if (!currentPassword || !newPassword || !confirmPassword) {
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
      if (user?.id) {
        await changePassword(user.id, currentPassword, newPassword);
        setPasswordSuccess('Mật khẩu đã được cập nhật thành công!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (error) {
      setPasswordError('Có lỗi xảy ra khi đổi mật khẩu. Vui lòng thử lại sau.');
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
          {user.full_name?.charAt(0) || user.email?.charAt(0) || 'U'}
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">{user.full_name || 'Người dùng'}</h2>
          <p className="text-gray-400">{user.email}</p>
          <p className="text-gray-400 mt-1">
            Loại tài khoản: <span className="capitalize">{user.role}</span>
          </p>
          <p className="text-gray-400 mt-1">
            Ngày tham gia: {formatDate(user.createdAt)}
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
    <div className="bg-gray-800 rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-white mb-6">Lịch sử xem phim</h2>
      
      {loadingWatchHistory ? (
        <div className="bg-gray-700 rounded-lg p-8 text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-500 mx-auto"></div>
          <p className="text-lg text-gray-400 mt-4">Đang tải lịch sử xem phim...</p>
        </div>
      ) : watchHistory?.length === 0 ? (
        <div className="bg-gray-700 rounded-lg p-8 text-center">
          <p className="text-lg text-gray-400">Bạn chưa xem phim nào.</p>
          <Link 
            href="/" 
            className="mt-4 inline-block bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-md transition-colors"
          >
            Khám phá phim ngay
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {watchHistory?.map((item) => (
            <div key={item.id} className="bg-gray-700 rounded-lg p-4 flex flex-col sm:flex-row">
              <div className="w-full sm:w-32 h-44 sm:h-44 mb-4 sm:mb-0 sm:mr-4 relative">
                <Image 
                  src={ '/placeholders/movie.png'} 
                  alt={item.movie?.title || 'Movie'}
                  width={128}
                  height={176}
                  className="rounded-md w-full h-full object-cover"
                />
              </div>
              <div className="flex-1">
                {item.movie && (
                  <Link 
                    href={`/movie/${item.movie.id}-${item.movie.title.toLowerCase().replace(/\s+/g, '-')}`}
                    className="text-xl font-semibold text-white hover:text-red-500 transition-colors"
                  >
                    {item.movie.title}
                  </Link>
                )}
                {item.episode && (
                  <p className="text-gray-400 mt-1">
                    Tập {item.episode.episodeNumber}: {item.episode.title}
                  </p>
                )}
                <div className="mt-2 flex items-center text-sm text-gray-400">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Xem lúc: {formatDate(item.watchedAt)}
                </div>
                <div className="mt-4">
                  {item.isCompleted ? (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-900 text-green-300">
                      Đã xem xong
                    </span>
                  ) : (
                    <>
                      <div className="flex justify-between text-sm text-gray-400 mb-1">
                        <span>Tiến độ: {formatTime(item.progress)}</span>
                        <span>Tổng thời gian: {formatTime(item.duration)}</span>
                      </div>
                      <div className="w-full bg-gray-600 rounded-full h-2">
                        <div 
                          className="bg-red-600 h-2 rounded-full" 
                          style={{ width: `${(item.progress / item.duration) * 100}%` }}
                        ></div>
                      </div>
                    </>
                  )}
                </div>
                {item.movie && item.episode && (
                  <div className="mt-4">
                    <Link 
                      href={`/watch/${item.movie.id}-${item.movie.title.toLowerCase().replace(/\s+/g, '-')}?episode=${item.episode.id}&ep=${item.episode.episodeNumber}&progress=${item.progress}`}
                      className="inline-block bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm transition-colors"
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
    <div className="bg-gray-800 rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-white mb-6">Phim yêu thích</h2>
      
      {loadingFavorites ? (
        <div className="bg-gray-700 rounded-lg p-8 text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-500 mx-auto"></div>
          <p className="text-lg text-gray-400 mt-4">Đang tải danh sách phim yêu thích...</p>
        </div>
      ) : favorites?.length === 0 ? (
        <div className="bg-gray-700 rounded-lg p-8 text-center">
          <p className="text-lg text-gray-400">Bạn chưa thêm phim yêu thích nào.</p>
          <Link 
            href="/" 
            className="mt-4 inline-block bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-md transition-colors"
          >
            Khám phá phim ngay
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {favorites?.map((favorite) => favorite.movie && (
            <div key={favorite.id} className="bg-gray-700 rounded-lg overflow-hidden">
              <div className="relative w-full h-60">
                <Image 
                  src={'/placeholders/movie.png'} 
                  alt={favorite.movie.title}
                  width={400}
                  height={240}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2">
                  <button 
                    className="bg-gray-800/80 hover:bg-red-600/80 p-2 rounded-full transition-colors"
                    aria-label="Remove from favorites"
                    onClick={() => handleRemoveFavorite(favorite.movieId)}
                  >
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="p-4">
                <Link 
                  href={`/movie/${favorite.movie.id}-${favorite.movie.title.toLowerCase().replace(/\s+/g, '-')}`}
                  className="text-lg font-semibold text-white hover:text-red-500 transition-colors line-clamp-1"
                >
                  {favorite.movie.title}
                </Link>
                <p className="text-gray-400 text-sm mt-1">
                  Đã thêm vào: {formatDate(favorite.favoritedAt)}
                </p>
                <div className="mt-4 flex space-x-2">
                  <Link 
                    href={`/movie/${favorite.movie.id}-${favorite.movie.title.toLowerCase().replace(/\s+/g, '-')}`}
                    className="flex-1 bg-gray-600 hover:bg-gray-500 text-white py-2 text-center rounded-md text-sm transition-colors"
                  >
                    Chi tiết
                  </Link>
                  <Link 
                    href={`/watch/${favorite.movie.id}-${favorite.movie.title.toLowerCase().replace(/\s+/g, '-')}/episode/1`}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 text-center rounded-md text-sm transition-colors"
                  >
                    Xem ngay
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Render the settings tab
  const renderSettings = () => {
    const [apiStatus, setApiStatus] = useState<{ status: string; message: string } | null>(null);
    const [testingApi, setTestingApi] = useState(false);

    const testApiConnection = async () => {
      setTestingApi(true);
      setApiStatus(null);
      try {
        const result = await favoriteService.checkAuthAndConnectivity();
        setApiStatus(result);
      } catch (error) {
        setApiStatus({
          status: 'error',
          message: 'Lỗi không xác định khi kiểm tra kết nối API'
        });
      } finally {
        setTestingApi(false);
      }
    };

    return (
      <div className="space-y-8">
        {/* Password Change Section */}
        <div className="bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-white mb-6">Đổi mật khẩu</h2>
          
          <form onSubmit={handleChangePassword}>
            {passwordError && (
              <div className="bg-red-900/60 text-white text-sm p-3 rounded-md mb-4">
                {passwordError}
              </div>
            )}
            
            {passwordSuccess && (
              <div className="bg-green-900/60 text-white text-sm p-3 rounded-md mb-4">
                {passwordSuccess}
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label htmlFor="current-password" className="block text-sm font-medium text-gray-300 mb-1">
                  Mật khẩu hiện tại
                </label>
                <input
                  id="current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-600 rounded-md px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="new-password" className="block text-sm font-medium text-gray-300 mb-1">
                  Mật khẩu mới
                </label>
                <input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-600 rounded-md px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  required
                  minLength={8}
                />
                <p className="text-xs text-gray-400 mt-1">
                  Mật khẩu phải có ít nhất 8 ký tự
                </p>
              </div>
              
              <div>
                <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-300 mb-1">
                  Xác nhận mật khẩu
                </label>
                <input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-600 rounded-md px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  required
                />
              </div>
            </div>
            
            <div className="mt-6">
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-md transition-colors ${
                  isLoading ? 'opacity-75 cursor-not-allowed' : ''
                }`}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
        
        {/* API Connection Debug Section - Only visible in development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-white mb-6">Kiểm tra kết nối API</h2>
            <p className="text-gray-400 mb-4">
              Công cụ này giúp kiểm tra xem trình duyệt của bạn có thể kết nối đến API server và xác thực đúng không.
            </p>
            
            <button
              onClick={testApiConnection}
              disabled={testingApi}
              className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded transition duration-200 disabled:opacity-50"
            >
              {testingApi ? 'Đang kiểm tra...' : 'Kiểm tra kết nối API'}
            </button>
            
            {apiStatus && (
              <div className={`mt-4 p-4 rounded ${apiStatus.status === 'success' ? 'bg-green-800/30' : 'bg-red-800/30'}`}>
                <h3 className={`font-bold ${apiStatus.status === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                  {apiStatus.status === 'success' ? 'Kết nối thành công' : 'Lỗi kết nối'}
                </h3>
                <p className="text-gray-300 mt-1">{apiStatus.message}</p>
                
                {apiStatus.status === 'error' && (
                  <div className="mt-3 text-gray-400 text-sm">
                    <p>Kiểm tra:</p>
                    <ul className="list-disc list-inside ml-2 mt-1 space-y-1">
                      <li>CORS đã được cấu hình đúng trên backend</li>
                      <li>Token xác thực đã được lưu đúng cách</li>
                      <li>API URL đã được cấu hình đúng: {process.env.NEXT_PUBLIC_API_URL || 'https://alldramaz.com'}</li>
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        
        {/* Danger Zone */}
        <div className="bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-white mb-6">Nguy hiểm</h2>
          <div className="flex flex-col space-y-4">
            <button className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded transition duration-200">
              Xóa tài khoản
            </button>
          </div>
        </div>
      </div>
    );
  };

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
      <div className="container mx-auto px-4 py-8">
        {/* Tabs Navigation */}
        <div className="flex overflow-x-auto space-x-4 bg-gray-800 p-2 rounded-lg mb-6">
          <button
            onClick={() => handleTabClick('account')}
            className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
              activeTab === 'account' ? 'bg-red-600 text-white' : 'text-gray-400 hover:bg-gray-700'
            }`}
          >
            Thông tin tài khoản
          </button>
          <button
            onClick={() => handleTabClick('history')}
            className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
              activeTab === 'history' ? 'bg-red-600 text-white' : 'text-gray-400 hover:bg-gray-700'
            }`}
          >
            Lịch sử xem
          </button>
          <button
            onClick={() => handleTabClick('favorites')}
            className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
              activeTab === 'favorites' ? 'bg-red-600 text-white' : 'text-gray-400 hover:bg-gray-700'
            }`}
          >
            Phim yêu thích
          </button>
          <button
            onClick={() => handleTabClick('settings')}
            className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
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
