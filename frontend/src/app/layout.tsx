import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Sidebar } from '@/components/Sidebar';
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
          <main className="flex-1 p-8 overflow-y-auto h-screen">
            {children}
          </main>
        </LanguageProvider>
      </body>
    </html>
  );
}
