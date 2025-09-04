import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import Homepage from './pages/Homepage';
import LoginPage from './pages/LoginPage';
import { ProtectedRoute, PublicOnlyRoute } from './components/route/Guards';
import { watchSession, stopWatching } from './lib/sessionValidator';
import { useAuthStore } from './store/authStore';

export function AppInner() {
  const navigate = useNavigate();
  const setToken = useAuthStore(s => s.setToken);
  const setUser = useAuthStore(s => s.setUser);

  // Rehydrate auth state on mount (defensive in case store file init missed or order issue)
  useEffect(() => {
    try {
      const t = localStorage.getItem('auth.token');
      const uRaw = localStorage.getItem('auth.user');
      if (t) setToken(t);
      if (uRaw) setUser(JSON.parse(uRaw));
    } catch { /* ignore */ }
  }, [setToken, setUser]);
  // start watching session for expiry
  useEffect(() => {
    watchSession(navigate);
    return () => stopWatching();
  }, [navigate]);

  return (
    <Routes>
      <Route path="/" element={<ProtectedRoute><Homepage /></ProtectedRoute>} />
      <Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppInner />
    </BrowserRouter>
  );
}

export default App;
