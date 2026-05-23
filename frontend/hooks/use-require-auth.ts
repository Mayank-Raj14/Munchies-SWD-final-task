'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { useAuth, type AuthUser } from '@/contexts/auth-context';

type Role = AuthUser['role'];

export const useRequireAuth = (allowedRoles?: Role[]) => {
  const router = useRouter();
  const { user, isLoading } = useAuth();

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

  return { user, isLoading };
};
