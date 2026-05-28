'use client';

import { motion } from 'framer-motion';
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
      {/* Premium animated brand mark symbol */}
      <motion.div
        whileHover={{ scale: 1.05, rotate: [0, -5, 5, 0] }}
        transition={{ type: 'spring', stiffness: 300, damping: 15 }}
        className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-[linear-gradient(135deg,var(--accent)_0%,#ea580c_60%,#c2410c_100%)] text-sm font-black text-white shadow-[0_12px_24px_-8px_rgba(249,115,22,0.6)]"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-[18px] w-[18px] text-white"
        >
          {/* A sleek chef cloche / fast-tech food dome nested into an M-like shape */}
          <path d="M3 12h18" />
          <path d="M12 3v3" />
          <path d="M6 12a6 6 0 0 1 12 0" />
          <path d="M9 16h6" />
          <path d="M8 20h8" />
        </svg>
        <span className="absolute inset-x-1 top-1 h-3 rounded-full bg-white/20 blur-sm" />
      </motion.div>
      
      {!compact ? (
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-base font-bold tracking-tight text-foreground">{label}</p>
            <span className="rounded-full bg-accent/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-accent border border-accent/20">
              SaaS
            </span>
          </div>
          <p className="text-[10px] font-medium text-foreground-muted uppercase tracking-wider">
            Campus Marketplace
          </p>
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
      className={`relative flex h-full w-full items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,rgba(249,115,22,0.15),transparent_60%),linear-gradient(180deg,var(--bg-raised),var(--bg-surface))] ${className}`}
    >
      <div className="absolute inset-0 bg-grid-soft opacity-30" />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="relative flex flex-col items-center px-4 text-center"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/5 bg-white/5 text-foreground/80 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] backdrop-blur-sm">
          <Icon className="h-5 w-5 text-accent" aria-hidden="true" />
        </div>
        <p className="mt-3 line-clamp-1 text-xs font-semibold text-foreground">{title}</p>
        <p className="mt-0.5 text-[10px] text-foreground-muted">
          {subtitle ?? 'Preview available when media is added'}
        </p>
      </motion.div>
    </div>
  );
}
