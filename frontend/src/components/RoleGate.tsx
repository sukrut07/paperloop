'use client';

import Link from 'next/link';
import type { AppRole } from '@/hooks/useRole';
import { useRequireAuth } from '@/lib/auth';

const labels: Record<AppRole, string> = {
  institution: 'Institution',
  recycler: 'Recycler',
  ngo: 'NGO',
  admin: 'Admin',
};

export function RoleGate({
  allowed,
  children,
}: {
  allowed: AppRole;
  children: React.ReactNode;
}) {
  const { user, loading } = useRequireAuth([allowed]);

  if (loading || !user) return null;
  if (user.role === allowed) return <>{children}</>;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="neo-card bg-[var(--coral)] p-6">
        <p className="font-black uppercase">Wrong dashboard for your selected role</p>
        <h1 className="mt-2 text-3xl font-black uppercase">{labels[allowed]} dashboard only</h1>
        <p className="mt-3 font-bold">
          Your current role is {labels[user.role]}. Paperloop keeps institution, recycler, NGO, and admin workflows separate so progress updates stay clean.
        </p>
      </div>
      <Link href="/profile" className="neo-button bg-white">Manage Profile</Link>
    </div>
  );
}
