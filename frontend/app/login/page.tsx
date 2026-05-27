'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import { ArrowRight, LockKeyhole, Mail } from 'lucide-react';

import { AuthHero, authShellClass, fieldClass, primaryButtonClass } from '@/components/marketplace-ui';
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
    <main className="bg-grid-soft relative flex min-h-screen items-center justify-center overflow-hidden bg-[#09090b] px-4 py-10 sm:px-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(249,115,22,0.16),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(251,191,36,0.08),transparent_22%)]" />
      <section className={authShellClass}>
        <AuthHero
          eyebrow="Campus commerce"
          points={['Fast hostel ordering', 'Cleaner seller dashboards', 'Real-time order flow']}
          subtitle="Sign in to manage orders, browse stores, and keep your campus kitchen routine moving."
          title="Welcome back to Munchies"
        />

        <div className="p-6 sm:p-8 lg:p-10">
          <Link className="text-2xl font-semibold tracking-tight text-white lg:hidden" href="/">
            Munchies
          </Link>

          <h1 className="mt-8 text-3xl font-semibold tracking-tight text-white lg:mt-0">
            Login
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-400">
            Use your account email and password.
          </p>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <label className="block">
              <span className="flex items-center gap-2 text-sm font-medium text-slate-300">
                <Mail className="h-4 w-4 text-orange-400" aria-hidden="true" />
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
              <span className="flex items-center gap-2 text-sm font-medium text-slate-300">
                <LockKeyhole className="h-4 w-4 text-orange-400" aria-hidden="true" />
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
              className={`${primaryButtonClass} h-11 w-full bg-orange-500 text-white hover:bg-orange-400`}
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

          <p className="mt-6 text-sm text-slate-400">
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
