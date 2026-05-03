'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, Factory, Package, Recycle, Truck } from 'lucide-react';
import { MapPanel } from '@/components/MapPanel';
import { StatusBadge } from '@/components/StatusBadge';
import { TxStatus } from '@/components/TxStatus';
import { RoleGate } from '@/components/RoleGate';
import { ProgressUpdateForm } from '@/components/ProgressUpdateForm';
import { useWallet } from '@/hooks/useWallet';
import { api } from '@/lib/api';
import type { Batch } from '@/lib/types';

export default function RecyclerDashboard() {
  const [available, setAvailable] = useState<Batch[]>([]);
  const [active, setActive] = useState<Batch[]>([]);
  const [pending, setPending] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | undefined>();
  const { address, signerContract, connectWallet } = useWallet();

  const loadBatches = () => {
    api.availableBatches().then(setAvailable);
    api.listBatches().then((batches) => setActive(batches.filter((batch) => ['Accepted', 'PickedUp', 'InTransit', 'Received'].includes(batch.status))));
  };

  useEffect(() => {
    loadBatches();
  }, []);

  async function transition(batch: Batch, action: 'accept' | 'pickup' | 'receive' | 'recycle') {
    setPending(`${action}-${batch.batchId}`);
    setTxHash(undefined);
    try {
      const contract = await signerContract();
      let receiptHash = `local-${Date.now()}`;

      if (contract) {
        const map = {
          accept: () => contract.acceptBatch(batch.batchId),
          pickup: () => contract.pickupBatch(batch.batchId),
          receive: () => contract.confirmReceived(batch.batchId),
          recycle: () => contract.markRecycled(batch.batchId),
        };
        const tx = await map[action]();
        const receipt = await tx.wait();
        receiptHash = receipt.hash;
      }

      setTxHash(receiptHash);
      await api.transitionBatch(action, {
        batchId: batch.batchId,
        actorWallet: address,
        txHash: receiptHash,
      });
      const next = await api.listBatches();
      setAvailable(next.filter((item) => item.status === 'Created'));
      setActive(next.filter((item) => ['Accepted', 'PickedUp', 'InTransit', 'Received'].includes(item.status)));
    } finally {
      setPending(null);
    }
  }

  return (
    <RoleGate allowed="recycler">
    <div className="space-y-10">
      <header className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <p className="font-black uppercase text-[var(--coral)]">Recycling Layer</p>
          <h1 className="mt-2 text-4xl font-black uppercase md:text-6xl">Recycler Dashboard</h1>
          <p className="mt-2 max-w-2xl text-lg font-bold">Accept nearby school pickups and write each processing milestone to Polygon.</p>
        </div>
        <button className="neo-button bg-[var(--cyan)]" onClick={connectWallet}>
          <Truck size={18} />
          {address ? 'Wallet Ready' : 'Connect Wallet'}
        </button>
      </header>

      <TxStatus hash={txHash} loading={Boolean(pending)} label="Waiting for blockchain confirmation" />

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <MapPanel address="Pune paper recycling center" />
        <section className="space-y-4">
          <h2 className="text-2xl font-black uppercase">Available Pickups</h2>
          {available.map((batch) => (
            <div key={batch.batchId} className="neo-card bg-white p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-2xl font-black">#{batch.batchId}</p>
                  <p className="font-bold">{batch.title}</p>
                  <p className="mt-1 text-sm font-bold opacity-70">{batch.pickupLocation?.address || 'Institution pickup point'}</p>
                </div>
                <span className="rounded-md border-2 border-black bg-[var(--yellow)] px-2 py-1 text-sm font-black">{batch.weight} kg</span>
              </div>
              <ProgressUpdateForm
                batch={batch}
                role="recycler"
                action="accept"
                label="Accept pickup with proof"
                message="Recycler accepted pickup and uploaded pickup-slot proof"
                onUpdated={loadBatches}
              />
            </div>
          ))}
        </section>
      </div>

      <section className="space-y-4">
        <h2 className="text-2xl font-black uppercase">Active Recycling Tasks</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {active.map((batch) => (
            <div key={batch.batchId} className="neo-card bg-white p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-2xl font-black">#{batch.batchId} {batch.title}</p>
                  <p className="font-bold opacity-70">{batch.weight} kg · {batch.notebooksEstimate || 0} notebooks</p>
                </div>
                <StatusBadge status={batch.status} />
              </div>
              <ProgressUpdateForm
                batch={batch}
                role="recycler"
                action={batch.status === 'Accepted' ? 'pickup' : batch.status === 'PickedUp' ? 'transit' : batch.status === 'InTransit' ? 'receive' : 'recycle'}
                label={
                  batch.status === 'Accepted'
                    ? 'Confirm picked up with photo'
                    : batch.status === 'PickedUp'
                      ? 'Mark in transit with proof'
                      : batch.status === 'InTransit'
                        ? 'Confirm plant received'
                        : 'Mark recycled with proof'
                }
                message={
                  batch.status === 'Accepted'
                    ? 'Recycler collected the paper batch from the institution'
                    : batch.status === 'PickedUp'
                      ? 'Recycler moved the batch to in-transit status'
                      : batch.status === 'InTransit'
                        ? 'Recycling plant received the batch'
                        : 'Recycling plant converted paper into notebook stock'
                }
                onUpdated={loadBatches}
              />
            </div>
          ))}
        </div>
      </section>
    </div>
    </RoleGate>
  );
}
