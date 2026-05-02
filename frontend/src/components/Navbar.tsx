'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';

const Navbar = () => {
  const pathname = usePathname();

  const navItems = [
    { name: 'Home', href: '/' },
    { name: 'Institution', href: '/dashboard/institution' },
    { name: 'Recycler', href: '/dashboard/recycler' },
    { name: 'NGO', href: '/dashboard/ngo' },
    { name: 'Explorer', href: '/explorer' },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-white border-b-4 border-black px-6 py-4 flex justify-between items-center">
      <Link href="/" className="text-2xl font-black uppercase tracking-tighter">
        Paper<span className="bg-primary px-1">loop</span>
      </Link>

      <div className="hidden md:flex gap-8 font-bold uppercase">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`hover:text-secondary transition-colors ${
              pathname === item.href ? 'underline decoration-4 underline-offset-4' : ''
            }`}
          >
            {item.name}
          </Link>
        ))}
      </div>

      <div className="flex gap-4">
        <button className="neo-button bg-accent text-sm">
          Connect Wallet
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
