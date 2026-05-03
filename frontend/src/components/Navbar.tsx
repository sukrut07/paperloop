'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, WalletCards } from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';

const navItems = [
  { name: 'Institution', href: '/dashboard/institution' },
  { name: 'Recycler', href: '/dashboard/recycler' },
  { name: 'NGO', href: '/dashboard/ngo' },
  { name: 'Analytics', href: '/analytics' },
  { name: 'Explorer', href: '/explorer' },
];

export default function Navbar() {
  const pathname = usePathname();
  const { address, connectWallet, isAmoy, switchToAmoy } = useWallet();

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
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-md px-3 py-2 text-sm font-black uppercase ${
                pathname === item.href ? 'bg-[var(--cyan)] neo-border border-[2px]' : 'hover:bg-black/5'
              }`}
            >
              {item.name}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {address && !isAmoy ? (
            <button className="neo-button bg-[var(--coral)] text-xs" onClick={switchToAmoy}>
              Polygon Amoy
            </button>
          ) : null}
          <button className="neo-button bg-[var(--yellow)] text-xs" onClick={connectWallet}>
            <WalletCards size={16} />
            {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Connect'}
          </button>
          <button className="neo-button bg-white p-2 lg:hidden" aria-label="Open menu">
            <Menu size={18} />
          </button>
        </div>
      </div>
    </nav>
  );
}
