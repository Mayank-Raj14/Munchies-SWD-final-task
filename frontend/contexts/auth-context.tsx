'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
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
  warningCount?: number;
  emailNotificationsEnabled?: boolean;
  preferences?: {
    bookings: boolean;
    promotions: boolean;
    newStores: boolean;
  } | null;
  globalBlock?: {
    reason: string;
    createdAt: string;
  } | null;
};

export type AuthContextValue = {
  user: AuthUser | null;
  isLoading: boolean;
  hasCheckedAuth: boolean;
  connectionError: string | null;
  refreshUser: (options?: { silent?: boolean }) => Promise<void>;
  setUserFromAuth: (user: AuthUser) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const refreshVersion = useRef(0);

  // Abort controller to cancel in-flight auth requests
const abortControllerRef = useRef<AbortController | null>(null);

const refreshUser = useCallback(async (options: { silent?: boolean } = {}) => {
  // Cancel any previous request
  if (abortControllerRef.current) {
    abortControllerRef.current.abort();
  }
  const abortController = new AbortController();
  abortControllerRef.current = abortController;

  const version = refreshVersion.current + 1;
  refreshVersion.current = version;
  const token = getAuthToken();

  if (!token) {
    if (version !== refreshVersion.current) return;
    setUser(null);
    setConnectionError(null);
    setIsLoading(false);
    setHasCheckedAuth(true);
    return;
  }

  if (!options.silent) setIsLoading(true);

  try {
    const data = await getCurrentUser({ signal: abortController.signal });
    if (version !== refreshVersion.current) return;
    setUser(data.user);
    setConnectionError(null);
    setHasCheckedAuth(true);
  } catch (error) {
    if (version !== refreshVersion.current) return;
    if (error instanceof ApiError && error.status === 401) {
      clearAuthToken();
      setUser(null);
      setConnectionError(null);
      setHasCheckedAuth(true);
      return;
    }
    if (error instanceof ApiError && error.status === 0) {
      setConnectionError('Unable to reach the API. Check that the backend is running.');
      setHasCheckedAuth(true);
      return;
    }
    setConnectionError(error instanceof Error ? error.message : 'Unable to refresh your session.');
    setHasCheckedAuth(true);
  } finally {
    if (version === refreshVersion.current) {
      setIsLoading(false);
      setHasCheckedAuth(true);
    }
    abortControllerRef.current = null;
  }
}, []);

// Cleanup any pending request on unmount
useEffect(() => {
  return () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };
}, []);

  useEffect(() => {
    void refreshUser();

    const onAuthChanged = () => {
      void refreshUser();
    };

    const onRefreshRequested = () => {
      void refreshUser({ silent: true });
    };

    const onStorage = (event: StorageEvent) => {
      if (event.key === 'munchies_token') {
        void refreshUser({ silent: true });
      }
    };

    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        void refreshUser({ silent: true });
      }
    };

    window.addEventListener('munchies-auth-changed', onAuthChanged);
    window.addEventListener('munchies-auth-refresh-requested', onRefreshRequested);
    window.addEventListener('storage', onStorage);
    window.addEventListener('focus', onAuthChanged);
    document.addEventListener('visibilitychange', onVisible);
    const refreshTimer = window.setInterval(() => {
      void refreshUser({ silent: true });
    }, 30000);

    return () => {
      window.removeEventListener('munchies-auth-changed', onAuthChanged);
      window.removeEventListener('munchies-auth-refresh-requested', onRefreshRequested);
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('focus', onAuthChanged);
      document.removeEventListener('visibilitychange', onVisible);
      window.clearInterval(refreshTimer);
    };
  }, [refreshUser]);

  const setUserFromAuth = useCallback((nextUser: AuthUser) => {
    setUser(nextUser);
    setConnectionError(null);
    setIsLoading(false);
    setHasCheckedAuth(true);
  }, []);

  const logout = useCallback(() => {
    clearAuthToken();
    setUser(null);
    setConnectionError(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      hasCheckedAuth,
      connectionError,
      refreshUser,
      setUserFromAuth,
      logout,
    }),
    [user, isLoading, hasCheckedAuth, connectionError, refreshUser, setUserFromAuth, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  // Guard against premature redirects before auth check completes
  if (!context.hasCheckedAuth) {
    // Show nothing (or a skeleton) while auth state resolves
    return {
      ...context,
      user: null,
    };
  }

  return context;
};
