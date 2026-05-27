'use client';

import { Check } from 'lucide-react';

import { useTheme } from '@/contexts/theme-context';
import { themes, type ThemeId } from '@/lib/themes';

const swatches: Record<ThemeId, string> = {
  dark: 'bg-zinc-900 ring-zinc-600',
  light: 'bg-zinc-100 ring-zinc-300',
  ice: 'bg-sky-950 ring-sky-500/60',
  purple: 'bg-violet-950 ring-violet-500/60',
  emerald: 'bg-emerald-950 ring-emerald-500/60',
};

export function ThemeSettings({ compact = false }: { compact?: boolean }) {
  const { theme, isHydrated, setTheme } = useTheme();

  return (
    <div className={compact ? 'space-y-2' : 'space-y-3'}>
      {!compact ? (
        <p className="px-2 text-[11px] font-medium uppercase tracking-wider text-foreground-muted">
          Appearance
        </p>
      ) : null}
      <div className="grid grid-cols-5 gap-1.5 px-1">
        {themes.map((item) => {
          const active = isHydrated && theme === item.id;

          return (
            <button
              aria-label={`${item.label} theme`}
              aria-pressed={active}
              className={`group relative flex aspect-square items-center justify-center rounded-lg border border-border-subtle transition-all duration-200 hover:border-border focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent/50 ${
                active ? 'border-accent/40 shadow-accent-ring' : ''
              }`}
              key={item.id}
              onClick={() => setTheme(item.id)}
              title={item.label}
              type="button"
            >
              <span className={`h-5 w-5 rounded-md ring-1 ring-inset ${swatches[item.id]}`} />
              {active ? (
                <span className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-accent text-canvas">
                  <Check className="h-2 w-2" strokeWidth={3} aria-hidden="true" />
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
      <p className="px-2 text-center text-[10px] text-foreground-muted">
        {isHydrated ? themes.find((item) => item.id === theme)?.label : 'Appearance'}
      </p>
    </div>
  );
}
