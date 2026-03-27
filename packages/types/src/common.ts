// Shared pagination / response shapes used across API and frontend

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  };
}

export interface ApiResponse<T = void> {
  success: true;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface PaginationQuery {
  page?: number;
  perPage?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

export type ID = string;

export interface Timestamps {
  createdAt: string;
  updatedAt: string;
}

export interface SoftDeletable extends Timestamps {
  deletedAt: string | null;
}

export interface AuditFields extends SoftDeletable {
  createdBy: string | null;
  updatedBy: string | null;
}
