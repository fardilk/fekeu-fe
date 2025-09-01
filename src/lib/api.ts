import { API_URL } from './constants';

export async function apiFetch<T = any>(path: string, opts: RequestInit = {}): Promise<T> {
  // Default to sending credentials so HttpOnly refresh cookies are included
  const defaults: RequestInit = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  };

  const merged: RequestInit = {
    ...defaults,
    ...opts,
    headers: {
      ...(defaults.headers as Record<string, string>),
      ...((opts && opts.headers) as Record<string, string> || {}),
    },
  };

  const res = await fetch(`${API_URL}${path}`, merged);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }
  try {
    return await res.json();
  } catch (e) {
    return (null as unknown) as T;
  }
}
