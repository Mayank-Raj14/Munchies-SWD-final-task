'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import { ArrowRight, LockKeyhole, Mail } from 'lucide-react';

import { authHeroClass, authShellClass, fieldClass, primaryButtonClass } from '@/components/marketplace-ui';
import { useAuth } from '@/contexts/auth-context';
import { ApiError } from '@/services/api';
import { loginUser, saveAuthToken } from '@/services/auth';

export default function LoginPage() {
  const router = useRouter();
  const { user, isLoading, setUserFromAuth, refreshUser } = useAuth();
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && user) {
      router.replace('/');
    }
  }, [isLoading, router, user]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage('');
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);

    try {
      const result = await loginUser({
        email: String(formData.get('email')),
        password: String(formData.get('password')),
      });
      saveAuthToken(result.token);
      setUserFromAuth(result.user);
      await refreshUser();
      router.replace('/');
    } catch (error) {
      setMessage(
        error instanceof ApiError || error instanceof Error
          ? error.message
          : 'Login failed.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-6">
      <section className={`${authShellClass} lg:grid-cols-[1fr_430px]`}>
        <div className={authHeroClass}>
          <Link className="text-2xl font-semibold text-foreground" href="/">
            Munchies
          </Link>
          <div>
            <h1 className="text-2xl font-semibold leading-tight text-foreground">Welcome back</h1>
            <p className="mt-2 text-sm text-foreground-muted">Sign in to continue.</p>
          </div>
        </div>
        <div className="p-6 sm:p-8">
          <Link className="text-xl font-semibold text-foreground lg:hidden" href="/">
            Munchies
          </Link>
          <h1 className="mt-8 text-2xl font-semibold text-foreground lg:mt-0">Login</h1>
          <p className="mt-1 text-sm text-foreground-muted">Use your account email.</p>
          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <label className="block">
              <span className="flex items-center gap-2 text-sm font-medium text-foreground-secondary">
                <Mail className="h-4 w-4 text-accent" aria-hidden="true" />
                Email
              </span>
              <input
                className={fieldClass}
                name="email"
                type="email"
                autoComplete="email"
                required
              />
            </label>
            <label className="block">
              <span className="flex items-center gap-2 text-sm font-medium text-foreground-secondary">
                <LockKeyhole className="h-4 w-4 text-accent" aria-hidden="true" />
                Password
              </span>
              <input
                className={fieldClass}
                name="password"
                type="password"
                autoComplete="current-password"
                required
              />
            </label>
            <button
              className={`${primaryButtonClass} w-full`}
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? 'Logging in...' : 'Login'}
              {!isSubmitting ? <ArrowRight className="h-4 w-4" aria-hidden="true" /> : null}
            </button>
          </form>
          {message ? (
            <p className="mt-4 rounded-xl border border-red-400/25 bg-red-500/10 px-3 py-2 text-sm font-bold text-red-200">
              {message}
            </p>
          ) : null}
          <p className="mt-6 text-sm text-foreground-secondary">
            Need an account?{' '}
            <Link className="font-medium text-accent hover:text-accent-soft" href="/register">
              Register
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
