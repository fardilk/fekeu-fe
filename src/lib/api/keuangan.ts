import { get, post } from '../axio';

export interface LoginRequest { username: string; password: string; }
export interface LoginResponse { message?: string; token: string; refresh_token?: string; }
export interface CatatanItem { id: number; nominal: number; kategori?: string; created_at?: string; updated_at?: string; }
export interface RevenuePerMonth { month: string; total: number; }

export function login(data: LoginRequest) {
  // Ensure the request carries credentials so backend may set an HttpOnly refresh cookie
  return post<LoginResponse>('/login', data, { withCredentials: true });
}

export function getCatatanList() {
  return get<CatatanItem[]>('/catatan');
}

export function getCatatan(id: number|string) {
  return get<CatatanItem>(`/catatan/${id}`);
}

export function getRevenuePerMonth() {
  return get<RevenuePerMonth[]>('/catatan/revenue');
}
