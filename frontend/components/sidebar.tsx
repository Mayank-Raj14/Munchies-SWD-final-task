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
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useState } from 'react';

import { primaryButtonClass, secondaryButtonClass } from '@/components/marketplace-ui';
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
  if (!item.roles) {
    return true;
  }
  return user ? item.roles.includes(user.role) : false;
};

const isActiveItem = (item: SidebarItem, pathname: string) => {
  if (item.match === 'startsWith') {
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  }
  return pathname === item.href;
};

function NavLink({ item }: { item: SidebarItem }) {
  const pathname = usePathname();
  const Icon = item.icon;
  const isActive = isActiveItem(item, pathname);

  return (
    <Link
      className={`relative flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-[13px] font-medium transition-all duration-ui ${
        isActive
          ? 'bg-accent-muted text-accent'
          : 'text-foreground-secondary hover:bg-surface-hover hover:text-foreground'
      }`}
      href={item.href}
    >
      {isActive ? (
        <span
          aria-hidden="true"
          className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-accent"
        />
      ) : null}
      <Icon
        className={`ml-0.5 h-[15px] w-[15px] shrink-0 ${isActive ? 'text-accent' : 'text-foreground-muted'}`}
        aria-hidden="true"
      />
      <span className="truncate">{item.label}</span>
    </Link>
  );
}

export function Sidebar() {
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
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-sidebar flex-col border-r border-border-subtle bg-surface lg:flex">
        <div className="flex h-12 items-center px-4">
          <Link className="flex min-w-0 items-center gap-2.5" href="/">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent text-xs font-bold text-accent-contrast">
              M
            </span>
            <span className="truncate text-[15px] font-semibold tracking-tight text-foreground">
              Munchies
            </span>
          </Link>
        </div>

        <nav className="flex flex-1 flex-col overflow-y-auto px-2.5 pb-2">
          <div className="space-y-0.5">
            {visiblePrimary.map((item) => (
              <NavLink item={item} key={`${item.href}-${item.label}`} />
            ))}
          </div>

          {visibleAccount.length > 0 ? (
            <div className="mt-5">
              <p className="mb-1.5 px-2.5 text-[10px] font-medium uppercase tracking-wider text-foreground-faint">
                Account
              </p>
              <div className="space-y-0.5">
                {visibleAccount.map((item) => (
                  <NavLink item={item} key={item.href} />
                ))}
              </div>
            </div>
          ) : null}

          {user?.role === 'STORE_OWNER' || user?.role === 'ADMIN' ? (
            <div className="mt-3 rounded-xl border border-accent/20 bg-accent-muted p-2.5">
              <p className="text-[11px] font-semibold text-accent">Seller mode active</p>
              <p className="mt-1 text-[11px] leading-relaxed text-foreground-muted">
                Store, inventory, and order tools are unlocked.
              </p>
            </div>
          ) : null}

          <div className="mt-auto pt-4">
            <button
              className={`flex h-9 w-full items-center gap-2.5 rounded-lg px-2.5 text-[13px] font-medium transition-all duration-ui ${
                settingsOpen
                  ? 'bg-accent-muted text-accent'
                  : 'text-foreground-secondary hover:bg-surface-hover hover:text-foreground'
              }`}
              onClick={() => setSettingsOpen((open) => !open)}
              type="button"
            >
              <Settings2 className="h-[15px] w-[15px] shrink-0" aria-hidden="true" />
              Settings
            </button>
            {settingsOpen ? (
              <div className="mt-2 rounded-xl border border-border bg-surface-raised/80 p-2">
                <ThemeSettings compact />
              </div>
            ) : null}
          </div>
        </nav>

        <div className="border-t border-border-subtle p-2.5">
          {isLoading ? (
            <div className="h-12 animate-pulse rounded-xl bg-surface-raised" />
          ) : user ? (
            <div className="rounded-xl border border-border bg-surface-raised/60 p-2.5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-contrast">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-foreground">{user.name}</p>
                  <p className="truncate text-[11px] text-foreground-muted">{user.email}</p>
                </div>
              </div>
              <button
                className="mt-2 flex h-8 w-full items-center justify-center gap-1.5 rounded-lg border border-border text-[12px] font-medium text-foreground-secondary transition-all duration-ui hover:bg-surface-hover hover:text-foreground"
                onClick={handleLogout}
                type="button"
              >
                <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                Sign out
              </button>
            </div>
          ) : (
            <div className="space-y-1.5">
              <Link className={`${primaryButtonClass} w-full`} href="/login">
                Sign in
              </Link>
              <Link className={`${secondaryButtonClass} w-full`} href="/register">
                Create account
              </Link>
            </div>
          )}
        </div>
      </aside>

      <nav
        aria-label="Mobile"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border-subtle bg-surface/95 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1 backdrop-blur-md lg:hidden"
      >
        <div className="grid grid-cols-4 gap-0.5 px-1">
          {mobileItems.map((item) => {
            const Icon = item.icon;
            const isActive = isActiveItem(item, pathname);

            return (
              <Link
                className={`flex min-h-[52px] flex-col items-center justify-center gap-0.5 rounded-lg text-[10px] font-medium transition-colors duration-ui ${
                  isActive ? 'text-accent' : 'text-foreground-muted'
                }`}
                href={item.href}
                key={item.href}
              >
                <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
