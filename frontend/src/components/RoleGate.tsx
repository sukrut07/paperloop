'use client';

import Link from 'next/link';
import type { AppRole } from '@/hooks/useRole';
import { useRole } from '@/hooks/useRole';

const labels: Record<AppRole, string> = {
  teacher: 'Teacher',
  recycler: 'Recycler',
  ngo: 'NGO',
};

export function RoleGate({
  allowed,
  children,
}: {
  allowed: AppRole;
  children: React.ReactNode;
}) {
  const { role, setRole } = useRole();

  if (role === allowed) return <>{children}</>;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="neo-card bg-[var(--coral)] p-6">
        <p className="font-black uppercase">Wrong dashboard for your selected role</p>
        <h1 className="mt-2 text-3xl font-black uppercase">{labels[allowed]} dashboard only</h1>
        <p className="mt-3 font-bold">
          Your current role is {labels[role]}. Paperloop keeps teacher, recycler, and NGO workflows separate so progress updates stay clean.
        </p>
      </div>
      <button className="neo-button bg-[var(--yellow)]" onClick={() => setRole(allowed)}>
        Switch to {labels[allowed]}
      </button>
      <Link href="/profile" className="neo-button bg-white">
        Manage Role
      </Link>
    </div>
  );
}
