// Utilities for JWT handling (no external deps)
export interface DecodedJwt { exp?: number; [k: string]: any }

export function decodeJwt(token: string | null): DecodedJwt | null {
  if (!token) return null;
  try {
    const base64 = token.split('.')[1];
    if (!base64) return null;
    const json = atob(base64.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decodeURIComponent(escape(json)));
  } catch {
    return null;
  }
}

export function isExpired(token: string | null, skewSeconds = 0): boolean {
  const decoded = decodeJwt(token);
  if (!decoded || !decoded.exp) return false; // if no exp treat as non-expiring
  const now = Math.floor(Date.now() / 1000);
  return decoded.exp <= now + skewSeconds;
}

export function secondsUntilExpiry(token: string | null): number | null {
  const decoded = decodeJwt(token);
  if (!decoded || !decoded.exp) return null;
  const now = Math.floor(Date.now() / 1000);
  return decoded.exp - now;
}
