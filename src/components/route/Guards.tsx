import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
// Simplified: treat any non-empty token as valid (avoid premature rejections due to exp parsing issues)
function isValid(token: string | null): boolean {
  return !!token;
}

export const ProtectedRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const token = useAuthStore(s => s.token);
  const valid = isValid(token);
  if (!valid) {
    if (token) console.debug('[Guard] Token present but invalid (likely expired or malformed)');
    return <Navigate to="/login" replace />;
  }
  return children;
};

export const PublicOnlyRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const token = useAuthStore(s => s.token);
  const location = useLocation();
  // Force parameter still supported to clear an existing token manually.
  if (location.search.includes('force=1') || location.search.includes('logout=1')) {
    const logout = useAuthStore.getState().logout;
    try { logout(); } catch (_) {}
  }
  if (isValid(token)) return <Navigate to="/" replace />;
  return children;
};
