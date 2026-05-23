import type { Metadata } from 'next';
import { SiteHeader } from '@/components/site-header';
import { AuthProvider } from '@/contexts/auth-context';
import './globals.css';

export const metadata: Metadata = {
  title: 'Munchies',
  description: 'Hostel marketplace platform',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <SiteHeader />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
