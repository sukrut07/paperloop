'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import InstitutionDashboard from '@/app/dashboard/institution/page';

const dashboardByRole = {
  institution: '/dashboard',
  recycler: '/dashboard/recyclers',
  ngo: '/dashboard/ngo',
  admin: '/dashboard/admin',
};

export default function DashboardIndex() {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.role || user.role === 'institution') return;
    router.replace(dashboardByRole[user.role]);
  }, [router, user?.role]);

  if (!user?.role || user.role === 'institution') {
    return <InstitutionDashboard />;
  }

  return <div className="neo-card p-6 text-xl font-black uppercase">Opening dashboard...</div>;
}
