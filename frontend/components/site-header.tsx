import Link from 'next/link';

const links = [
  { href: '/', label: 'Stores' },
  { href: '/cart', label: 'Cart' },
  { href: '/store-owner-request', label: 'Request ownership' },
  { href: '/store-owner/stores', label: 'My stores' },
  { href: '/store-owner/inventory', label: 'Inventory' },
  { href: '/admin/store-owner-requests', label: 'Admin' },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-stone-200/80 bg-white/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-4 md:flex-row md:items-center md:justify-between">
        <Link className="text-xl font-semibold text-stone-950" href="/">
          Munchies
        </Link>
        <nav className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium text-stone-600">
          {links.map((link) => (
            <Link className="hover:text-emerald-700" href={link.href} key={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>
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
      </div>
    </header>
  );
}
