export interface ApiResponse<T> {
  success: true;
  message: string;
  data: T;
}

export interface ApiErrorBody {
  success: false;
  message: string;
  details?: Record<string, string[] | undefined>;
}
