import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Homepage from './pages/Homepage';
import LoginPage from './pages/LoginPage';
import { ProtectedRoute, PublicOnlyRoute } from './components/route/Guards';
import { useEffect } from 'react';
import { useAuthStore } from './store/authStore';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ProtectedRoute><Homepage /></ProtectedRoute>} />
        <Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
