import { useState, useCallback } from 'react';
import type { User } from '../types/user';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);

  const login = useCallback(async (email: string, password: string) => {
    // placeholder: call API and set user
    // const u = await api.login(email, password)
    const u: User = { id: '1', name: 'Demo User', email };
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(() => setUser(null), []);

  return { user, login, logout };
}
