'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ExternalLink, FileCheck2, Hash, ShieldCheck, Weight } from 'lucide-react';
import ProgressTracker from '@/components/ProgressTracker';
import { StatusBadge } from '@/components/StatusBadge';
import { api } from '@/lib/api';
import type { Batch, TrackingLog } from '@/lib/types';

export default function TrackingPage() {
  const { batchId } = useParams<{ batchId: string }>();
  const [batch, setBatch] = useState<Batch | null>(null);
  const [logs, setLogs] = useState<TrackingLog[]>([]);

  useEffect(() => {
    api.tracking(batchId).then((data) => {
      setBatch(data.batch);
      setLogs(data.logs);
    });
  }, [batchId]);

  if (!batch) {
    return <div className="neo-card p-8 text-xl font-black uppercase">Loading batch tracker...</div>;
  }

  const txHash = Object.values(batch.txHashes || {}).find(Boolean);

  return (
    <div className="space-y-8">
      <header className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <p className="font-black uppercase text-[var(--coral)]">Tracking</p>
          <h1 className="mt-2 text-4xl font-black uppercase md:text-6xl">Batch #{batch.batchId}</h1>
          <p className="mt-2 text-lg font-bold">{batch.title}</p>
        </div>
        <StatusBadge status={batch.status} />
      </header>

      <section className="neo-card bg-white p-4">
        <ProgressTracker currentStatus={batch.status} />
      </section>

      <div className="grid gap-6 lg:grid-cols-[390px_1fr]">
        <aside className="space-y-4">
          <div className="neo-card bg-[var(--yellow)] p-5">
            <h2 className="flex items-center gap-2 text-xl font-black uppercase">
              <ShieldCheck size={22} />
              Verification
            </h2>
            <div className="mt-5 space-y-4 font-bold">
              <div className="flex items-start justify-between gap-4 border-b-2 border-black pb-3">
                <span className="flex items-center gap-2"><Weight size={17} /> Weight</span>
                <strong>{batch.weight} kg</strong>
              </div>
              <div className="flex items-start justify-between gap-4 border-b-2 border-black pb-3">
                <span className="flex items-center gap-2"><FileCheck2 size={17} /> IPFS</span>
                <a className="max-w-[160px] truncate underline" href={`https://gateway.pinata.cloud/ipfs/${batch.ipfsHash}`} target="_blank" rel="noreferrer">
                  {batch.ipfsHash}
                </a>
              </div>
              <div className="flex items-start justify-between gap-4">
                <span className="flex items-center gap-2"><Hash size={17} /> TX</span>
                {txHash ? (
                  <a className="max-w-[160px] truncate underline" href={`https://amoy.polygonscan.com/tx/${txHash}`} target="_blank" rel="noreferrer">
                    {txHash}
                  </a>
                ) : (
                  <span>Pending</span>
                )}
              </div>
            </div>
          </div>

          <div className="neo-card bg-white p-5">
            <h2 className="text-xl font-black uppercase">Impact Estimate</h2>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-lg border-2 border-black bg-[var(--cyan)] p-3">
                <p className="text-xs font-black uppercase">Pages</p>
                <p className="text-2xl font-black">{batch.pagesEstimate || batch.weight * 200}</p>
              </div>
              <div className="rounded-lg border-2 border-black bg-[var(--green)] p-3">
                <p className="text-xs font-black uppercase">Notebooks</p>
                <p className="text-2xl font-black">{batch.notebooksEstimate || batch.weight * 5}</p>
              </div>
            </div>
          </div>
        </aside>

        <section className="neo-card bg-white p-5">
          <h2 className="text-2xl font-black uppercase">Timeline</h2>
          <div className="mt-5 space-y-4">
            {logs.map((log) => (
              <div key={`${log.status}-${log.createdAt}`} className="flex gap-4 rounded-lg border-2 border-black bg-[var(--paper)] p-4">
                <div className="mt-1 h-4 w-4 rounded-full border-2 border-black bg-[var(--green)]" />
                <div className="flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="font-black uppercase">{log.status}</p>
                    <p className="text-xs font-black uppercase opacity-60">{new Date(log.createdAt).toLocaleString()}</p>
                  </div>
                  <p className="mt-1 font-bold">{log.message}</p>
                  {log.txHash ? (
                    <a className="mt-2 inline-flex items-center gap-1 text-xs font-black uppercase underline" href={`https://amoy.polygonscan.com/tx/${log.txHash}`} target="_blank" rel="noreferrer">
                      View transaction <ExternalLink size={12} />
                    </a>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
