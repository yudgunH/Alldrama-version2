import { User, Favorite, WatchHistory } from '@/types';
import { apiClient } from '../apiClient';
import { API_ENDPOINTS } from '../endpoints';

export interface UpdateUserRequest {
  full_name?: string;
  email?: string;
  password?: string;
  role?: 'user' | 'admin' | 'subscriber';
  subscriptionExpiredAt?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface UserListResponse {
  users: User[];
  totalPages: number;
  currentPage: number;
  totalUsers: number;
}

export const userService = {
  /**
   * Lấy danh sách người dùng (Admin)
   * @param page Số trang
   * @param limit Số lượng mỗi trang
   */
  async getUsers(page: number = 1, limit: number = 10): Promise<UserListResponse> {
    const params = new URLSearchParams();
    params.append('page', String(page));
    params.append('limit', String(limit));
    
    return apiClient.get<UserListResponse>(`${API_ENDPOINTS.USERS.LIST}?${params.toString()}`);
  },

  /**
   * Lấy thông tin người dùng theo ID
   * @param id ID người dùng
   */
  async getUserById(id: string | number): Promise<User> {
    return apiClient.get<User>(API_ENDPOINTS.USERS.DETAIL(id));
  },

  /**
   * Cập nhật thông tin người dùng
   * @param id ID người dùng
   * @param data Dữ liệu cập nhật
   */
  async updateUser(id: string | number, data: UpdateUserRequest): Promise<User> {
    return apiClient.put<User>(API_ENDPOINTS.USERS.UPDATE(id), data);
  },

  /**
   * Xóa người dùng (Admin)
   * @param id ID người dùng
   */
  async deleteUser(id: string | number): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(API_ENDPOINTS.USERS.DELETE(id));
  },

  /**
   * Đổi mật khẩu
   * @param id ID người dùng
   * @param data Dữ liệu đổi mật khẩu
   */
  async changePassword(
    id: string | number,
    data: ChangePasswordRequest
  ): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>(
      API_ENDPOINTS.USERS.CHANGE_PASSWORD(id),
      data
    );
  },

  /**
   * Lấy danh sách phim yêu thích của người dùng
   * @param id ID người dùng
   */
  async getUserFavorites(id: string | number): Promise<Favorite[]> {
    return apiClient.get<Favorite[]>(API_ENDPOINTS.USERS.FAVORITES(id));
  },

  /**
   * Lấy lịch sử xem của người dùng
   * @param id ID người dùng
   */
  async getUserWatchHistory(id: string | number): Promise<WatchHistory[]> {
    return apiClient.get<WatchHistory[]>(API_ENDPOINTS.USERS.WATCH_HISTORY(id));
  }
};