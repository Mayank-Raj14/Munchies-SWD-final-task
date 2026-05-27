import { ImageOff, Store } from 'lucide-react';

type BrandMarkProps = {
  className?: string;
  compact?: boolean;
  label?: string;
};

export function BrandMark({
  className = '',
  compact = false,
  label = 'Munchies',
}: BrandMarkProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-[linear-gradient(135deg,#fb923c_0%,#f97316_35%,#ea580c_100%)] text-sm font-black text-white shadow-[0_18px_40px_-24px_rgba(249,115,22,0.9)]">
        <span className="relative z-10">M</span>
        <span className="absolute inset-x-1 top-1 h-3 rounded-full bg-white/20 blur-sm" />
      </div>
      {!compact ? (
        <div className="min-w-0">
          <p className="truncate text-base font-semibold tracking-tight text-foreground">{label}</p>
          <p className="text-xs text-foreground-muted">Campus ordering marketplace</p>
        </div>
      ) : null}
    </div>
  );
}

type MediaFallbackProps = {
  className?: string;
  icon?: 'image' | 'store';
  subtitle?: string;
  title: string;
};

export function MediaFallback({
  className = '',
  icon = 'image',
  subtitle,
  title,
}: MediaFallbackProps) {
  const Icon = icon === 'store' ? Store : ImageOff;

  return (
    <div
      className={`relative flex h-full w-full items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,rgba(249,115,22,0.2),transparent_55%),linear-gradient(180deg,var(--bg-raised),var(--bg-surface))] ${className}`}
    >
      <div className="absolute inset-0 bg-grid-soft opacity-40" />
      <div className="relative flex flex-col items-center px-4 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-white/90 shadow-subtle">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
        <p className="mt-3 line-clamp-1 text-sm font-semibold text-foreground">{title}</p>
        <p className="mt-1 text-xs text-foreground-muted">
          {subtitle ?? 'Preview available when media is added'}
        </p>
      </div>
    </div>
  );
}
