export interface User {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface Transcript {
  id: string;
  userId: string;
  title: string | null;
  content: string | null;
  duration: number;
  wordCount: number;
  charCount: number;
  language: string;
  source: "microphone" | "upload";
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface TranscriptListItem {
  id: string;
  title: string | null;
  duration: number;
  wordCount: number;
  charCount: number;
  language: string;
  source: string;
  createdAt: string;
  updatedAt: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

export interface TranscriptListResponse {
  transcripts: TranscriptListItem[];
  pagination: Pagination;
}
