import { 
  Episode, 
  PaginatedEpisodeResponse, 
  CreateEpisodeDto, 
  UpdateEpisodeDto,
  EpisodeViewRequest,
  ProcessingStatusResponse,
  ViewResponse
} from '@/types';
import { apiClient } from '../apiClient';
import { API_ENDPOINTS } from '../endpoints';

export const episodeService = {
  /**
   * Lấy danh sách tập phim theo Movie ID
   * @param movieId ID của phim
   */
  async getEpisodesByMovieId(movieId: string | number): Promise<Episode[]> {
    return apiClient.get<Episode[]>(API_ENDPOINTS.EPISODES.LIST_BY_MOVIE(movieId));
  },
  
  /**
   * Lấy chi tiết tập phim theo ID
   * @param episodeId ID của tập phim
   */
  async getEpisodeById(episodeId: string | number): Promise<Episode> {
    return apiClient.get<Episode>(API_ENDPOINTS.EPISODES.DETAIL(episodeId));
  },
  
  /**
   * Tạo tập phim mới (chỉ Admin)
   * @param data Dữ liệu tạo tập phim
   */
  async createEpisode(data: CreateEpisodeDto): Promise<{ message: string; episode: Episode }> {
    return apiClient.post<{ message: string; episode: Episode }>(
      API_ENDPOINTS.EPISODES.CREATE,
      data
    );
  },
  
  /**
   * Cập nhật tập phim (chỉ Admin)
   * @param episodeId ID của tập phim
   * @param data Dữ liệu cập nhật
   */
  async updateEpisode(
    episodeId: string | number, 
    data: UpdateEpisodeDto
  ): Promise<{ message: string; episode: Episode }> {
    return apiClient.put<{ message: string; episode: Episode }>(
      API_ENDPOINTS.EPISODES.UPDATE(episodeId),
      data
    );
  },
  
  /**
   * Xóa tập phim (chỉ Admin)
   * @param episodeId ID của tập phim
   */
  async deleteEpisode(episodeId: string | number): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(API_ENDPOINTS.EPISODES.DELETE(episodeId));
  },
  
  /**
   * Tăng lượt xem cho tập phim
   * @param episodeId ID của tập phim
   * @param data Dữ liệu xem phim
   */
  async incrementView(
    episodeId: string | number, 
    data: EpisodeViewRequest
  ): Promise<ViewResponse> {
    return apiClient.post<ViewResponse>(
      API_ENDPOINTS.VIEWS.INCREMENT_EPISODE(episodeId),
      data
    );
  },
  
  /**
   * Kiểm tra trạng thái xử lý video của tập phim
   * @param episodeId ID của tập phim
   */
  async getProcessingStatus(episodeId: string | number): Promise<ProcessingStatusResponse> {
    return apiClient.get<ProcessingStatusResponse>(
      API_ENDPOINTS.MEDIA.PROCESSING_STATUS(String(episodeId))
    );
  }
};