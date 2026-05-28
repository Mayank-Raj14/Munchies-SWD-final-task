'use client';

import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, Loader2, AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { BrandMark } from '@/components/brand-assets';

type PageContainerProps = {
  children: ReactNode;
  className?: string;
  size?: 'default' | 'wide' | 'narrow';
};

const widthClass = {
  default: 'max-w-content',
  wide: 'max-w-content-wide',
  narrow: 'max-w-content-narrow',
};

export function PageContainer({ children, className = '', size = 'default' }: PageContainerProps) {
  return (
    <main
      className={`min-h-screen w-full min-w-0 overflow-x-clip px-4 pb-24 pt-4 sm:px-5 sm:pt-5 lg:px-7 lg:pb-8 lg:pt-6 ${className}`}
    >
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 340, damping: 30, mass: 0.8 }}
        className={`mx-auto w-full min-w-0 ${widthClass[size]}`}
      >
        {children}
      </motion.div>
    </main>
  );
}

type SurfaceProps = {
  children?: ReactNode;
  className?: string;
  elevated?: boolean;
};

export function MarketSurface({ children, className = '', elevated = false }: SurfaceProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 340, damping: 30, mass: 0.8 }}
      className={`rounded-2xl border border-border bg-surface transition-all duration-300 hover:shadow-card-hover ${
        elevated ? 'shadow-card-hover' : 'shadow-card'
      } ${className}`}
    >
      {children}
    </motion.div>
  );
}

export function SectionHeader({
  action,
  description,
  title,
}: {
  action?: ReactNode;
  description?: string;
  title: string;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between border-b border-border-subtle pb-5">
      <div className="min-w-0">
        <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl lg:text-3xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-1.5 max-w-lg text-sm text-foreground-secondary leading-relaxed">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="flex shrink-0 flex-wrap gap-2">{action}</div> : null}
    </div>
  );
}

export const pageStackClass = 'mt-6 space-y-6';

export const labelClass =
  'text-[11px] font-bold uppercase tracking-widest text-foreground-secondary mb-1.5 block';

export const divideClass = 'divide-y divide-border-subtle';

export function Notice({
  children,
  tone = 'neutral',
}: {
  children: ReactNode;
  tone?: 'neutral' | 'success' | 'danger' | 'warning';
}) {
  const toneData = {
    danger: {
      style: 'border-red-500/15 bg-red-500/5 text-red-200',
      icon: XCircle,
      iconColor: 'text-red-400',
    },
    neutral: {
      style: 'border-border bg-surface-raised/40 text-foreground-secondary',
      icon: Info,
      iconColor: 'text-foreground-muted',
    },
    success: {
      style: 'border-emerald-500/15 bg-emerald-500/5 text-emerald-200',
      icon: CheckCircle,
      iconColor: 'text-emerald-400',
    },
    warning: {
      style: 'border-amber-500/15 bg-amber-500/5 text-amber-200',
      icon: AlertTriangle,
      iconColor: 'text-amber-400',
    },
  }[tone];

  const ToneIcon = toneData.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: -6, scale: 0.99 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm leading-relaxed backdrop-blur-sm ${toneData.style}`}
    >
      <ToneIcon className={`mt-0.5 h-4.5 w-4.5 shrink-0 ${toneData.iconColor}`} aria-hidden="true" />
      <div className="flex-1 font-medium">{children}</div>
    </motion.div>
  );
}

export function CardSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`overflow-hidden rounded-2xl border border-border bg-surface ${className}`}>
      <div className="skeleton-block h-28 bg-surface-raised" />
      <div className="space-y-3 p-4">
        <div className="skeleton-block h-4 w-2/3 rounded-md bg-surface-raised" />
        <div className="skeleton-block h-3 w-1/2 rounded-md bg-surface-muted/80" />
        <div className="grid grid-cols-2 gap-2 pt-2">
          <div className="skeleton-block h-9 rounded-lg bg-surface-raised" />
          <div className="skeleton-block h-9 rounded-lg bg-surface-muted/80" />
        </div>
      </div>
    </div>
  );
}

export function StatCardSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`rounded-2xl border border-border bg-surface p-5 shadow-card ${className}`}>
      <div className="skeleton-block h-3.5 w-24 rounded-md bg-surface-raised" />
      <div className="skeleton-block mt-4 h-8 w-32 rounded-lg bg-surface-raised" />
      <div className="skeleton-block mt-3 h-3 w-20 rounded-md bg-surface-muted/80" />
    </div>
  );
}

export function ChartSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`rounded-2xl border border-border bg-surface p-5 shadow-card ${className}`}>
      <div className="skeleton-block h-4.5 w-32 rounded-md bg-surface-raised" />
      <div className="mt-6 space-y-4">
        {[70, 48, 82, 58].map((width, index) => (
          <div className="grid gap-3 sm:grid-cols-[5rem_1fr_5rem] sm:items-center" key={index}>
            <div className="skeleton-block h-3.5 rounded-md bg-surface-muted/80" />
            <div
              className="skeleton-block h-3.5 rounded-full bg-surface-raised"
              style={{ width: `${width}%` }}
            />
            <div className="skeleton-block h-3.5 rounded-md bg-surface-muted/80" />
          </div>
        ))}
      </div>
    </div>
  );
}

export const fieldClass =
  'mt-1 w-full rounded-xl border border-border bg-canvas px-3.5 py-2.5 text-sm text-foreground outline-none transition-all duration-200 placeholder:text-foreground-faint hover:border-border-strong focus:border-accent/60 focus:ring-2 focus:ring-accent/15 focus:bg-surface disabled:cursor-not-allowed disabled:opacity-50';

export const selectClass = `${fieldClass} appearance-none pr-10`;

/* Premium button system — consistent heights, spring-feel micro-interactions */
export const primaryButtonClass =
  'inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-accent px-4 text-sm font-semibold text-accent-contrast shadow-[0_4px_14px_-4px_rgba(249,115,22,0.45)] will-change-transform transition-all duration-200 hover:opacity-90 hover:shadow-[0_8px_24px_-4px_rgba(249,115,22,0.6)] hover:-translate-y-[2px] active:translate-y-0 active:scale-[0.982] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent/50 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:shadow-[0_4px_14px_-4px_rgba(249,115,22,0.45)] disabled:will-change-auto';

export const secondaryButtonClass =
  'inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border bg-surface-raised px-4 text-sm font-medium text-foreground shadow-sm will-change-transform transition-all duration-200 hover:border-border-strong hover:bg-surface-muted hover:-translate-y-[2px] active:translate-y-0 active:scale-[0.982] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent/30 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0';

export const ghostButtonClass =
  'inline-flex h-8.5 items-center justify-center gap-2 rounded-lg px-2.5 text-sm font-medium text-foreground-secondary transition-all duration-150 hover:bg-accent-muted hover:text-foreground active:scale-95';

export const dangerButtonClass =
  'inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-red-500/25 bg-red-500/5 px-4 text-sm font-medium text-red-200 transition-all duration-200 hover:border-red-500/40 hover:bg-red-500/10 hover:-translate-y-[2px] active:translate-y-0 active:scale-[0.982] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0';

export const panelClass = 'rounded-2xl border border-border bg-surface p-5 shadow-card sm:p-6';

export const formPanelClass = panelClass;

export const listCardClass =
  'rounded-2xl border border-border bg-surface p-4 transition-all duration-200 hover:border-border-strong hover:bg-surface-hover hover:-translate-y-[2px] hover:shadow-card-hover will-change-transform sm:p-5';

export const orderCardClass = 'rounded-2xl border border-border bg-surface p-4 sm:p-5 shadow-card';

export const dangerOutlineButtonClass =
  'inline-flex h-8.5 items-center justify-center rounded-lg border border-border px-3 text-sm font-medium text-foreground-secondary transition-all duration-200 hover:border-red-500/30 hover:bg-red-500/5 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50';

export const badgeClass =
  'inline-flex items-center gap-1 rounded-md border border-border bg-surface-raised px-2 py-0.5 text-[11px] font-semibold text-foreground-secondary shadow-sm';

export const accentBadgeClass =
  'inline-flex items-center gap-1 rounded-md border border-accent/20 bg-accent-muted px-2 py-0.5 text-[11px] font-semibold text-accent shadow-sm';

export const itemCardClass =
  'overflow-hidden rounded-2xl border border-border bg-surface transition-all duration-250 hover:border-border-strong hover:bg-surface-hover hover:-translate-y-[2px] shadow-sm hover:shadow-card-hover';

export function LoadingSpinner({ className = 'h-4 w-4' }: { className?: string }) {
  return <Loader2 className={`${className} animate-spin text-accent`} aria-hidden="true" />;
}

export function SelectShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative">
      {children}
      <ChevronDown
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-muted transition-transform duration-200 peer-focus:rotate-180"
        aria-hidden="true"
      />
    </div>
  );
}

type EmptyStateProps = {
  action?: ReactNode;
  description?: string;
  icon: LucideIcon;
  title: string;
};

export function EmptyState({ action, description, icon: Icon, title }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      className="relative flex flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed border-border bg-surface/50 px-6 py-12 text-center shadow-sm sm:py-16"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,color-mix(in_srgb,var(--accent)_6%,transparent),transparent_60%)] pointer-events-none" />

      <motion.div
        animate={{ y: [0, -5, 0] }}
        transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut' }}
        className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-accent-muted text-accent shadow-subtle mb-4"
      >
        <Icon className="h-5 w-5" aria-hidden="true" />
      </motion.div>

      <h2 className="relative text-sm font-bold text-foreground tracking-tight">{title}</h2>
      {description ? (
        <p className="relative mt-1.5 max-w-xs text-xs leading-relaxed text-foreground-muted font-medium">
          {description}
        </p>
      ) : null}
      {action ? <div className="relative mt-5">{action}</div> : null}
    </motion.div>
  );
}

/* Auth shell — premium glass card for login/register */
export const authShellClass =
  'grid w-full max-w-5xl overflow-hidden rounded-3xl border border-white/[0.07] bg-[#09090b]/88 shadow-[0_48px_120px_-24px_rgba(0,0,0,0.95),0_0_0_1px_rgba(255,255,255,0.05),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-2xl lg:grid-cols-[minmax(0,1.1fr)_420px]';

export const authHeroClass =
  'relative hidden overflow-hidden border-r border-white/5 bg-[linear-gradient(155deg,#101114_0%,#0a0b0e_55%,#040506_100%)] p-12 text-foreground lg:flex lg:flex-col lg:justify-between';

const FOOD_ITEMS = [
  { emoji: '🍕', label: 'Pizza', delay: 0 },
  { emoji: '🍜', label: 'Noodles', delay: 0.08 },
  { emoji: '🥪', label: 'Sandwich', delay: 0.16 },
  { emoji: '🧆', label: 'Snacks', delay: 0.24 },
  { emoji: '🥤', label: 'Drinks', delay: 0.32 },
  { emoji: '🍱', label: 'Combos', delay: 0.4 },
];

const VIBES = [
  { text: 'Midnight cravings sorted.', color: '#f97316' },
  { text: 'Your hostel. Your menu.', color: '#fb923c' },
  { text: 'Hot food, zero hassle.', color: '#f97316' },
];

export function AuthHero({
  title,
  subtitle,
}: {
  eyebrow?: string;
  points?: string[];
  subtitle: string;
  title: string;
}) {
  return (
    <div className={authHeroClass}>
      {/* Warm ambient glow */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(249,115,22,0.18),transparent_50%),radial-gradient(ellipse_at_bottom_left,rgba(251,191,36,0.07),transparent_50%)]" />

      {/* Top accent line */}
      <div className="pointer-events-none absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent" />

      <BrandMark className="relative" />

      {/* Hero text */}
      <div className="relative">
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.4 }}
          className="text-[10px] font-bold uppercase tracking-[0.3em] text-accent mb-4"
        >
          12 Hostels · 1 App
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.45 }}
          className="text-4xl font-black tracking-tight text-white leading-[1.1]"
        >
          {title}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18, duration: 0.4 }}
          className="mt-3 text-sm leading-relaxed text-slate-400 font-medium max-w-xs"
        >
          {subtitle}
        </motion.p>
      </div>

      {/* Food emoji grid */}
      <div className="relative grid grid-cols-3 gap-2.5">
        {FOOD_ITEMS.map(({ emoji, label, delay }) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, scale: 0.8, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.25 + delay, type: 'spring', stiffness: 320, damping: 24 }}
            whileHover={{ scale: 1.06, y: -2 }}
            className="flex flex-col items-center gap-1.5 rounded-2xl border border-white/[0.06] bg-white/[0.03] px-3 py-3.5 backdrop-blur-sm cursor-default"
          >
            <span className="text-2xl leading-none select-none">{emoji}</span>
            <span className="text-[10px] font-semibold text-slate-400 tracking-wide">{label}</span>
          </motion.div>
        ))}
      </div>

      {/* Vibe pills */}
      <div className="relative flex flex-wrap gap-2">
        {VIBES.map(({ text, color }, i) => (
          <motion.span
            key={text}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 + i * 0.08, duration: 0.35 }}
            className="rounded-full border px-3 py-1 text-[11px] font-bold"
            style={{ borderColor: `${color}30`, color, background: `${color}10` }}
          >
            {text}
          </motion.span>
        ))}
      </div>
    </div>
  );
}