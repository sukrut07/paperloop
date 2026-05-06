'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Box, ExternalLink, Search, ShieldCheck } from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge';
import { api } from '@/lib/api';
import type { Batch } from '@/lib/types';

export default function Explorer() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [query, setQuery] = useState('');

  useEffect(() => {
    api.listBatches().then(setBatches);
  }, []);

  const filtered = useMemo(() => {
    return batches.filter((batch) =>
      `${batch.batchId} ${batch.title} ${batch.proofFileName || ''} ${batch.proofUrl || ''}`.toLowerCase().includes(query.toLowerCase())
    );
  }, [batches, query]);

  return (
    <div className="space-y-8">
      <header className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <p className="font-black uppercase text-[var(--coral)]">Workflow Explorer</p>
          <h1 className="mt-2 text-4xl font-black uppercase md:text-6xl">Paperloop Ledger</h1>
          <p className="mt-2 max-w-2xl text-lg font-bold">Search batch IDs, proof files, and system verification records.</p>
        </div>
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2" size={18} />
          <input className="neo-input pl-11" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search ledger" />
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="neo-card flex items-center gap-4 bg-[var(--yellow)] p-4">
          <Box size={34} />
          <div><p className="text-sm font-black uppercase">Batches</p><p className="text-3xl font-black">{batches.length}</p></div>
        </div>
        <div className="neo-card flex items-center gap-4 bg-[var(--cyan)] p-4">
          <ShieldCheck size={34} />
          <div><p className="text-sm font-black uppercase">Verification</p><p className="text-3xl font-black">System</p></div>
        </div>
        <div className="neo-card flex items-center gap-4 bg-[var(--green)] p-4">
          <ExternalLink size={34} />
          <div><p className="text-sm font-black uppercase">Proofs</p><p className="text-3xl font-black">Native</p></div>
        </div>
      </section>

      <div className="neo-card overflow-x-auto bg-white">
        <table className="w-full min-w-[760px] text-left">
          <thead className="border-b-[3px] border-black bg-[var(--paper)] text-sm font-black uppercase">
            <tr>
              <th className="p-4">Batch</th>
              <th className="p-4">Status</th>
              <th className="p-4">Proof</th>
              <th className="p-4">Verification</th>
              <th className="p-4 text-right">Track</th>
            </tr>
          </thead>
          <tbody className="font-bold">
            {filtered.map((batch) => {
              return (
                <tr key={batch.batchId} className="border-b-2 border-black">
                  <td className="p-4"><strong>#{batch.batchId}</strong><br /><span className="text-sm opacity-70">{batch.title}</span></td>
                  <td className="p-4"><StatusBadge status={batch.status} /></td>
                  <td className="max-w-[220px] truncate p-4 text-xs">{batch.proofFileName || 'Pending'}</td>
                  <td className="max-w-[180px] truncate p-4 text-xs">{batch.verificationTimestamp ? 'Verified' : 'Pending'}</td>
                  <td className="p-4 text-right"><Link href={`/tracking/${batch.batchId}`} className="neo-button bg-black text-xs text-white">Open</Link></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
