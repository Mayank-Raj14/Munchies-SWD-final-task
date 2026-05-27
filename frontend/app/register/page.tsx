'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { ArrowRight, LockKeyhole, Mail, User } from 'lucide-react';

import {
  AuthHero,
  authShellClass,
  fieldClass,
  primaryButtonClass,
} from '@/components/marketplace-ui';
import { useAuth } from '@/contexts/auth-context';
import { ApiError } from '@/services/api';
import { registerUser, saveAuthToken } from '@/services/auth';

export default function RegisterPage() {
  const router = useRouter();
  const { setUserFromAuth, refreshUser } = useAuth();
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage('');
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);

    try {
      const result = await registerUser({
        name: String(formData.get('name')),
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
          : 'Registration failed.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="bg-grid-soft relative flex min-h-screen items-center justify-center overflow-hidden bg-[#09090b] px-4 py-10 sm:px-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.14),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.05),transparent_24%)]" />
      <section className={authShellClass}>
        <AuthHero
          eyebrow="New account"
          points={['Browse nearby stores', 'Track live order status', 'Manage seller tools later']}
          subtitle="Create an account once and keep ordering, selling, and tracking from one campus workspace."
          title="Create your Munchies account"
        />
        <div className="p-6 sm:p-8 lg:p-10">
          <Link className="text-xl font-semibold tracking-tight text-white lg:hidden" href="/">
            Munchies
          </Link>
          <h1 className="mt-8 text-3xl font-semibold tracking-tight text-white lg:mt-0">
            Create account
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Join with your name, email, and a secure password.
          </p>
          <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
            <label className="block">
              <span className="flex items-center gap-2 text-sm font-medium text-slate-300">
                <User className="h-4 w-4 text-orange-400" aria-hidden="true" />
                Name
              </span>
              <input
                className={fieldClass}
                name="name"
                type="text"
                autoComplete="name"
                minLength={2}
                required
              />
            </label>
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
                autoComplete="new-password"
                minLength={8}
                required
              />
            </label>
            <button
              className={`${primaryButtonClass} h-11 w-full bg-orange-500 text-white hover:bg-orange-400`}
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? 'Creating account...' : 'Register'}
              {!isSubmitting ? <ArrowRight className="h-4 w-4" aria-hidden="true" /> : null}
            </button>
          </form>
          {message ? (
            <p className="mt-4 rounded-xl border border-red-400/25 bg-red-500/10 px-3 py-2 text-sm font-bold text-red-200">
              {message}
            </p>
          ) : null}
          <p className="mt-6 text-sm text-slate-400">
            Already registered?{' '}
            <Link className="font-medium text-orange-400 hover:text-orange-300" href="/login">
              Login
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
