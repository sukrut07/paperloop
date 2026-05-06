'use client';

import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';

const dashboardByRole = {
  institution: '/dashboard',
  recycler: '/dashboard/recyclers',
  ngo: '/dashboard/ngo',
  admin: '/dashboard/admin',
};

export default function VerifyEmailPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    router.replace(user ? dashboardByRole[user.role] : '/login');
  }, [loading, router, user]);

  return (
    <div className="neo-card mx-auto max-w-2xl space-y-5 bg-white p-6 text-center">
      <Loader2 className="mx-auto animate-spin" size={48} strokeWidth={3} />
      <h1 className="text-3xl font-black uppercase">Opening dashboard...</h1>
    </div>
  );
}
