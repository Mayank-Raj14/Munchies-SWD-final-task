'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/contexts/auth-context';

const links = [{ href: '/', label: 'Stores' }];

export function SiteHeader() {
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const userLinks = user
    ? [
        { href: '/cart', label: 'Cart' },
        { href: '/bookings', label: 'Bookings' },
        ...(user.role === 'USER'
          ? [{ href: '/store-owner-request', label: 'Request ownership' }]
          : []),
        ...(user.role === 'STORE_OWNER' || user.role === 'ADMIN'
          ? [
              { href: '/store-owner/orders', label: 'Orders' },
              { href: '/store-owner/stores', label: 'My stores' },
              { href: '/store-owner/inventory', label: 'Inventory' },
            ]
          : []),
        ...(user.role === 'ADMIN' ? [{ href: '/admin/store-owner-requests', label: 'Admin' }] : []),
      ]
    : [];

  return (
    <header className="sticky top-0 z-30 border-b border-stone-200/80 bg-white/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-4 md:flex-row md:items-center md:justify-between">
        <Link className="text-xl font-semibold text-stone-950" href="/">
          Munchies
        </Link>
        <nav className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium text-stone-600">
          {[...links, ...userLinks].map((link) => (
            <Link className="hover:text-emerald-700" href={link.href} key={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>
        {isLoading ? (
          <p className="text-sm text-stone-500">Loading account...</p>
        ) : user ? (
          <div className="flex flex-wrap items-center gap-3 text-sm font-medium">
            <span className="text-stone-600">
              {user.name} ({user.role})
            </span>
            <button
              className="text-stone-950 underline decoration-emerald-500 underline-offset-4"
              onClick={handleLogout}
              type="button"
            >
              Logout
            </button>
          </div>
        ) : (
          <div className="flex gap-3 text-sm font-medium">
            <Link className="text-stone-600 hover:text-emerald-700" href="/login">
              Login
            </Link>
            <Link
              className="text-stone-950 underline decoration-emerald-500 underline-offset-4"
              href="/register"
            >
              Register
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
