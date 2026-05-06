'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BarChart3, ShieldCheck, Users } from 'lucide-react';
import { RoleGate } from '@/components/RoleGate';
import { StatCard } from '@/components/StatCard';
import { api } from '@/lib/api';
import type { AnalyticsSummary, UserProfile } from '@/lib/types';
import { demoAnalytics } from '@/lib/demo';

export default function AdminDashboard() {
  const [summary, setSummary] = useState<AnalyticsSummary>(demoAnalytics);
  const [users, setUsers] = useState<UserProfile[]>([]);

  useEffect(() => {
    api.analytics().then(setSummary);
    api.listUsers().then(setUsers).catch(() => setUsers([]));
  }, []);

  return (
    <RoleGate allowed="admin">
      <div className="space-y-10">
        <header className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="font-black uppercase text-[var(--coral)]">Admin Layer</p>
            <h1 className="mt-2 text-4xl font-black uppercase md:text-6xl">Admin Dashboard</h1>
            <p className="mt-2 max-w-2xl text-lg font-bold">Approve participants, monitor platform analytics, and block unsafe accounts.</p>
          </div>
          <Link href="/analytics" className="neo-button bg-[var(--yellow)]">Open Analytics</Link>
        </header>

        <section className="grid gap-5 md:grid-cols-3">
          <StatCard label="Users" value={users.length} icon={Users} color="bg-[var(--cyan)]" />
          <StatCard label="Paper KG" value={summary.impact.paperKg || 0} icon={BarChart3} color="bg-[var(--green)]" />
          <StatCard label="Verified" value={users.filter((user) => user.isVerified).length} icon={ShieldCheck} color="bg-[var(--yellow)]" />
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-black uppercase">User Approvals</h2>
          <div className="grid gap-4">
            {users.map((user) => (
              <div key={user.id} className="neo-card flex flex-col justify-between gap-3 bg-white p-5 md:flex-row md:items-center">
                <div>
                  <p className="text-xl font-black">{user.name}</p>
                  <p className="font-bold opacity-70">{user.email} · {user.role}</p>
                </div>
                <span className={`rounded-md border-2 border-black px-3 py-1 text-sm font-black uppercase ${user.isVerified ? 'bg-[var(--green)]' : 'bg-[var(--coral)]'}`}>
                  {user.isVerified ? 'Approved' : 'Pending'}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </RoleGate>
  );
}
