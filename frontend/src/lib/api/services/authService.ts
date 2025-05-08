import { AuthResponse, LoginCredentials, RegisterCredentials, User, UpdateUserDto } from '@/types';
import { apiClient } from '../apiClient';
import { API_ENDPOINTS } from '../endpoints';
import { refreshTokenEndpoint, refreshAccessToken } from '../authHelper';
import { useAuthStore } from '@/store/authStore';

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
    const result = await apiClient.post<{ message: string }>(API_ENDPOINTS.AUTH.LOGOUT);
    this.clearToken();
    return result;
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
    data: { currentPassword: string; newPassword: string }
  ): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>(
      API_ENDPOINTS.USERS.CHANGE_PASSWORD(userId), 
      data
    );
  },

  /**
   * Lấy danh sách phim yêu thích của người dùng
   * @param userId ID của người dùng
   */
  async getUserFavorites(userId: string | number): Promise<any[]> {
    return apiClient.get<any[]>(API_ENDPOINTS.USERS.FAVORITES(userId));
  },

  /**
   * Lấy lịch sử xem phim của người dùng
   * @param userId ID của người dùng
   */
  async getUserWatchHistory(userId: string | number): Promise<any[]> {
    return apiClient.get<any[]>(API_ENDPOINTS.USERS.WATCH_HISTORY(userId));
  },

  /**
   * Lưu token vào localStorage và authStore
   * @param token JWT token
   */
  saveToken(token: string): void {
    // Lưu vào cookie để middleware có thể đọc
    document.cookie = `accessToken=${token}; path=/; max-age=86400; SameSite=Strict`;
    
    // Cập nhật authStore
    const authStore = useAuthStore.getState();
    authStore.setToken(token);
  },

  /**
   * Xóa token khỏi localStorage và authStore
   */
  clearToken(): void {
    // Xóa token khỏi cookie
    document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    
    // Cập nhật authStore
    const authStore = useAuthStore.getState();
    authStore.setToken(null);
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
   * Lấy token từ store
   */
  getToken(): string | null {
    const authStore = useAuthStore.getState();
    return authStore.token;
  }
};