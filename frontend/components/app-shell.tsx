'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { BrandMark } from '@/components/brand-assets';
import { Sidebar } from '@/components/sidebar';
import { useAuth } from '@/contexts/auth-context';

const authRoutes = new Set(['/login', '/register']);
const browseRoutes = new Set(['/', '/stores']);

const pageTitles: Record<string, string> = {
  '/cart': 'Cart',
  '/bookings': 'Orders',
  '/profile': 'Profile',
  '/settings': 'Settings',
  '/store-owner-request': 'Open a store',
  '/store-owner/orders': 'Seller orders',
  '/store-owner/inventory': 'Inventory',
  '/store-owner/stores': 'My stores',
  '/admin': 'Schema console',
  '/admin/store-owner-requests': 'Approvals',
};

function getPageTitle(pathname: string) {
  if (pageTitles[pathname]) {
    return pageTitles[pathname];
  }
  const match = Object.entries(pageTitles).find(([path]) => pathname.startsWith(`${path}/`));
  return match?.[1] ?? 'Munchies';
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, isLoading } = useAuth();
  const isAuthRoute = authRoutes.has(pathname);
  const isBrowseRoute = browseRoutes.has(pathname);
  const title = getPageTitle(pathname);

  const [collapsed, setCollapsed] = useState(false);

  if (isAuthRoute) return children;
  if (pathname === '/admin') return children;

  const sidebarWidth = collapsed ? '4.75rem' : '15rem';

  return (
    <div
      style={{ '--sidebar-width': sidebarWidth } as React.CSSProperties}
      className="min-h-screen bg-canvas lg:pl-[var(--sidebar-width)] transition-[padding] duration-300 ease-[cubic-bezier(0.32,0,0.67,0)]"
    >
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />

      <div className="flex min-h-screen min-w-0 flex-col overflow-x-clip">
        {!isBrowseRoute ? (
          <header className="sticky top-0 z-30 border-b border-border-subtle bg-canvas/80 shadow-header backdrop-blur-xl will-change-transform">
            <div className="flex h-14 items-center gap-3 px-4 sm:px-5 lg:px-7">
              <Link
                href="/"
                className="flex shrink-0 items-center text-[15px] font-semibold tracking-tight text-foreground lg:hidden"
              >
                <BrandMark compact />
              </Link>

              <motion.h1
                key={pathname}
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 420, damping: 32, duration: 0.25 }}
                className="hidden min-w-0 truncate text-sm font-bold text-foreground lg:block tracking-tight"
              >
                {title}
              </motion.h1>

              <div className="ml-auto flex items-center gap-2">
                {isLoading ? (
                  <div className="h-8 w-8 animate-pulse rounded-full bg-surface-raised" />
                ) : user ? (
                  <Link
                    href="/profile"
                    aria-label="Profile"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-accent text-xs font-bold text-accent-contrast transition-all duration-200 hover:opacity-85 hover:scale-105 active:scale-95 shadow-subtle border border-white/10"
                  >
                    {user.name.charAt(0).toUpperCase()}
                  </Link>
                ) : (
                  <div className="flex items-center gap-2 text-xs font-bold">
                    <Link
                      href="/login"
                      className="rounded-xl border border-border bg-surface px-3 py-1.5 text-foreground-secondary transition-all duration-200 hover:text-foreground hover:border-border-strong hover:bg-surface-raised"
                    >
                      Login
                    </Link>
                    <Link
                      href="/register"
                      className="rounded-xl bg-accent px-3 py-1.5 text-accent-contrast transition-all duration-200 hover:opacity-90 hover:scale-[1.03] active:scale-95 shadow-subtle"
                    >
                      Join
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </header>
        ) : null}

        {/* Smooth staggered page transitions */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32, mass: 0.75 }}
            className="flex-1 flex flex-col will-change-transform"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
