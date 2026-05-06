'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LegacyRecyclerDashboardPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard/recyclers');
  }, [router]);

  return <div className="neo-card p-6 text-xl font-black uppercase">Opening recycler dashboard...</div>;
}
