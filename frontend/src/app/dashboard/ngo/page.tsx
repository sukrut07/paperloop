'use client';

import { useEffect, useState } from 'react';
import { BookOpenCheck, CheckCircle2, Gift, Users } from 'lucide-react';
import { StatCard } from '@/components/StatCard';
import { StatusBadge } from '@/components/StatusBadge';
import { TxStatus } from '@/components/TxStatus';
import { api } from '@/lib/api';
import type { Batch } from '@/lib/types';
import { useWallet } from '@/hooks/useWallet';

export default function NGODashboard() {
  const [stock, setStock] = useState<Batch[]>([]);
  const [txHash, setTxHash] = useState<string | undefined>();
  const [pending, setPending] = useState<string | null>(null);
  const { address, signerContract, connectWallet } = useWallet();

  useEffect(() => {
    api.listBatches().then((batches) => setStock(batches.filter((batch) => batch.status === 'Recycled' || batch.status === 'SentToNGO')));
  }, []);

  async function acceptDonation(batch: Batch, finalDelivery = false) {
    setPending(`${batch.batchId}-${finalDelivery}`);
    setTxHash(undefined);
    try {
      const contract = await signerContract();
      let receiptHash = `local-${Date.now()}`;

      if (contract) {
        const tx = finalDelivery ? await contract.confirmDistribution(batch.batchId) : await contract.acceptDonation(batch.batchId);
        const receipt = await tx.wait();
        receiptHash = receipt.hash;
      }

      setTxHash(receiptHash);
      await api.transitionBatch('distribute', {
        batchId: batch.batchId,
        actorWallet: address,
        txHash: receiptHash,
        finalDelivery,
      });
      const next = await api.listBatches();
      setStock(next.filter((item) => item.status === 'Recycled' || item.status === 'SentToNGO'));
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="space-y-10">
      <header className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <p className="font-black uppercase text-[var(--coral)]">NGO Layer</p>
          <h1 className="mt-2 text-4xl font-black uppercase md:text-6xl">NGO Dashboard</h1>
          <p className="mt-2 max-w-2xl text-lg font-bold">Accept recycled notebook stock and confirm student distribution with verifiable delivery proof.</p>
        </div>
        <button className="neo-button bg-[var(--green)]" onClick={connectWallet}>
          <Gift size={18} />
          {address ? 'Wallet Ready' : 'Connect Wallet'}
        </button>
      </header>

      <TxStatus hash={txHash} loading={Boolean(pending)} label="Writing NGO update to Polygon" />

      <section className="grid gap-5 md:grid-cols-3">
        <StatCard label="Notebook Stock" value="8,750" icon={BookOpenCheck} color="bg-[var(--cyan)]" />
        <StatCard label="Students Impacted" value="2,916" icon={Users} color="bg-[var(--green)]" />
        <StatCard label="Pending Donations" value={stock.length} icon={Gift} color="bg-[var(--yellow)]" />
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-black uppercase">Available Recycled Batches</h2>
        {stock.map((batch) => (
          <div key={batch.batchId} className="neo-card flex flex-col justify-between gap-4 bg-white p-5 md:flex-row md:items-center">
            <div>
              <p className="text-2xl font-black">#{batch.batchId} {batch.title}</p>
              <p className="font-bold opacity-70">{batch.notebooksEstimate || batch.weight * 5} notebooks estimated from {batch.weight} kg paper</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge status={batch.status} />
              {batch.status === 'Recycled' ? (
                <button className="neo-button bg-[var(--cyan)] text-xs" onClick={() => acceptDonation(batch)}>
                  Accept Stock
                </button>
              ) : (
                <button className="neo-button bg-[var(--green)] text-xs" onClick={() => acceptDonation(batch, true)}>
                  <CheckCircle2 size={16} />
                  Confirm Distribution
                </button>
              )}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
