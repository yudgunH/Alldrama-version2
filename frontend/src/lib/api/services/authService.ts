import { AuthResponse, LoginCredentials, RegisterCredentials, User, UpdateUserDto } from '@/types';
import { apiClient } from '../apiClient';
import { API_ENDPOINTS } from '../endpoints';
import { refreshTokenEndpoint, refreshAccessToken } from '../authHelper';
import { useAuthStore } from '@/store/auth';
import { jwtDecode } from 'jwt-decode';
import { Favorite } from '@/types';
import { WatchHistory } from '@/types';

// Thêm các hàm tiện ích để làm việc với cookies
const setCookie = (name: string, value: string, days = 7) => {
  if (typeof document === 'undefined') return;
  
  const expires = new Date(Date.now() + days * 86400000).toUTCString();
  document.cookie = `${name}=${value}; expires=${expires}; path=/; SameSite=Strict`;
};

const deleteCookie = (name: string) => {
  if (typeof document === 'undefined') return;
  
  // Xóa cả 3 phiên bản cookie với path khác nhau để đảm bảo xóa sạch
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Strict`;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax`;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=None; Secure`;
  
  // Log xác nhận
  console.log(`Cookie '${name}' đã được xóa.`);
};

// Interface cho custom window object
interface CustomWindow extends Window {
  _isHandlingLogout?: boolean;
}

export const authService = {
  /**
   * Đăng ký người dùng mới
   * @param credentials Thông tin đăng ký
   */
  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    return apiClient.post<AuthResponse>(API_ENDPOINTS.AUTH.REGISTER, credentials);
  },

  /**
   * Đăng nhập
   * @param credentials Thông tin đăng nhập
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    return apiClient.post<AuthResponse>(API_ENDPOINTS.AUTH.LOGIN, credentials);
  },

  /**
   * Đăng xuất
   * Gọi API đăng xuất để xóa refresh token cookie trên server
   */
  async logout(): Promise<{ message: string }> {
    try {
      // Kiểm tra nếu đang trong quá trình đăng xuất, không gọi API lại
      if (typeof window !== 'undefined') {
        const customWindow = window as CustomWindow;
        if (customWindow._isHandlingLogout) {
          return { message: 'Đang trong quá trình đăng xuất' };
        }
      }
      
      // Xóa token khỏi client trước để ngăn các request không mong muốn
      this.clearToken();
      
      // Thực hiện gọi API logout cuối cùng để xóa token ở server
      try {
    const result = await apiClient.post<{ message: string }>(API_ENDPOINTS.AUTH.LOGOUT);
        
        // Log thông tin xác nhận
        console.log('Đăng xuất thành công, đã xóa token.');
        
        return result;
      } catch (error) {
        // Sử dụng khối try-catch riêng để đảm bảo rằng lỗi API không ảnh hưởng đến phần còn lại
        // Chỉ log lỗi chứ không throw
        console.error('Lỗi khi gọi API logout:', error);
        return { message: 'Đã đăng xuất cục bộ' };
      }
    } catch (error) {
      console.error('Lỗi khi gọi API logout:', error);
      // Vẫn đảm bảo token được xóa ngay cả khi API fail
    this.clearToken();
      
      // Trả về kết quả giả để tránh lỗi
      return { message: 'Đã đăng xuất cục bộ' };
    }
  },

  /**
   * Đăng xuất khỏi tất cả thiết bị
   */
  async logoutAll(): Promise<{ message: string }> {
    const result = await apiClient.post<{ message: string }>(API_ENDPOINTS.AUTH.LOGOUT_ALL);
    this.clearToken();
    return result;
  },

  /**
   * Lấy thông tin người dùng hiện tại
   */
  async getCurrentUser(): Promise<User> {
    return apiClient.get<User>(API_ENDPOINTS.AUTH.ME);
  },

  /**
   * Lấy danh sách người dùng (chỉ admin)
   */
  async getAllUsers(): Promise<User[]> {
    return apiClient.get<User[]>(API_ENDPOINTS.USERS.LIST);
  },

  /**
   * Lấy thông tin người dùng theo ID
   * @param userId ID của người dùng
   */
  async getUserById(userId: string | number): Promise<User> {
    return apiClient.get<User>(API_ENDPOINTS.USERS.DETAIL(userId));
  },

  /**
   * Cập nhật thông tin người dùng
   * @param userId ID của người dùng
   * @param userData Dữ liệu cập nhật
   */
  async updateUser(userId: string | number, userData: UpdateUserDto): Promise<{ message: string; user: User }> {
    return apiClient.put<{ message: string; user: User }>(
      API_ENDPOINTS.USERS.UPDATE(userId),
      userData
    );
  },

  /**
   * Xóa người dùng (chỉ admin)
   * @param userId ID của người dùng
   */
  async deleteUser(userId: string | number): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(API_ENDPOINTS.USERS.DELETE(userId));
  },

  /**
   * Thay đổi mật khẩu người dùng
   * @param userId ID của người dùng
   * @param data Dữ liệu đổi mật khẩu
   */
  async changePassword(
    userId: string | number, 
    data: { 
      full_name: string;
      email: string;
      password: string;
    }
  ): Promise<{ message: string }> {
    return apiClient.put<{ message: string }>(
      API_ENDPOINTS.USERS.CHANGE_PASSWORD(userId), 
      data
    );
  },

  /**
   * Lấy danh sách phim yêu thích của người dùng
   * @param userId ID của người dùng
   */
  async getUserFavorites(userId: string | number): Promise<Favorite[]> {
    return apiClient.get<Favorite[]>(API_ENDPOINTS.USERS.FAVORITES(userId));
  },

  /**
   * Lấy lịch sử xem phim của người dùng
   * @param userId ID của người dùng
   */
  async getUserWatchHistory(userId: string | number): Promise<WatchHistory[]> {
    return apiClient.get<WatchHistory[]>(API_ENDPOINTS.USERS.WATCH_HISTORY(userId));
  },

  /**
   * Lưu token vào authStore và cookie
   * @param token JWT token
   */
  saveToken(token: string): void {
    // Lưu token vào Zustand store
    const authStore = useAuthStore.getState();
    authStore.setToken(token);
    
    // Lưu token vào cookie để middleware có thể truy cập
    setCookie('accessToken', token, 7); // Lưu trong 7 ngày
  },

  /**
   * Xóa token khỏi authStore và cookie
   */
  clearToken(): void {
    // Xóa token khỏi Zustand store
    const authStore = useAuthStore.getState();
    authStore.setToken(null);
    
    // Xóa token khỏi cookie
    deleteCookie('accessToken');
  },

  /**
   * Kiểm tra xem người dùng đã đăng nhập chưa
   */
  isAuthenticated(): boolean {
    // Kiểm tra từ authStore
    const authStore = useAuthStore.getState();
    return !!authStore.token;
  },
  
  /**
   * Thực hiện refresh token
   * Backend sẽ đọc refresh token từ HTTP-Only cookie và cấp access token mới
   */
  async refreshToken(): Promise<string> {
    try {
      const newToken = await refreshAccessToken();
      this.saveToken(newToken);
      return newToken;
    } catch (error) {
      this.clearToken();
      throw error;
    }
  },

  /**
   * Gửi email xác thực đăng nhập/đăng ký
   * @param data Dữ liệu chứa email và loại xác thực
   */
  async emailAuth(data: { email: string; isSignUp?: boolean }): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>(
      API_ENDPOINTS.AUTH.EMAIL_AUTH, 
      data
    );
  },
  
  /**
   * Lấy CSRF token
   */
  async getCsrfToken(): Promise<{ csrfToken: string }> {
    return apiClient.get<{ csrfToken: string }>(API_ENDPOINTS.AUTH.CSRF_TOKEN);
  },

  /**
   * Lấy token từ store hoặc cookie
   */
  getToken(): string | null {
    // Kiểm tra từ authStore
    const authStore = useAuthStore.getState();
    if (authStore.token) {
    return authStore.token;
    }
    
    // Nếu không có trong store, thử lấy từ cookie
    if (typeof document !== 'undefined') {
      try {
        const cookies = document.cookie.split(';');
        for (const cookie of cookies) {
          const [name, value] = cookie.trim().split('=');
          if (name === 'accessToken' && value) {
            // Nếu tìm thấy token trong cookie, cập nhật vào store
            this.saveToken(value);
            return value;
          }
        }
      } catch (error) {
        console.error('Lỗi khi đọc token từ cookie:', error);
      }
    }
    
    return null;
  },

  /**
   * Kiểm tra xem token đã hết hạn chưa
   * @param token JWT token cần kiểm tra
   * @returns true nếu token đã hết hạn hoặc không hợp lệ
   */
  isTokenExpired(token: string): boolean {
    try {
      const decoded = jwtDecode<{ exp: number }>(token);
      return decoded.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  }
};