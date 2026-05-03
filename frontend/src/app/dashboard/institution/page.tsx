'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { BookOpenCheck, ClipboardList, Plus, TrendingUp, Users } from 'lucide-react';
import { StatCard } from '@/components/StatCard';
import { StatusBadge } from '@/components/StatusBadge';
import { RoleGate } from '@/components/RoleGate';
import { ProgressUpdateForm } from '@/components/ProgressUpdateForm';
import { api } from '@/lib/api';
import type { Batch } from '@/lib/types';

export default function InstitutionDashboard() {
  const [batches, setBatches] = useState<Batch[]>([]);

  const loadBatches = () => {
    api.listBatches().then(setBatches);
  };

  useEffect(() => {
    loadBatches();
  }, []);

  const stats = useMemo(() => {
    const totalWeight = batches.reduce((sum, batch) => sum + batch.weight, 0);
    const notebooks = batches.reduce((sum, batch) => sum + (batch.notebooksEstimate || 0), 0);
    return [
      { label: 'Paper Batches', value: batches.length, icon: ClipboardList, color: 'bg-[var(--yellow)]' },
      { label: 'Active Rooms', value: '3', icon: Users, color: 'bg-[var(--cyan)]' },
      { label: 'KG Registered', value: totalWeight || 269, icon: TrendingUp, color: 'bg-[var(--green)]' },
      { label: 'Books Estimate', value: notebooks || 1345, icon: BookOpenCheck, color: 'bg-white' },
    ];
  }, [batches]);

  return (
    <RoleGate allowed="teacher">
    <div className="space-y-10">
      <header className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <p className="font-black uppercase text-[var(--coral)]">Teacher and Institution Layer</p>
          <h1 className="mt-2 text-4xl font-black uppercase md:text-6xl">Teacher Dashboard</h1>
          <p className="mt-2 max-w-2xl text-lg font-bold">
            Create rooms, share 6-digit codes with teachers, register paper batches, and upload handoff proof for tracking.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/room/create" className="neo-button bg-[var(--cyan)]">
            <Plus size={18} />
            Create Room
          </Link>
          <Link href="/batch/create" className="neo-button bg-[var(--yellow)]">
            <Plus size={18} />
            New Batch
          </Link>
        </div>
      </header>

      <section className="grid gap-5 md:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black uppercase">Recent Batches</h2>
          <Link href="/tracking/101" className="text-sm font-black uppercase underline">
            Open tracker
          </Link>
        </div>
        <div className="space-y-4">
          {batches.slice(0, 6).map((batch, index) => (
            <motion.div
              key={batch.batchId}
              initial={{ y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: index * 0.04 }}
              className="neo-card flex flex-col justify-between gap-4 bg-white p-5 md:flex-row md:items-center"
            >
              <div>
                <p className="text-2xl font-black">#{batch.batchId} {batch.title}</p>
                <p className="mt-1 font-bold opacity-70">{batch.weight} kg paper · {batch.pagesEstimate || 0} pages estimated</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <StatusBadge status={batch.status} />
                <Link href={`/tracking/${batch.batchId}`} className="neo-button bg-black text-xs text-white">
                  Track
                </Link>
              </div>
              <div className="md:col-span-2 md:w-full">
                <ProgressUpdateForm
                  batch={batch}
                  role="teacher"
                  action="proof"
                  label="Upload teacher handoff proof"
                  message="Teacher uploaded paper handoff proof for this batch"
                  onUpdated={loadBatches}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
    </RoleGate>
  );
}
