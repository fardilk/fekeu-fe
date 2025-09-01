import React from 'react';
import { useAuthStore } from '../../store/authStore';
import { Button } from './Button';
import { axiosClient, setAuthToken } from '../../lib/axio';

export const LogoutButton: React.FC = () => {
  const logout = useAuthStore(s => (s as any).logout);
  const handle = async () => {
    try {
      // optional backend endpoint to clear refresh cookie
      await axiosClient.post('/logout', {}, { withCredentials: true }).catch(() => {});
    } catch { /* ignore */ }
    setAuthToken(null);
    logout();
  };
  return <Button variant="secondary" onClick={handle}>Logout</Button>;
};

export default LogoutButton;