import { useCallback, useState, useEffect } from 'react';
import { LoginCredentials, RegisterCredentials, User, UpdateUserDto } from '@/types';
import { authService } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';

export const useAuth = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  
  // Sử dụng Zustand store
  const { user, setUser, setAuthenticated, isAuthenticated, token, setToken, logout: logoutStore } = useAuthStore();

  // Tự động kiểm tra người dùng hiện tại nếu có token
  useEffect(() => {
    const checkCurrentUser = async () => {
      if (token && !user) {
        await fetchCurrentUser();
      }
    };
    
    checkCurrentUser();
  }, [token]);

  /**
   * Đăng ký người dùng mới
   */
  const register = useCallback(async (credentials: RegisterCredentials) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await authService.register(credentials);
      // Lưu access token và cập nhật store
      authService.saveToken(response.accessToken);
      setUser(response.user);
      setAuthenticated(true);
      toast.success('Đăng ký thành công!');
      router.push('/');
      return response;
    } catch (err: any) {
      const message = err.response?.data?.message || 'Đăng ký thất bại';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [router, setAuthenticated, setUser]);

  /**
   * Đăng nhập người dùng
   */
  const login = useCallback(async (credentials: LoginCredentials) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await authService.login(credentials);
      // Lưu access token và cập nhật store
      authService.saveToken(response.accessToken);
      setUser(response.user);
      setAuthenticated(true);
      toast.success('Đăng nhập thành công!');
      router.push('/');
      return response;
    } catch (err: any) {
      const message = err.response?.data?.message || 'Đăng nhập thất bại';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [router, setAuthenticated, setUser]);

  /**
   * Đăng xuất người dùng
   * Gọi API logout để xóa refresh token cookie
   */
  const logout = useCallback(async () => {
    setLoading(true);
    
    try {
      // Gọi API logout để xóa refresh token cookie
      await authService.logout();
      logoutStore();
      // Loại bỏ toast ở đây vì đã hiển thị ở Navbar
      router.push('/login');
    } catch (err) {
      // Ngay cả khi API lỗi, vẫn đăng xuất ở local
      authService.clearToken();
      logoutStore();
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [logoutStore, router]);

  /**
   * Đăng xuất khỏi tất cả các thiết bị
   */
  const logoutAll = useCallback(async () => {
    setLoading(true);
    
    try {
      await authService.logoutAll();
      logoutStore();
      toast.success('Đã đăng xuất khỏi tất cả các thiết bị!');
      router.push('/login');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể đăng xuất khỏi tất cả thiết bị';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [logoutStore, router]);

  /**
   * Gửi email xác thực
   * @param email Email để gửi link xác thực
   * @param isSignUp true nếu đây là đăng ký mới, false nếu đăng nhập
   */
  const emailAuth = useCallback(async (email: string, isSignUp: boolean = false) => {
    setLoading(true);
    setError(null);
    
    try {
      await authService.emailAuth({ email, isSignUp });
      toast.success('Email xác thực đã được gửi. Vui lòng kiểm tra hộp thư của bạn.');
      return true;
    } catch (err: any) {
      const message = err.response?.data?.message || 'Không thể gửi email xác thực';
      setError(message);
      toast.error(message);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Lấy CSRF token
   */
  const getCsrfToken = useCallback(async () => {
    try {
      const response = await authService.getCsrfToken();
      return response.csrfToken;
    } catch (err) {
      console.error('Không thể lấy CSRF token:', err);
      return null;
    }
  }, []);

  /**
   * Lấy thông tin người dùng hiện tại
   */
  const fetchCurrentUser = useCallback(async () => {
    // Nếu không có token, không cần gọi API
    if (!token) {
      return null;
    }
    
    setLoading(true);
    
    try {
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
      setAuthenticated(true);
      return currentUser;
    } catch (err) {
      // Xử lý lỗi và đăng xuất nếu có vấn đề
      console.error("Error fetching current user:", err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [token, setAuthenticated, setUser]);

  /**
   * Lấy danh sách tất cả người dùng (chỉ admin)
   */
  const getAllUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const users = await authService.getAllUsers();
      return users;
    } catch (err: any) {
      const message = err.response?.data?.message || 'Không thể lấy danh sách người dùng';
      setError(message);
      toast.error(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Lấy thông tin của người dùng theo ID
   */
  const getUserById = useCallback(async (userId: string | number) => {
    setLoading(true);
    setError(null);
    
    try {
      const userData = await authService.getUserById(userId);
      return userData;
    } catch (err: any) {
      const message = err.response?.data?.message || 'Không thể lấy thông tin người dùng';
      setError(message);
      toast.error(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Cập nhật thông tin người dùng
   */
  const updateUser = useCallback(async (userId: string | number, userData: UpdateUserDto) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await authService.updateUser(userId, userData);
      // Nếu đang cập nhật thông tin chính mình, cập nhật luôn store
      if (user && user.id === Number(userId)) {
        setUser(response.user);
      }
      toast.success('Cập nhật thông tin thành công!');
      return response;
    } catch (err: any) {
      const message = err.response?.data?.message || 'Không thể cập nhật thông tin người dùng';
      setError(message);
      toast.error(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, setUser]);

  /**
   * Xóa người dùng (chỉ admin)
   */
  const deleteUser = useCallback(async (userId: string | number) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await authService.deleteUser(userId);
      toast.success('Đã xóa người dùng thành công!');
      return response;
    } catch (err: any) {
      const message = err.response?.data?.message || 'Không thể xóa người dùng';
      setError(message);
      toast.error(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Đổi mật khẩu người dùng
   */
  const changePassword = useCallback(async (
    userId: string | number, 
    currentPassword: string, 
    newPassword: string
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await authService.changePassword(userId, { 
        currentPassword, 
        newPassword 
      });
      toast.success('Đổi mật khẩu thành công!');
      return response;
    } catch (err: any) {
      const message = err.response?.data?.message || 'Không thể đổi mật khẩu';
      setError(message);
      toast.error(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Lấy danh sách phim yêu thích của người dùng
   */
  const getUserFavorites = useCallback(async (userId: string | number) => {
    setLoading(true);
    setError(null);
    
    try {
      const favorites = await authService.getUserFavorites(userId);
      return favorites;
    } catch (err: any) {
      const message = err.response?.data?.message || 'Không thể lấy danh sách phim yêu thích';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Lấy lịch sử xem phim của người dùng
   */
  const getUserWatchHistory = useCallback(async (userId: string | number) => {
    setLoading(true);
    setError(null);
    
    try {
      const watchHistory = await authService.getUserWatchHistory(userId);
      return watchHistory;
    } catch (err: any) {
      const message = err.response?.data?.message || 'Không thể lấy lịch sử xem phim';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Refresh token thủ công (hiếm khi cần thiết vì đã có xử lý tự động)
   */
  const refreshToken = useCallback(async () => {
    setLoading(true);
    
    try {
      const newToken = await authService.refreshToken();
      setAuthenticated(true);
      return newToken;
    } catch (err) {
      authService.clearToken();
      logoutStore();
      router.push('/login');
      return null;
    } finally {
      setLoading(false);
    }
  }, [logoutStore, router, setAuthenticated]);

  // Kiểm tra nếu người dùng có vai trò admin
  const isAdmin = !!user && user.role === 'admin';

  return {
    user,
    token,
    loading,
    error,
    isAuthenticated,
    isAdmin,
    register,
    login,
    logout,
    logoutAll,
    emailAuth,
    getCsrfToken,
    fetchCurrentUser,
    refreshToken,
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser,
    changePassword,
    getUserFavorites,
    getUserWatchHistory
  };
};