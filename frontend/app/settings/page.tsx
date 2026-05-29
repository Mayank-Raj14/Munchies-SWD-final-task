'use client';

import { useTheme } from '@/contexts/theme-context';
import { themes, type ThemeId } from '@/lib/themes';
import { PageContainer, SectionHeader, MarketSurface } from '@/components/marketplace-ui';
import { Check, Sparkles, Sliders } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SettingsPage() {
  const { theme: activeThemeId, isHydrated, setTheme } = useTheme();

  return (
    <PageContainer size="wide" className="page-fade-in">
      <SectionHeader
        title="Settings"
        description="Personalize your marketplace experience. Adjust interface styling, appearance themes, and display behaviors."
      />

      <div className="mt-8 grid gap-8 lg:grid-cols-[240px_1fr]">
        {/* Navigation Sidebar inside settings */}
        <aside className="space-y-1">
          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-xl bg-accent-muted px-4 py-3 text-sm font-semibold text-accent"
          >
            <Sliders className="h-4.5 w-4.5" aria-hidden="true" />
            Appearance
          </button>
        </aside>

        {/* Main Settings Panel */}
        <div className="space-y-6">
          <MarketSurface className="p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-muted text-accent">
                <Sparkles className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">Themes & Appearance</h2>
                <p className="text-sm text-foreground-secondary">
                  Choose an aesthetic theme that suits your style or current environment.
                </p>
              </div>
            </div>

            {/* Themes Grid */}
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {themes.map((item) => {
                const isActive = isHydrated && activeThemeId === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => setTheme(item.id)}
                    type="button"
                    className={`group relative flex flex-col overflow-hidden rounded-2xl border text-left transition-all duration-300 outline-none ${
                      isActive
                        ? 'border-accent shadow-[0_12px_28px_-4px_color-mix(in_srgb,var(--accent)_20%,transparent)] scale-[1.02]'
                        : 'border-border bg-surface-raised hover:border-border-strong hover:scale-[1.01] hover:shadow-card'
                    }`}
                  >
                    {/* Mini Visual Preview Mockup */}
                    <div
                      className="relative h-28 w-full p-3 transition-colors duration-300"
                      style={{ backgroundColor: item.colors[0] }}
                    >
                      {/* Grid overlay for aesthetic mock look */}
                      <div className="absolute inset-0 opacity-[0.03] bg-grid-soft" />

                      {/* Mock Sidebar representation */}
                      <div
                        className="absolute bottom-2 left-2 top-2 w-7 rounded-md border border-white/5 opacity-80"
                        style={{ backgroundColor: item.colors[1] }}
                      >
                        <div className="m-1 h-1.5 w-1.5 rounded-full" style={{ backgroundColor: item.colors[2] }} />
                        <div className="mx-1 mt-2 h-1 w-3 rounded-full bg-foreground-faint/30" />
                        <div className="mx-1 mt-1.5 h-1 w-4 rounded-full bg-foreground-faint/30" />
                        <div className="mx-1 mt-1.5 h-1 w-3 rounded-full bg-foreground-faint/30" />
                      </div>

                      {/* Mock Main Content Area representation */}
                      <div className="absolute bottom-2 left-10.5 right-2 top-2 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="h-2.5 w-16 rounded-md bg-foreground-secondary/20" />
                          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: item.colors[2] }} />
                        </div>
                        <div className="grid grid-cols-2 gap-1.5">
                          <div
                            className="h-10 rounded-md border border-white/5 p-1"
                            style={{ backgroundColor: item.colors[1] }}
                          >
                            <div className="h-1.5 w-3/4 rounded-full bg-foreground-secondary/20" />
                            <div className="mt-1 h-1 w-1/2 rounded-full bg-foreground-muted/15" />
                            <div className="mt-2 h-2.5 w-full rounded-md" style={{ backgroundColor: `${item.colors[2]}20` }} />
                          </div>
                          <div
                            className="h-10 rounded-md border border-white/5 p-1"
                            style={{ backgroundColor: item.colors[1] }}
                          >
                            <div className="h-1.5 w-2/3 rounded-full bg-foreground-secondary/20" />
                            <div className="mt-1 h-1 w-2/3 rounded-full bg-foreground-muted/15" />
                            <div className="mt-2 h-2.5 w-full rounded-md" style={{ backgroundColor: `${item.colors[2]}20` }} />
                          </div>
                        </div>
                      </div>

                      {/* Ghibli special sparkle overlay */}
                      {item.id === 'ghibli' && (
                        <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/5 via-emerald-600/5 to-transparent pointer-events-none animate-pulse" />
                      )}
                    </div>

                    {/* Card Body */}
                    <div className="flex flex-1 flex-col p-4 bg-surface">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-foreground transition-colors duration-200">
                          {item.label}
                        </span>
                        {isActive && (
                          <motion.span
                            layoutId="active-theme-check"
                            className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-accent-contrast shadow-subtle"
                            transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                          >
                            <Check className="h-3 w-3" strokeWidth={3} aria-hidden="true" />
                          </motion.span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-foreground-secondary leading-relaxed flex-1">
                        {item.vibe}
                      </p>

                      {/* Mini Swatches */}
                      <div className="mt-3.5 flex items-center gap-1.5">
                        {item.colors.map((color, index) => (
                          <span
                            key={index}
                            className="h-3.5 w-3.5 rounded-full ring-1 ring-inset ring-black/10 transition-transform duration-200 group-hover:scale-110"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </MarketSurface>
        </div>
      </div>
    </PageContainer>
  );
}
