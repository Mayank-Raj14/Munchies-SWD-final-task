'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo } from 'react';

import { useAuth, type AuthUser } from '@/contexts/auth-context';

type Role = AuthUser['role'];

export const useRequireAuth = (allowedRoles?: Role[]) => {
  const router = useRouter();
  const { user, isLoading, refreshUser } = useAuth();

  const isAuthorized = useMemo(() => {
    if (!user) {
      return false;
    }

    if (!allowedRoles) {
      return true;
    }

    return allowedRoles.includes(user.role);
  }, [allowedRoles, user]);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!user) {
      router.replace('/login');
      return;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
      router.replace('/');
    }
  }, [allowedRoles, isLoading, router, user]);

  return { user, isLoading, refreshUser, isAuthorized };
};
