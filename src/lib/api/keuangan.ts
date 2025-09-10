import { get } from '../axio';
import axios from 'axios';

export interface LoginRequest { username: string; password: string; }
export interface LoginResponse { message?: string; token: string; refresh_token?: string; }
export interface CatatanItem { id: number; nominal: number; kategori?: string; created_at?: string; updated_at?: string; }
export interface RevenuePerMonth { month: string; total: number; }

export async function login(data: LoginRequest): Promise<LoginResponse> {
  // Call auth API directly with a clear JSON body to avoid proxy/quoting pitfalls.
  // Priority: VITE_AUTH_API_URL > VITE_UPLOAD_API_URL > http://127.0.0.1:8081
  const base =
    (import.meta as any).env?.VITE_AUTH_API_URL ||
    (import.meta as any).env?.VITE_UPLOAD_API_URL ||
    'http://127.0.0.1:8081';
  const url = String(base).replace(/\/?$/, '') + '/login';

  const res = await axios.post(url, data, {
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    withCredentials: true,
  });

  const raw: any = res.data;
  // Normalize various backend shapes: { token }, { access_token, refresh_token }, { accessToken }
  const token = raw?.token || raw?.access_token || raw?.accessToken || '';
  const refresh_token = raw?.refresh_token || raw?.refreshToken;
  const message = raw?.message;
  return { message, token, refresh_token } as LoginResponse;
}

export function getCatatanList() {
  return get<CatatanItem[]>('/catatan');
}

// Try to fetch a server-provided total first; if not available, fall back to fetching list and summing.
export async function getCatatanTotal(): Promise<number> {
  try {
    // server may expose /catatan/total returning { total: number }
    const res = await axios.get((import.meta as any).env?.VITE_UPLOAD_API_URL ? String((import.meta as any).env.VITE_UPLOAD_API_URL).replace(/\/$/, '') + '/catatan/total' : '/catatan/total', { withCredentials: true });
    const data: any = res.data;
    if (typeof data === 'object' && (typeof data.total === 'number' || typeof data.total === 'string')) {
      return Number(data.total) || 0;
    }
  } catch (e) {
    // ignore and fallback to list
  }

  const list = await getCatatanList();
  return (list || []).reduce((s, it: any) => s + Number(it.Amount ?? it.amount ?? it.nominal ?? 0), 0);
}

export function getCatatan(id: number|string) {
  return get<CatatanItem>(`/catatan/${id}`);
}

export function getRevenuePerMonth() {
  return get<RevenuePerMonth[]>('/catatan/revenue');
}
