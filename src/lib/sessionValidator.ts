import { isExpired, secondsUntilExpiry } from './authToken';
import { useAuthStore } from '../store/authStore';

let timer: number | null = null;

export function watchSession(navigate: (to: string) => void) {
  // clear prior
  if (timer) { window.clearTimeout(timer); timer = null; }

  const state = useAuthStore.getState();
  const token = state.token;
  if (!token) return;

  // if already expired, logout immediately
  if (isExpired(token, 0)) {
    state.logout();
    navigate('/login');
    return;
  }

  const secs = secondsUntilExpiry(token) ?? 0;
  // schedule a logout 1 second after expiry to be safe
  const delayMs = (secs + 1) * 1000;
  timer = window.setTimeout(() => {
    const s = useAuthStore.getState();
    s.logout();
    navigate('/login');
  }, delayMs);
}

export function stopWatching() {
  if (timer) { window.clearTimeout(timer); timer = null; }
}
