import type { Metadata } from 'next';
import { Inter, Fraunces, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const fraunces = Fraunces({ subsets: ['latin'], variable: '--font-fraunces', axes: ['opsz'] });
const jetbrains = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains', weight: ['500', '600'] });

export const metadata: Metadata = {
  title: { default: 'Brewline — Cafe Management', template: '%s | Brewline' },
  description: 'Modern cafe operations platform — orders, kitchen, tables, and guest menu.',
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${fraunces.variable} ${jetbrains.variable}`}>
        {children}
      </body>
    </html>
  );
}
