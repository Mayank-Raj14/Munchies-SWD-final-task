'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import { ArrowRight, LockKeyhole, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
      await refreshUser({ silent: false });
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
      {/* Layered ambient glows */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(249,115,22,0.15),transparent_40%),radial-gradient(ellipse_at_bottom_left,rgba(251,191,36,0.05),transparent_50%)]" />
      {/* Subtle animated accent line at top */}
      <div className="pointer-events-none absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-accent/25 to-transparent" />

      <motion.section
        initial={{ opacity: 0, scale: 0.97, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 280, damping: 28, mass: 0.9 }}
        className={authShellClass}
      >
        <AuthHero
          eyebrow="Campus Ordering SaaS"
          points={['Liquid-smooth hostel ordering', 'Stat dashboard analytics', 'Staggered real-time order lists']}
          subtitle="Sign in to the canteens marketplace, track order updates, and explore local campus kitchens."
          title="Welcome back to Munchies"
        />

        <div className="p-6 sm:p-8 lg:p-10 flex flex-col justify-center bg-[#09090b]/70 relative">
          {/* Subtle inner gradient */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(249,115,22,0.04),transparent_55%)]" />

          <Link className="relative text-xl font-black tracking-tight text-white lg:hidden mb-2" href="/">
            Munchies
          </Link>

          <h1 className="relative mt-8 text-2xl font-black tracking-tight text-white lg:mt-0">
            Sign In
          </h1>

          <p className="relative mt-1.5 text-xs font-medium text-slate-400">
            Access your orders dashboard and merchant tools.
          </p>

          <form className="relative mt-7 space-y-4" onSubmit={handleSubmit}>
            <label className="block">
              <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-1.5">
                <Mail className="h-3 w-3 text-accent" aria-hidden="true" />
                Email Address
              </span>
              <input
                className={fieldClass}
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@university.edu"
                required
              />
            </label>

            <label className="block">
              <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-1.5">
                <LockKeyhole className="h-3 w-3 text-accent" aria-hidden="true" />
                Password
              </span>
              <input
                className={fieldClass}
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                required
              />
            </label>

            <motion.button
              whileHover={{ scale: 1.01, translateY: -2 }}
              whileTap={{ scale: 0.98 }}
              className={`${primaryButtonClass} h-11 w-full mt-2`}
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? 'Verifying details…' : 'Sign in'}
              {!isSubmitting && (
                <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
              )}
            </motion.button>
          </form>

          <AnimatePresence>
            {message ? (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                className="relative mt-4 rounded-xl border border-red-500/15 bg-red-500/5 px-4 py-3 text-xs font-semibold text-red-300"
              >
                {message}
              </motion.div>
            ) : null}
          </AnimatePresence>

          <p className="relative mt-7 text-xs font-medium text-slate-400">
            Need a student account?{' '}
            <Link
              className="font-bold text-accent hover:text-orange-400 transition-colors duration-150"
              href="/register"
            >
              Register
            </Link>
          </p>
        </div>
      </motion.section>
    </main>
  );
}
