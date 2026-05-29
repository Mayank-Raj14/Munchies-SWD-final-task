'use client';

import { useAuth } from '@/contexts/auth-context';

/**
 * Hook to determine when authentication state has been fully resolved.
 * Returns true once the auth provider has completed its initial check
 * (i.e., token presence has been verified and any necessary refresh has
 * finished). This helps avoid rendering pages with undefined user data
 * during the initial load.
 */
export const useAuthReady = (): boolean => {
  const { isLoading, hasCheckedAuth } = useAuth();
  // Auth is ready when it's not loading and the initial auth check has run.
  return !isLoading && hasCheckedAuth;
};
