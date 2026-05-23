'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { ApiError } from '@/services/api';
import { clearAuthToken, getAuthToken, getCurrentUser } from '@/services/auth';

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: 'USER' | 'STORE_OWNER' | 'ADMIN';
};

type AuthContextValue = {
  user: AuthUser | null;
  isLoading: boolean;
  refreshUser: () => Promise<void>;
  setUserFromAuth: (user: AuthUser) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const token = getAuthToken();

    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const data = await getCurrentUser();
      setUser(data.user);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        clearAuthToken();
        setUser(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshUser();

    const onAuthChanged = () => {
      void refreshUser();
    };

    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        void refreshUser();
      }
    };

    window.addEventListener('munchies-auth-changed', onAuthChanged);
    window.addEventListener('focus', onAuthChanged);
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      window.removeEventListener('munchies-auth-changed', onAuthChanged);
      window.removeEventListener('focus', onAuthChanged);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [refreshUser]);

  const setUserFromAuth = useCallback((nextUser: AuthUser) => {
    setUser(nextUser);
    setIsLoading(false);
  }, []);

  const logout = useCallback(() => {
    clearAuthToken();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      refreshUser,
      setUserFromAuth,
      logout,
    }),
    [user, isLoading, refreshUser, setUserFromAuth, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
};
