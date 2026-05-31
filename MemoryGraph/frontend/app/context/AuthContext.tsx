'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { API_URL, setAccessToken } from '@/app/lib/api';

interface User {
  id: string;
  email: string;
  full_name?: string;
  plan: string;
  storage_limit_mb: number;
  current_storage_bytes: number;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (user: User, accessToken?: string) => void;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function fetchSession(): Promise<User | null> {
  const response = await fetch(`${API_URL}/auth/session`, { credentials: 'include' });
  if (!response.ok) return null;
  const data = await response.json();
  if (data.access_token) setAccessToken(data.access_token);
  if (data.authenticated && data.user) return data.user as User;
  setAccessToken(null);
  return null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    setUser(await fetchSession());
  }, []);

  const bootstrap = useCallback(async () => {
    try {
      setUser(await fetchSession());
    } catch {
      setUser(null);
      setAccessToken(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  const login = useCallback((newUser: User, accessToken?: string) => {
    if (accessToken) setAccessToken(accessToken);
    setUser(newUser);
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch(`${API_URL}/auth/logout`, { method: 'POST', credentials: 'include' });
    } catch {
      /* ignore */
    }
    setAccessToken(null);
    setUser(null);
  }, []);

  const isAuthenticated = Boolean(user);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated,
      login,
      logout,
      refreshSession,
    }),
    [user, isLoading, isAuthenticated, login, logout, refreshSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
