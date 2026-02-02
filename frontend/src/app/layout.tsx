import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Sidebar } from '@/components/Sidebar';
import { BottomNavigation } from '@/components/BottomNavigation';
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
      <body className={`${inter.className} bg-black text-white overflow-hidden`}>
        <LanguageProvider>
          <div className="flex h-screen w-full relative">
            {/* Desktop Sidebar - Hidden on Mobile */}
            <div className="hidden md:flex flex-shrink-0 h-full">
              <Sidebar />
            </div>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto w-full relative">
              <div className="pb-24 md:pb-8 p-4 md:p-8 min-h-screen">
                {children}
              </div>
            </main>

            {/* Mobile Navigation - Visible only on Mobile */}
            <div className="md:hidden">
              <BottomNavigation />
            </div>
          </div>
        </LanguageProvider>
      </body>
    </html>
  );
}
