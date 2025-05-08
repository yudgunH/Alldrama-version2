export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'ASC' | 'DESC';
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedData<T> {
  total: number;
  totalPages: number;
  currentPage: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginatedData<T>;
}

export interface MessageResponse {
  message: string;
}

export interface ErrorResponse {
  message: string;
  statusCode?: number;
}