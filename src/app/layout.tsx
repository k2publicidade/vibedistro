import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Sidebar } from '@/components/Sidebar';
import { BottomNavigation } from '@/components/BottomNavigation';
import { MobileHeader } from '@/components/MobileHeader';
import { LanguageProvider } from '@/contexts/LanguageContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'VibeDistro',
  description: 'Music Distribution Platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-black text-white flex`}>
        <LanguageProvider>
          <Sidebar />
          <MobileHeader />
          <main className="flex-1 pt-16 md:pt-0 p-4 md:p-8 pb-24 md:pb-8 overflow-y-auto h-screen">
            {children}
          </main>
          <BottomNavigation />
        </LanguageProvider>
      </body>
    </html>
  );
}
