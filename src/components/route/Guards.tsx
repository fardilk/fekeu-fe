import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

export const ProtectedRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const token = useAuthStore(s => s.token);
  const initializing = useAuthStore(s => s.initializing);
  const init = useAuthStore(s => s.init);

  useEffect(() => { if (init) { init(); } }, [init]);

  if (initializing) return null; // or a spinner
  if (!token) return <Navigate to="/login" replace />;
  return children;
};

export const PublicOnlyRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const token = useAuthStore(s => s.token);
  const initializing = useAuthStore(s => s.initializing);
  const init = useAuthStore(s => s.init);

  useEffect(() => { if (init) { init(); } }, [init]);

  if (initializing) return null;
  if (token) return <Navigate to="/" replace />;
  return children;
};
