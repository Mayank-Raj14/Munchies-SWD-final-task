'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { BrandMark } from '@/components/brand-assets';
import { Sidebar } from '@/components/sidebar';
import { useAuth } from '@/contexts/auth-context';

const authRoutes = new Set(['/login', '/register']);
const browseRoutes = new Set(['/', '/stores']);

const pageTitles: Record<string, string> = {
  '/cart': 'Cart',
  '/bookings': 'Orders',
  '/profile': 'Profile',
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

  if (isAuthRoute) return children;
  if (pathname === '/admin') return children;

  return (
    <div className="min-h-screen bg-canvas lg:pl-sidebar">
      <Sidebar />

      <div className="flex min-h-screen min-w-0 flex-col overflow-x-clip">
        {!isBrowseRoute ? (
          <header className="sticky top-0 z-30 border-b border-border-subtle bg-canvas/90 shadow-header backdrop-blur-md">
            <div className="flex h-12 items-center gap-3 px-4 sm:px-5 lg:px-7">
              <Link
                href="/"
                className="flex shrink-0 items-center text-[15px] font-semibold tracking-tight text-foreground lg:hidden"
              >
                <BrandMark compact />
              </Link>

              <h1 className="hidden min-w-0 truncate text-sm font-medium text-foreground lg:block">
                {title}
              </h1>

              <div className="ml-auto flex items-center gap-2">
                {isLoading ? (
                  <div className="h-8 w-8 animate-pulse rounded-full bg-surface-raised" />
                ) : user ? (
                  <Link
                    href="/profile"
                    aria-label="Profile"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-contrast transition-opacity duration-ui hover:opacity-90"
                  >
                    {user.name.charAt(0).toUpperCase()}
                  </Link>
                ) : (
                  <div className="flex items-center gap-1.5 text-sm font-medium">
                    <Link
                      href="/login"
                      className="rounded-lg px-2.5 py-1.5 text-foreground-secondary transition-colors duration-ui hover:text-foreground"
                    >
                      Login
                    </Link>
                    <Link
                      href="/register"
                      className="rounded-lg bg-accent px-2.5 py-1.5 text-accent-contrast transition-opacity duration-ui hover:opacity-90"
                    >
                      Join
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </header>
        ) : null}

        {children}
      </div>
    </div>
  );
}
