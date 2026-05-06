'use client';

import { useEffect, useState } from 'react';
import { BarChart3, BookOpenCheck, Droplets, Leaf, Trees, Users } from 'lucide-react';
import { StatCard } from '@/components/StatCard';
import { api } from '@/lib/api';
import { demoAnalytics } from '@/lib/demo';
import type { AnalyticsSummary } from '@/lib/types';
import { useRequireAuth } from '@/lib/auth';

export default function AnalyticsPage() {
  const [summary, setSummary] = useState<AnalyticsSummary>(demoAnalytics);
  useRequireAuth(['admin']);

  useEffect(() => {
    api.analytics().then(setSummary);
  }, []);

  const totalStatus = summary.statusCounts.reduce((sum, item) => sum + item.count, 0) || 1;

  return (
    <div className="space-y-10">
      <header>
        <p className="font-black uppercase text-[var(--coral)]">Impact Reports</p>
        <h1 className="mt-2 text-4xl font-black uppercase md:text-6xl">Analytics</h1>
        <p className="mt-2 max-w-2xl text-lg font-bold">Operational metrics from MongoDB with room-based proofs and system verification.</p>
      </header>

      <section className="grid gap-5 md:grid-cols-3">
        <StatCard label="Paper Recycled KG" value={summary.impact.paperKg || 0} icon={BarChart3} color="bg-[var(--yellow)]" />
        <StatCard label="Notebooks Created" value={summary.impact.notebooksCreated || 0} icon={BookOpenCheck} color="bg-[var(--green)]" />
        <StatCard label="Students Impacted" value={summary.impact.studentsImpacted || 0} icon={Users} color="bg-[var(--cyan)]" />
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_390px]">
        <div className="neo-card bg-white p-6">
          <h2 className="text-2xl font-black uppercase">Workflow Distribution</h2>
          <div className="mt-6 space-y-4">
            {summary.statusCounts.map((item) => {
              const width = `${Math.max(8, (item.count / totalStatus) * 100)}%`;
              return (
                <div key={item._id}>
                  <div className="mb-2 flex justify-between text-sm font-black uppercase">
                    <span>{item._id}</span>
                    <span>{item.count} batches · {item.weight} kg</span>
                  </div>
                  <div className="h-8 rounded-lg border-[3px] border-black bg-[var(--paper)]">
                    <div className="h-full rounded-md border-r-[3px] border-black bg-[var(--coral)]" style={{ width }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="neo-card bg-black p-6 text-white">
          <h2 className="text-2xl font-black uppercase">Sustainability Estimate</h2>
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between border-b-2 border-white/30 pb-3">
              <span className="flex items-center gap-2 font-black uppercase"><Trees size={18} /> Trees</span>
              <strong>{summary.impact.treesSavedEstimate}</strong>
            </div>
            <div className="flex items-center justify-between border-b-2 border-white/30 pb-3">
              <span className="flex items-center gap-2 font-black uppercase"><Droplets size={18} /> Water Litres</span>
              <strong>{summary.impact.waterSavedLitresEstimate}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 font-black uppercase"><Leaf size={18} /> CO2 KG</span>
              <strong>{summary.impact.co2SavedKgEstimate}</strong>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
