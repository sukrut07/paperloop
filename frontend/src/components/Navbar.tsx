'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut, Menu } from 'lucide-react';
import { useAuth } from '@/lib/auth';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const role = user?.role || 'institution';

  const navItems =
    role === 'recycler'
      ? [
          { name: 'Dashboard', href: '/dashboard/recyclers' },
          { name: 'Profile', href: '/dashboard/profile' },
        ]
      : role === 'ngo'
        ? [
            { name: 'Dashboard', href: '/dashboard/ngo' },
            { name: 'Profile', href: '/dashboard/profile' },
          ]
        : [
            { name: 'Dashboard', href: '/dashboard' },
            { name: 'History', href: '/dashboard/history' },
            { name: 'Recyclers', href: '/dashboard/recyclers' },
            { name: 'Profile', href: '/dashboard/profile' },
          ];

  async function handleLogout() {
    await logout();
    router.replace('/login');
  }

  return (
    <nav className="sticky top-0 z-50 border-b-[3px] border-black bg-[var(--paper)]">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-6">
        <Link href="/" className="flex items-center gap-2 text-2xl font-black uppercase">
          <span className="grid h-10 w-10 place-items-center rounded-lg border-[3px] border-black bg-[var(--green)] shadow-[4px_4px_0_#111]">
            PL
          </span>
          Paperloop
        </Link>

        <div className="hidden items-center gap-2 lg:flex">
          {user ? (
            navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-md px-3 py-2 text-sm font-black uppercase ${
                  pathname === item.href || pathname.startsWith(`${item.href}/`) ? 'neo-border border-[2px] bg-[var(--cyan)]' : 'hover:bg-black/5'
                }`}
              >
                {item.name}
              </Link>
            ))
          ) : (
            <>
              <Link href="/login" className="rounded-md px-3 py-2 text-sm font-black uppercase hover:bg-black/5">
                Login
              </Link>
              <Link href="/signup" className="rounded-md px-3 py-2 text-sm font-black uppercase hover:bg-black/5">
                Sign Up
              </Link>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          {user ? (
            <button className="neo-button bg-[var(--yellow)] text-xs" onClick={handleLogout}>
              <LogOut size={16} />
              Logout
            </button>
          ) : null}
          <button className="neo-button bg-white p-2 lg:hidden" aria-label="Open menu">
            <Menu size={18} />
          </button>
        </div>
      </div>
    </nav>
  );
}
