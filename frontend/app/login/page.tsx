'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import { ArrowRight, LockKeyhole, Mail } from 'lucide-react';

import { useAuth } from '@/contexts/auth-context';
import { ApiError } from '@/services/api';
import { loginUser, saveAuthToken } from '@/services/auth';

const authShellClass =
  'grid w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-[#111111] shadow-2xl lg:grid-cols-[1fr_430px]';

const authHeroClass =
  'hidden flex-col justify-between bg-gradient-to-br from-orange-500 via-red-500 to-pink-500 p-10 lg:flex';

const fieldClass =
  'mt-2 w-full rounded-xl border border-white/10 bg-[#1a1a1a] px-4 py-3 text-sm text-white outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/30';

const primaryButtonClass =
  'flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-3 font-medium text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60';

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
        email: String(formData.get('email') || ''),
        password: String(formData.get('password') || ''),
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
    <main className="flex min-h-screen items-center justify-center bg-[#0a0a0a] px-4 py-10 sm:px-6">
      <section className={authShellClass}>
        <div className={authHeroClass}>
          <Link className="text-3xl font-bold text-white" href="/">
            Munchies
          </Link>

          <div>
            <h1 className="text-4xl font-bold leading-tight text-white">
              Welcome back
            </h1>

            <p className="mt-3 text-sm text-orange-100">
              Sign in to continue ordering from your hostel marketplace.
            </p>
          </div>
        </div>

        <div className="p-6 sm:p-8">
          <Link className="text-2xl font-bold text-white lg:hidden" href="/">
            Munchies
          </Link>

          <h1 className="mt-8 text-3xl font-bold text-white lg:mt-0">
            Login
          </h1>

          <p className="mt-2 text-sm text-gray-400">
            Use your account email and password.
          </p>

          <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
            <label className="block">
              <span className="flex items-center gap-2 text-sm font-medium text-gray-300">
                <Mail className="h-4 w-4 text-orange-400" />
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
              <span className="flex items-center gap-2 text-sm font-medium text-gray-300">
                <LockKeyhole className="h-4 w-4 text-orange-400" />
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
              className={primaryButtonClass}
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? 'Logging in...' : 'Login'}

              {!isSubmitting && (
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          </form>

          {message ? (
            <p className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-300">
              {message}
            </p>
          ) : null}

          <p className="mt-6 text-sm text-gray-400">
            Need an account?{' '}
            <Link
              className="font-medium text-orange-400 transition hover:text-orange-300"
              href="/register"
            >
              Register
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}

