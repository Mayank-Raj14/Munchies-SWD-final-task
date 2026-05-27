import type { ReactNode } from 'react';
import { ChevronDown, Loader2 } from 'lucide-react';
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
      <div className={`mx-auto w-full min-w-0 ${widthClass[size]}`}>{children}</div>
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
    <div
      className={`rounded-2xl border border-border bg-surface transition-shadow duration-ui hover:shadow-card-hover ${
        elevated ? 'shadow-card-hover' : 'shadow-card'
      } ${className}`}
    >
      {children}
    </div>
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
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 max-w-lg text-sm text-foreground-muted">{description}</p>
        ) : null}
      </div>
      {action ? <div className="flex shrink-0 flex-wrap gap-2">{action}</div> : null}
    </div>
  );
}

export const pageStackClass = 'mt-6 space-y-6';

export const labelClass = 'text-sm font-medium text-foreground-secondary';

export const divideClass = 'divide-y divide-border';

export function Notice({
  children,
  tone = 'neutral',
}: {
  children: ReactNode;
  tone?: 'neutral' | 'success' | 'danger' | 'warning';
}) {
  const toneClass = {
    danger: 'border-red-500/25 bg-red-500/10 text-red-200',
    neutral: 'border-border bg-surface-raised/60 text-foreground-secondary',
    success: 'border-accent/30 bg-accent-muted text-foreground',
    warning: 'border-amber-500/25 bg-amber-500/10 text-amber-100',
  }[tone];

  return <div className={`rounded-xl border px-3.5 py-2.5 text-sm ${toneClass}`}>{children}</div>;
}

export function CardSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`overflow-hidden rounded-2xl border border-border bg-surface ${className}`}>
      <div className="skeleton-block h-24 bg-surface-raised" />
      <div className="space-y-2.5 p-4">
        <div className="skeleton-block h-3.5 w-2/3 rounded-md bg-surface-raised" />
        <div className="skeleton-block h-3 w-1/2 rounded-md bg-surface-muted/80" />
        <div className="grid grid-cols-2 gap-2 pt-1">
          <div className="skeleton-block h-8 rounded-lg bg-surface-raised" />
          <div className="skeleton-block h-8 rounded-lg bg-surface-muted/80" />
        </div>
      </div>
    </div>
  );
}

export function StatCardSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`rounded-2xl border border-border bg-surface p-5 shadow-card ${className}`}>
      <div className="skeleton-block h-3 w-24 rounded-md bg-surface-raised" />
      <div className="skeleton-block mt-4 h-8 w-32 rounded-lg bg-surface-raised" />
      <div className="skeleton-block mt-3 h-3 w-20 rounded-md bg-surface-muted/80" />
    </div>
  );
}

export function ChartSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`rounded-2xl border border-border bg-surface p-5 shadow-card ${className}`}>
      <div className="skeleton-block h-4 w-32 rounded-md bg-surface-raised" />
      <div className="mt-5 space-y-3">
        {[70, 48, 82, 58].map((width, index) => (
          <div className="grid gap-3 sm:grid-cols-[5rem_1fr_5rem] sm:items-center" key={index}>
            <div className="skeleton-block h-3 rounded-md bg-surface-muted/80" />
            <div
              className="skeleton-block h-3 rounded-full bg-surface-raised"
              style={{ width: `${width}%` }}
            />
            <div className="skeleton-block h-3 rounded-md bg-surface-muted/80" />
          </div>
        ))}
      </div>
    </div>
  );
}

export const fieldClass =
  'mt-1.5 w-full rounded-xl border border-border bg-canvas px-3.5 py-2.5 text-sm text-foreground outline-none transition-all duration-ui placeholder:text-foreground-muted focus:border-accent/40 focus:ring-2 focus:ring-accent/15 disabled:cursor-not-allowed disabled:opacity-50';

export const selectClass = `${fieldClass} appearance-none pr-10`;

export const primaryButtonClass =
  'inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-accent px-4 text-sm font-semibold text-accent-contrast shadow-subtle transition-all duration-ui hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent/50 disabled:cursor-not-allowed disabled:opacity-40';

export const secondaryButtonClass =
  'inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-border bg-surface-raised px-4 text-sm font-medium text-foreground transition-all duration-ui hover:border-border-strong hover:bg-surface-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent/30 disabled:cursor-not-allowed disabled:opacity-40';

export const ghostButtonClass =
  'inline-flex h-8 items-center justify-center gap-2 rounded-lg px-2.5 text-sm font-medium text-foreground-secondary transition-all duration-ui hover:bg-accent-muted hover:text-foreground';

export const dangerButtonClass =
  'inline-flex h-9 items-center justify-center rounded-xl border border-red-500/25 bg-red-500/10 px-4 text-sm font-medium text-red-200 transition-all duration-ui hover:border-red-500/35 hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-40';

export const panelClass = 'rounded-2xl border border-border bg-surface p-5 shadow-card sm:p-6';

export const formPanelClass = panelClass;

export const listCardClass =
  'rounded-2xl border border-border bg-surface p-4 transition-all duration-ui hover:border-border-strong hover:bg-surface-hover sm:p-5';

export const orderCardClass = 'rounded-2xl border border-border bg-surface p-4 sm:p-5';

export const dangerOutlineButtonClass =
  'inline-flex h-8 items-center justify-center rounded-lg border border-border px-3 text-sm font-medium text-foreground-secondary transition-all duration-ui hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50';

export const badgeClass =
  'inline-flex items-center gap-1 rounded-md border border-border bg-surface-raised px-2 py-0.5 text-[11px] font-medium text-foreground-secondary';

export const accentBadgeClass =
  'inline-flex items-center gap-1 rounded-md border border-border bg-accent-muted px-2 py-0.5 text-[11px] font-medium text-accent';

export const itemCardClass =
  'overflow-hidden rounded-2xl border border-border bg-surface transition-all duration-ui hover:border-border-strong hover:bg-surface-hover';

export function LoadingSpinner({ className = 'h-4 w-4' }: { className?: string }) {
  return <Loader2 className={`${className} animate-spin text-accent`} aria-hidden="true" />;
}

export function SelectShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative">
      {children}
      <ChevronDown
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-muted"
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
    <div className="relative flex flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed border-border bg-surface/70 px-5 py-10 text-center shadow-card sm:py-12">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(249,115,22,0.08),transparent_55%)]" />
      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-accent-muted text-accent shadow-subtle">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </div>
      <h2 className="relative mt-3 text-sm font-semibold text-foreground">{title}</h2>
      {description ? (
        <p className="relative mt-1 max-w-xs text-xs leading-relaxed text-foreground-muted">
          {description}
        </p>
      ) : null}
      {action ? <div className="relative mt-4">{action}</div> : null}
    </div>
  );
}

export const authShellClass =
  'grid w-full max-w-6xl overflow-hidden rounded-[2rem] border border-white/10 bg-[#101114]/95 shadow-[0_32px_120px_-48px_rgba(0,0,0,0.85)] backdrop-blur-xl lg:grid-cols-[minmax(0,1.1fr)_430px]';

export const authHeroClass =
  'relative hidden overflow-hidden border-r border-white/10 bg-[linear-gradient(160deg,#1a1d24_0%,#111318_45%,#0a0c10_100%)] p-10 text-foreground lg:flex lg:flex-col lg:justify-between';

export function AuthHero({
  eyebrow,
  points,
  subtitle,
  title,
}: {
  eyebrow: string;
  points: string[];
  subtitle: string;
  title: string;
}) {
  return (
    <div className={authHeroClass}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,0.32),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(251,191,36,0.12),transparent_35%)]" />
      <div className="pointer-events-none absolute inset-0 bg-grid-soft opacity-20" />
      <BrandMark className="relative" />
      <div className="relative max-w-md">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-orange-300/80">
          {eyebrow}
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white">{title}</h1>
        <p className="mt-4 text-sm leading-7 text-slate-300">{subtitle}</p>
      </div>
      <div className="relative grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
        {points.map((point) => (
          <div
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 backdrop-blur-sm"
            key={point}
          >
            {point}
          </div>
        ))}
      </div>
    </div>
  );
}
