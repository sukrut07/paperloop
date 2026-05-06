import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import { AuthProvider } from '@/lib/auth';

export const metadata: Metadata = {
  title: 'Paperloop | Collaborative Paper Recycling',
  description: 'A room-based educational paper recycling ecosystem connecting institutions, recyclers, and NGOs.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <div className="flex min-h-screen flex-col">
            <Navbar />
            <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 md:px-6 md:py-10">{children}</main>
            <footer className="border-t-[3px] border-black bg-[var(--paper)] px-6 py-5 text-center text-sm font-black uppercase">
              Real-time collaborative recycling workflow for schools, recyclers, and NGOs.
            </footer>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
