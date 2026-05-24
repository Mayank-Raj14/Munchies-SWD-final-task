'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { ArrowRight, LockKeyhole, Mail, User } from 'lucide-react';

import { authHeroClass, authShellClass, fieldClass, primaryButtonClass } from '@/components/marketplace-ui';
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
    <main className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-6">
      <section className={`${authShellClass} lg:grid-cols-[1fr_430px]`}>
        <div className={authHeroClass}>
          <Link className="text-2xl font-semibold text-foreground" href="/">
            Munchies
          </Link>
          <div>
            <h1 className="text-2xl font-semibold leading-tight text-foreground">Create your account</h1>
            <p className="mt-2 text-sm text-foreground-muted">Order from stores on campus.</p>
          </div>
        </div>
        <div className="p-6 sm:p-8">
          <Link className="text-xl font-semibold text-foreground lg:hidden" href="/">
            Munchies
          </Link>
          <h1 className="mt-8 text-2xl font-semibold text-foreground lg:mt-0">Create account</h1>
          <p className="mt-2 text-sm text-foreground-secondary">
            Join with your name, email, and a secure password.
          </p>
          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <label className="block">
              <span className="flex items-center gap-2 text-sm font-medium text-foreground-secondary">
                <User className="h-4 w-4 text-accent" aria-hidden="true" />
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
                autoComplete="new-password"
                minLength={8}
                required
              />
            </label>
            <button
              className={`${primaryButtonClass} w-full`}
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
          <p className="mt-6 text-sm text-foreground-secondary">
            Already registered?{' '}
            <Link className="font-medium text-accent hover:text-accent-soft" href="/login">
              Login
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
