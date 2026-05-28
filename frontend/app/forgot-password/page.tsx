'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, KeyRound, Lock, Mail, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { fieldClass, primaryButtonClass } from '@/components/marketplace-ui';
import { buildApiUrl } from '@/lib/api-url';
import { API_ROUTES } from '@/lib/api-routes';
import { apiFetch } from '@/services/api';

type Step = 'email' | 'code' | 'password' | 'done';

const postJson = async (url: string, body: Record<string, string>) => {
  const res = await apiFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.error?.message ?? data?.message ?? 'Something went wrong');
  }
  return res.json();
};

const STEP_META: Record<Exclude<Step, 'done'>, { icon: typeof Mail; label: string; desc: string }> = {
  email: { icon: Mail, label: 'Forgot password?', desc: "Enter your email and we'll send a 6-digit code." },
  code: { icon: ShieldCheck, label: 'Enter your code', desc: 'Check your inbox — the code expires in 15 minutes.' },
  password: { icon: Lock, label: 'New password', desc: 'Choose a strong password with at least 8 characters.' },
};

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const codeRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleEmailSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await postJson(buildApiUrl(API_ROUTES.auth.forgotPassword), { email });
      setStep('code');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send code');
    } finally {
      setLoading(false);
    }
  };

  const handleCodeSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await postJson(buildApiUrl(API_ROUTES.auth.verifyResetCode), { email, code });
      setStep('password');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid or expired code');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    const form = new FormData(e.currentTarget);
    const newPassword = String(form.get('password'));
    const confirm = String(form.get('confirm'));
    if (newPassword !== confirm) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await postJson(buildApiUrl(API_ROUTES.auth.resetPassword), { email, code, newPassword });
      setStep('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  // OTP-style code input
  const handleCodeInput = (idx: number, val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 1);
    const arr = code.split('');
    arr[idx] = digits;
    const next = arr.join('').padEnd(6, '').slice(0, 6);
    setCode(next.trimEnd());
    if (digits && idx < 5) codeRefs.current[idx + 1]?.focus();
    if (!digits && idx > 0) codeRefs.current[idx - 1]?.focus();
  };

  const handleCodeKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[idx] && idx > 0) {
      codeRefs.current[idx - 1]?.focus();
    }
  };

  const handleCodePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    setCode(pasted);
    codeRefs.current[Math.min(pasted.length, 5)]?.focus();
    e.preventDefault();
  };

  const meta = step !== 'done' ? STEP_META[step] : null;
  const Icon = meta?.icon;

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#09090b] px-4 py-10 sm:px-6">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(249,115,22,0.12),transparent_50%),radial-gradient(ellipse_at_bottom_right,rgba(251,191,36,0.05),transparent_50%)]" />
      <div className="pointer-events-none absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-accent/25 to-transparent" />

      <AnimatePresence mode="wait">
        {step === 'done' ? (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
            className="relative w-full max-w-sm text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 280, damping: 20 }}
              className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20"
            >
              <ShieldCheck className="h-8 w-8 text-emerald-400" />
            </motion.div>
            <h1 className="text-2xl font-black text-white">Password updated!</h1>
            <p className="mt-2 text-sm text-slate-400">You can now sign in with your new password.</p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.replace('/login')}
              className={`${primaryButtonClass} mt-8 h-11 w-full`}
            >
              Go to Sign In <ArrowRight className="h-4 w-4" />
            </motion.button>
          </motion.div>
        ) : (
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
            className="relative w-full max-w-sm"
          >
            {/* Card */}
            <div className="overflow-hidden rounded-3xl border border-white/[0.07] bg-[#111114] shadow-[0_32px_80px_-16px_rgba(0,0,0,0.9)]">
              {/* Progress bar */}
              <div className="h-0.5 bg-white/5">
                <motion.div
                  className="h-full bg-gradient-to-r from-accent to-orange-400"
                  initial={{ width: 0 }}
                  animate={{ width: step === 'email' ? '33%' : step === 'code' ? '66%' : '100%' }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                />
              </div>

              <div className="p-7 sm:p-8">
                {/* Back link */}
                <Link
                  href="/login"
                  className="mb-6 inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 hover:text-slate-300 transition-colors"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
                </Link>

                {/* Icon + title */}
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 border border-accent/20">
                    {Icon ? <Icon className="h-5 w-5 text-accent" /> : null}
                  </div>
                  <div>
                    <h1 className="text-lg font-black text-white">{meta?.label}</h1>
                    <p className="text-[11px] text-slate-500">{meta?.desc}</p>
                  </div>
                </div>

                {/* Step: Email */}
                {step === 'email' && (
                  <form onSubmit={handleEmailSubmit} className="space-y-4">
                    <label className="block">
                      <span className="mb-1.5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                        <Mail className="h-3 w-3 text-accent" /> Email Address
                      </span>
                      <input
                        className={fieldClass}
                        type="email"
                        name="email"
                        required
                        placeholder="you@university.edu"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="email"
                      />
                    </label>
                    <ErrorBox message={error} />
                    <SubmitButton loading={loading} label="Send Reset Code" />
                  </form>
                )}

                {/* Step: Code */}
                {step === 'code' && (
                  <form onSubmit={handleCodeSubmit} className="space-y-5">
                    <p className="text-xs text-slate-400">
                      Sent to <span className="font-semibold text-white">{email}</span>
                    </p>
                    {/* OTP boxes */}
                    <div className="flex gap-2 justify-between" onPaste={handleCodePaste}>
                      {Array.from({ length: 6 }).map((_, idx) => (
                        <input
                          key={idx}
                          ref={(el) => { codeRefs.current[idx] = el; }}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={code[idx] ?? ''}
                          onChange={(e) => handleCodeInput(idx, e.target.value)}
                          onKeyDown={(e) => handleCodeKeyDown(idx, e)}
                          className="h-12 w-full rounded-xl border border-white/10 bg-white/5 text-center text-lg font-black text-white outline-none transition-all focus:border-accent/50 focus:ring-2 focus:ring-accent/20"
                        />
                      ))}
                    </div>
                    <ErrorBox message={error} />
                    <SubmitButton loading={loading} label="Verify Code" disabled={code.length < 6} />
                    <button
                      type="button"
                      className="w-full text-center text-[11px] text-slate-500 hover:text-accent transition-colors"
                      onClick={() => { setStep('email'); setCode(''); setError(''); }}
                    >
                      Resend code
                    </button>
                  </form>
                )}

                {/* Step: New Password */}
                {step === 'password' && (
                  <form onSubmit={handlePasswordSubmit} className="space-y-4">
                    {[
                      { name: 'password', label: 'New Password', placeholder: 'Min. 8 characters' },
                      { name: 'confirm', label: 'Confirm Password', placeholder: 'Repeat password' },
                    ].map(({ name, label, placeholder }) => (
                      <label key={name} className="block">
                        <span className="mb-1.5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                          <KeyRound className="h-3 w-3 text-accent" /> {label}
                        </span>
                        <input
                          className={fieldClass}
                          type="password"
                          name={name}
                          required
                          minLength={8}
                          placeholder={placeholder}
                          autoComplete="new-password"
                        />
                      </label>
                    ))}
                    <ErrorBox message={error} />
                    <SubmitButton loading={loading} label="Update Password" />
                  </form>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <AnimatePresence>
      {message ? (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="rounded-xl border border-red-500/15 bg-red-500/5 px-4 py-3 text-xs font-semibold text-red-300"
        >
          {message}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function SubmitButton({ loading, label, disabled }: { loading: boolean; label: string; disabled?: boolean }) {
  return (
    <motion.button
      whileHover={{ scale: 1.01, translateY: -1 }}
      whileTap={{ scale: 0.98 }}
      className={`${primaryButtonClass} h-11 w-full`}
      disabled={loading || disabled}
      type="submit"
    >
      {loading ? 'Please wait…' : label}
      {!loading && <ArrowRight className="h-4 w-4 shrink-0" />}
    </motion.button>
  );
}