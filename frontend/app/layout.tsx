import type { Metadata } from 'next';
import Script from 'next/script';

import { AppShell } from '@/components/app-shell';
import { AuthProvider } from '@/contexts/auth-context';
import { ThemeProvider } from '@/contexts/theme-context';
import { DEFAULT_THEME } from '@/lib/themes';
import './globals.css';

export const metadata: Metadata = {
  title: 'Munchies',
  description: 'Munchies',
};

const themeBootScript = `(function(){try{var k='munchies-theme';var t=localStorage.getItem(k);var d=document.documentElement;var valid=['dark','light','ice','purple','emerald'];document.documentElement.dataset.theme=valid.indexOf(t)>=0?t:'${DEFAULT_THEME}';}catch(e){document.documentElement.dataset.theme='${DEFAULT_THEME}';}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme={DEFAULT_THEME} suppressHydrationWarning>
      <head>
        <Script id="theme-boot" strategy="beforeInteractive">
          {themeBootScript}
        </Script>
      </head>
      <body>
        <ThemeProvider>
          <AuthProvider>
            <AppShell>{children}</AppShell>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
