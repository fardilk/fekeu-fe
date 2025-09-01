import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import { API_URL } from './constants';
import { isExpired } from './authToken';
import { useToast } from '../components/ui/ToastContext';
import { useAuthStore } from '../store/authStore';

// Environment resolution
// Expected Vite env vars: VITE_API_URL_DEV, VITE_API_URL_STAGING, VITE_API_URL_PROD, VITE_API_TIMEOUT
const NODE_ENV = import.meta.env.MODE || 'development';
const env = NODE_ENV.toLowerCase();

const apiUrlFromEnv =
  (env === 'production' && import.meta.env.VITE_API_URL_PROD) ||
  (env === 'staging' && import.meta.env.VITE_API_URL_STAGING) ||
  (env === 'development' && import.meta.env.VITE_API_URL_DEV) ||
  import.meta.env.VITE_API_URL ||
  API_URL;

const timeoutMs = Number(import.meta.env.VITE_API_TIMEOUT || 15000);

export type ApiError = {
  message: string;
  status?: number;
  data?: any;
};

type RefreshHandler = () => Promise<string | null> | null;

const client: AxiosInstance = axios.create({
  baseURL: apiUrlFromEnv,
  timeout: timeoutMs,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  withCredentials: false,
});
// When working with HttpOnly refresh cookies the client should send credentials
// so the browser accepts cookies from the API. Keep this default unless you
// specifically need to opt-out for certain requests.
client.defaults.withCredentials = true;

let authToken: string | null = null;
let refreshHandler: RefreshHandler | null = null;
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token?: string | null) => void;
  reject: (err: any) => void;
}> = [];

function processQueue(error: any, token: string | null = null) {
  failedQueue.forEach((p) => {
    if (error) p.reject(error);
    else p.resolve(token);
  });
  failedQueue = [];
}

export function setAuthToken(token: string | null) {
  authToken = token;
  if (token) client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  else delete client.defaults.headers.common['Authorization'];
}

// Hydrate token from localStorage if present (remember-me)
try {
  const stored = localStorage.getItem('auth.token');
  if (stored) setAuthToken(stored);
} catch (_) {/* ignore SSR / access errors */}

export function setRefreshTokenHandler(handler: RefreshHandler) {
  refreshHandler = handler;
}

// Default refresh handler (can be overridden) assumes backend sets HttpOnly cookie and returns { token }
if (!refreshHandler) {
  setRefreshTokenHandler(async () => {
    try {
      const res = await client.post<{ token: string }>(
        '/refresh',
        {},
        { withCredentials: true }
      );
      return res.data?.token || null;
    } catch {
      return null;
    }
  });
}

// Request interceptor: attach token if present
client.interceptors.request.use(
  async (config) => {
    config.headers = config.headers ?? ({} as any);
    if (authToken) {
      // Check expiry; if expired attempt refresh before sending
      if (isExpired(authToken, 5) && refreshHandler) {
        try {
          const newTok = await refreshHandler();
          if (newTok) setAuthToken(newTok);
        } catch {
          // swallow; request may fail later with 401
        }
      }
      (config.headers as any)['Authorization'] = `Bearer ${authToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401 and other errors centrally
client.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
    // Use toast and logout hooks (safe in React context)
    let showToast: ((msg: string, type?: 'error' | 'info' | 'success') => void) | undefined;
    let logout: (() => void) | undefined;
    try {
      showToast = useToast().showToast;
      logout = (useAuthStore.getState() as any).logout;
    } catch {}

    if (error.response && error.response.status === 401 && refreshHandler) {
      if (originalRequest && !originalRequest._retry) {
        if (isRefreshing) {
          return new Promise(function (resolve, reject) {
            failedQueue.push({ resolve, reject });
          })
            .then((token) => {
              if (token && originalRequest.headers) originalRequest.headers['Authorization'] = `Bearer ${token}`;
              return client(originalRequest);
            })
            .catch((err) => Promise.reject(err));
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          const newToken = await refreshHandler();
          setAuthToken(newToken);
          processQueue(null, newToken);
          if (newToken && originalRequest.headers) originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
          return client(originalRequest);
        } catch (err) {
          processQueue(err, null);
          if (showToast) showToast('Session expired. Please log in again.', 'error');
          if (logout) logout();
          return Promise.reject(err);
        } finally {
          isRefreshing = false;
        }
      }
    }

    return Promise.reject(formatAxiosError(error));
  }
);

function formatAxiosError(error: AxiosError): ApiError {
  if (error.response) {
    const data = error.response.data as any;
    const message = (data && (data.message ?? data.error ?? data)) || error.message || 'Request failed';
    return { message: String(message), status: error.response.status, data };
  }

  if (error.request) {
    return { message: 'No response received from server', data: null };
  }

  return { message: error.message };
}

// Simple helpers
export async function get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
  try {
    const res = await client.get<T>(url, config);
    return res.data as T;
  } catch (e) {
    throw normalizeError(e);
  }
}

export async function post<T = any>(url: string, body?: any, config?: AxiosRequestConfig): Promise<T> {
  try {
    const res = await client.post<T>(url, body, config);
    return res.data as T;
  } catch (e) {
    throw normalizeError(e);
  }
}

export async function put<T = any>(url: string, body?: any, config?: AxiosRequestConfig): Promise<T> {
  try {
    const res = await client.put<T>(url, body, config);
    return res.data as T;
  } catch (e) {
    throw normalizeError(e);
  }
}

export async function del<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
  try {
    const res = await client.delete<T>(url, config);
    return res.data as T;
  } catch (e) {
    throw normalizeError(e);
  }
}

function normalizeError(e: any): ApiError {
  if (axios.isAxiosError(e)) return formatAxiosError(e as AxiosError);
  return { message: String(e) };
}

export { client as axiosClient };

export default {
  client,
  setAuthToken,
  setRefreshTokenHandler,
  get,
  post,
  put,
  del,
};

// Attempt to refresh access token using refresh cookie. Returns new token or null.
export async function attemptRefresh(): Promise<string | null> {
  try {
    const res = await client.post<{ token: string }>('/refresh', {}, { withCredentials: true });
    const newTok = res.data?.token || null;
    if (newTok) setAuthToken(newTok);
    return newTok;
  } catch {
    return null;
  }
}
