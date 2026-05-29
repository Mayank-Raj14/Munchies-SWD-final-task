'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  BarChart3,
  ClipboardList,
  LogOut,
  PackageSearch,
  ReceiptText,
  ScrollText,
  Settings2,
  ShieldCheck,
  ShoppingCart,
  Store,
  User,
  LayoutGrid,
  BadgePercent,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { primaryButtonClass, secondaryButtonClass } from '@/components/marketplace-ui';
import { BrandMark } from '@/components/brand-assets';
import { ThemeSettings } from '@/components/theme-settings';
import { useAuth, type AuthUser } from '@/contexts/auth-context';

type SidebarItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  roles?: AuthUser['role'][];
  match?: 'exact' | 'startsWith';
};

const primaryItems: SidebarItem[] = [
  { href: '/', label: 'Home', icon: LayoutGrid, match: 'exact' },
  {
    href: '/bookings',
    label: 'Orders',
    icon: ClipboardList,
    roles: ['USER', 'STORE_OWNER', 'ADMIN'],
  },
  { href: '/cart', label: 'Cart', icon: ShoppingCart, roles: ['USER', 'STORE_OWNER', 'ADMIN'] },
];

const accountItems: SidebarItem[] = [
  { href: '/profile', label: 'Profile', icon: User, roles: ['USER', 'STORE_OWNER', 'ADMIN'] },
  {
    href: '/analytics',
    label: 'Analytics',
    icon: BarChart3,
    roles: ['USER', 'STORE_OWNER', 'ADMIN'],
  },
  { href: '/store-owner-request', label: 'Seller onboarding', icon: ScrollText, roles: ['USER'] },
  {
    href: '/store-owner/stores',
    label: 'My stores',
    icon: Store,
    roles: ['STORE_OWNER', 'ADMIN'],
    match: 'startsWith',
  },
  {
    href: '/store-owner/orders',
    label: 'Seller',
    icon: ReceiptText,
    roles: ['STORE_OWNER', 'ADMIN'],
    match: 'startsWith',
  },
  {
    href: '/store-owner/inventory',
    label: 'Stock',
    icon: PackageSearch,
    roles: ['STORE_OWNER', 'ADMIN'],
    match: 'startsWith',
  },
  {
    href: '/store-owner/campaigns',
    label: 'Campaigns',
    icon: BadgePercent,
    roles: ['STORE_OWNER', 'ADMIN'],
    match: 'startsWith',
  },
  {
    href: '/store-owner/analytics',
    label: 'Seller analytics',
    icon: BarChart3,
    roles: ['STORE_OWNER', 'ADMIN'],
    match: 'startsWith',
  },
  {
    href: '/admin',
    label: 'Admin',
    icon: ShieldCheck,
    roles: ['ADMIN'],
    match: 'startsWith',
  },
];

const canSeeItem = (item: SidebarItem, user: AuthUser | null) => {
  if (!item.roles) return true;
  return user ? item.roles.includes(user.role) : false;
};

const isActiveItem = (item: SidebarItem, pathname: string) => {
  if (item.match === 'startsWith') {
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  }
  return pathname === item.href;
};

function NavLink({ item, collapsed }: { item: SidebarItem; collapsed: boolean }) {
  const pathname = usePathname();
  const Icon = item.icon;
  const isActive = isActiveItem(item, pathname);

  return (
    <Link
      className={`group relative flex h-9.5 items-center gap-2.5 rounded-xl px-3 text-[13px] font-semibold transition-colors transition-transform duration-200 ease-out ${
        isActive
          ? 'text-accent'
          : 'text-foreground-secondary hover:bg-surface-hover hover:text-foreground'
      }`}
      href={item.href}
    >
      {/* Sliding active pill */}
      {isActive ? (
        <motion.span
          layoutId="sidebar-active-pill"
          className="absolute inset-0 rounded-xl bg-accent-muted border-l-2 border-accent shadow-[inset_0_0_12px_-4px_color-mix(in_srgb,var(--accent)_15%,transparent)]"
          transition={{ type: 'spring', stiffness: 420, damping: 32 }}
        />
      ) : null}

      <Icon
        className={`relative z-10 ml-0.5 h-[16px] w-[16px] shrink-0 transition-all duration-150 group-hover:scale-110 ${
          isActive ? 'text-accent drop-shadow-[0_0_6px_color-mix(in_srgb,var(--accent)_60%,transparent)]' : 'text-foreground-muted group-hover:text-foreground'
        }`}
        aria-hidden="true"
      />

      <AnimatePresence mode="wait" initial={false}>
        {!collapsed ? (
          <motion.span
            key="label"
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -6 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30, duration: 0.18 }}
            className="relative z-10 truncate"
          >
            {item.label}
          </motion.span>
        ) : null}
      </AnimatePresence>
    </Link>
  );
}

export function Sidebar({
  collapsed,
  setCollapsed,
}: {
  collapsed: boolean;
  setCollapsed: (val: boolean) => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading, logout } = useAuth();
  const [settingsOpen, setSettingsOpen] = useState(false);

  const visiblePrimary = primaryItems.filter((item) => canSeeItem(item, user));
  const visibleAccount = accountItems.filter((item) => canSeeItem(item, user));
  const activeAccountItem = visibleAccount.find((item) => isActiveItem(item, pathname));
  const mobileItems = activeAccountItem
    ? [...visiblePrimary.slice(0, 3), activeAccountItem]
    : [...visiblePrimary.slice(0, 3), ...visibleAccount.slice(0, 1)].slice(0, 4);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <>
      {/* Desktop sidebar */}
      <motion.aside
        animate={{ width: collapsed ? '4.75rem' : '15rem' }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        className="fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-border-subtle bg-surface/95 lg:flex shadow-sm backdrop-blur-sm"
      >
        {/* Header */}
        <div className="relative flex h-14 items-center justify-between px-4 border-b border-border-subtle">
          <Link className="flex min-w-0 items-center" href="/">
            <BrandMark compact={collapsed} />
          </Link>

          {/* Collapse toggle */}
          <motion.button
            onClick={() => setCollapsed(!collapsed)}
            whileHover={{ scale: 1.12 }}
            whileTap={{ scale: 0.88 }}
            className="absolute -right-3.5 top-[18px] flex h-7 w-7 items-center justify-center rounded-full border border-border bg-surface shadow-subtle text-foreground-muted hover:text-foreground hover:bg-surface-raised hover:border-border-strong hover:shadow-[0_4px_12px_-2px_rgba(0,0,0,0.3)] will-change-transform transition-colors transition-transform duration-200 ease-out elevated-hover"
            type="button"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? (
              <ChevronRight className="h-3.5 w-3.5" />
            ) : (
              <ChevronLeft className="h-3.5 w-3.5" />
            )}
          </motion.button>
        </div>

        {/* Navigation */}
        <nav className="flex flex-1 flex-col overflow-y-auto px-3 pb-3 pt-4 scrollbar-none">
          <div className="space-y-0.5">
            {visiblePrimary.map((item) => (
              <NavLink item={item} collapsed={collapsed} key={`${item.href}-${item.label}`} />
            ))}
          </div>

          {visibleAccount.length > 0 ? (
            <div className="mt-6">
              <AnimatePresence mode="wait" initial={false}>
                {!collapsed ? (
                  <motion.p
                    key="account-label"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-foreground-faint"
                  >
                    Account
                  </motion.p>
                ) : (
                  <motion.div
                    key="account-divider"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="border-t border-border-subtle my-3"
                  />
                )}
              </AnimatePresence>

              <div className="space-y-0.5">
                {visibleAccount.map((item) => (
                  <NavLink item={item} collapsed={collapsed} key={item.href} />
                ))}
              </div>
            </div>
          ) : null}

          {/* Seller badge */}
          <AnimatePresence>
            {(user?.role === 'STORE_OWNER' || user?.role === 'ADMIN') && !collapsed ? (
              <motion.div
                key="seller-badge"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                className="mt-5 rounded-xl border border-accent/20 bg-accent-muted/50 p-3"
              >
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
                  <p className="text-[11px] font-bold text-accent">Seller Active</p>
                </div>
                <p className="mt-1 text-[10px] leading-relaxed text-foreground-muted font-medium">
                  Store inventory and order tools unlocked.
                </p>
              </motion.div>
            ) : null}
          </AnimatePresence>

          {/* Settings */}
          <div className="mt-auto pt-4">
            <Link
              className={`flex h-9.5 w-full items-center gap-2.5 rounded-xl px-3 text-[13px] font-semibold transition-colors transition-transform duration-200 ease-out ${
                pathname === '/settings'
                  ? 'bg-accent-muted text-accent'
                  : 'text-foreground-secondary hover:bg-surface-hover hover:text-foreground'
              }`}
              href="/settings"
            >
              <Settings2
                className={`h-[16px] w-[16px] shrink-0 transition-transform duration-300 ${pathname === '/settings' ? 'rotate-45 text-accent' : 'text-foreground-muted'}`}
                aria-hidden="true"
              />
              {!collapsed ? <span>Settings</span> : null}
            </Link>
          </div>
        </nav>

        {/* User dock */}
        <div className="border-t border-border-subtle p-3 bg-surface-hover/20">
          {isLoading ? (
            <div className="h-12 animate-pulse rounded-xl bg-surface-raised" />
          ) : user ? (
            <div className="rounded-xl border border-border bg-surface p-2.5 shadow-sm transition-all duration-200 hover:border-border-strong">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-accent text-xs font-bold text-accent-contrast shadow-subtle ring-2 ring-accent/20">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                {!collapsed ? (
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] font-bold text-foreground leading-tight">
                      {user.name}
                    </p>
                    <p className="truncate text-[10px] text-foreground-muted font-medium mt-0.5">
                      {user.email}
                    </p>
                  </div>
                ) : null}
              </div>
              {!collapsed ? (
                <button
                  className="mt-2 flex h-8 w-full items-center justify-center gap-1.5 rounded-lg border border-border text-[11px] font-semibold text-foreground-secondary transition-colors transition-transform duration-200 ease-out hover:bg-surface-hover hover:text-foreground hover:border-border-strong active:scale-95 elevated-hover"
                  onClick={handleLogout}
                  type="button"
                >
                  <LogOut className="h-3 w-3" aria-hidden="true" />
                  Sign out
                </button>
              ) : null}
            </div>
          ) : (
            <div className="space-y-1.5">
              <Link className={`${primaryButtonClass} w-full text-xs h-8 rounded-lg`} href="/login">
                {!collapsed ? 'Sign in' : 'Login'}
              </Link>
              {!collapsed ? (
                <Link
                  className={`${secondaryButtonClass} w-full text-xs h-8 rounded-lg`}
                  href="/register"
                >
                  Create account
                </Link>
              ) : null}
            </div>
          )}
        </div>
      </motion.aside>

      {/* Mobile bottom nav */}
      <motion.nav
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 340, damping: 30, delay: 0.1 }}
        aria-label="Mobile"
        className="fixed inset-x-3 bottom-3 z-40 border border-white/6 bg-surface/88 pb-safe pt-1.5 backdrop-blur-2xl shadow-[0_16px_48px_-12px_rgba(0,0,0,0.55),0_0_0_1px_rgba(255,255,255,0.04)] rounded-2xl lg:hidden"
      >
        <div className="mx-auto grid max-w-md grid-cols-4 gap-0.5 px-1">
          {mobileItems.map((item) => {
            const Icon = item.icon;
            const isActive = isActiveItem(item, pathname);

            return (
              <Link
                className={`relative flex min-h-[52px] flex-col items-center justify-center gap-1 rounded-xl text-[9.5px] font-bold transition-colors transition-transform duration-200 ease-out ${
                  isActive ? 'text-accent' : 'text-foreground-muted hover:text-foreground'
                }`}
                href={item.href}
                key={item.href}
              >
                {isActive ? (
                  <motion.span
                    layoutId="mobile-nav-pill"
                    className="absolute inset-0 rounded-xl bg-accent-muted/60 border-t-2 border-accent shadow-[0_-2px_12px_-2px_color-mix(in_srgb,var(--accent)_35%,transparent)]"
                    transition={{ type: 'spring', stiffness: 420, damping: 30 }}
                  />
                ) : null}
                <Icon className="relative z-10 h-[17px] w-[17px]" aria-hidden="true" />
                <span className="relative z-10 leading-none">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </motion.nav>
    </>
  );
}
