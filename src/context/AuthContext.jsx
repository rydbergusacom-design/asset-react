import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api, bootstrapSession, setCsrf } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [baseUrl, setBaseUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await bootstrapSession();
      setUser(data.user_id || null);
      setBaseUrl(data.base_url || '');
      if (data.csrf) setCsrf(data.csrf);
    } catch (e) {
      setUser(null);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = async (userId, password) => {
    const data = await api('login', { user_id: userId, password });
    // Re-bootstrap to get fresh CSRF after session_regenerate_id
    await refresh();
    return data;
  };

  const logout = async () => {
    try {
      await api('logout');
    } catch {
      /* ignore */
    }
    setUser(null);
    await refresh();
  };

  return (
    <AuthContext.Provider value={{ user, baseUrl, loading, error, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
