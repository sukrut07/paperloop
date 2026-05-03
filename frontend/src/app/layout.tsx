import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'Paperloop | Blockchain Paper Recycling',
  description: 'A three-layer blockchain ecosystem for institutions, recyclers, and NGOs.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <div className="flex min-h-screen flex-col">
          <Navbar />
          <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 md:px-6 md:py-10">{children}</main>
          <footer className="border-t-[3px] border-black bg-[var(--paper)] px-6 py-5 text-center text-sm font-black uppercase">
            Paperloop runs mutable workflows on MongoDB and immutable proofs on Polygon Amoy.
          </footer>
        </div>
      </body>
    </html>
  );
}
