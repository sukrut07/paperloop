'use client';

import { FormEvent, useState } from 'react';
import { Camera, CheckCircle2, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import type { Batch } from '@/lib/types';

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function ProgressUpdateForm({
  batch,
  role,
  action,
  label,
  message,
  onUpdated,
  finalDelivery = false,
}: {
  batch: Batch;
  role: 'teacher' | 'recycler' | 'ngo_admin';
  action: 'proof' | 'accept' | 'pickup' | 'transit' | 'receive' | 'recycle' | 'distribute';
  label: string;
  message: string;
  onUpdated?: () => void;
  finalDelivery?: boolean;
}) {
  const [batchNo, setBatchNo] = useState(String(batch.batchId));
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string>();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(undefined);
    setDone(false);

    if (Number(batchNo) !== batch.batchId) {
      setError('Batch number does not match this card.');
      return;
    }
    if (!file) {
      setError('Upload a photo proof before updating progress.');
      return;
    }

    setLoading(true);
    try {
      const proofImage = await fileToDataUrl(file);
      const proof = await api.prepareBatchIPFS({
        batchId: batch.batchId,
        role,
        action,
        message,
        proofImages: [proofImage],
        capturedAt: new Date().toISOString(),
      });

      if (action === 'proof') {
        await api.addProof({
          batchId: batch.batchId,
          actorRole: role,
          proofHash: proof.ipfsHash,
          message,
        });
      } else {
        await api.transitionBatch(action, {
          batchId: batch.batchId,
          actorRole: role,
          proofHash: proof.ipfsHash,
          message,
          finalDelivery,
        });
      }

      setDone(true);
      setFile(null);
      onUpdated?.();
    } catch (err: any) {
      setError(err.message || 'Could not update progress');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-4 space-y-3 rounded-lg border-[3px] border-black bg-[var(--paper)] p-4">
      <div className="grid gap-3 md:grid-cols-[150px_1fr]">
        <input
          className="neo-input"
          value={batchNo}
          onChange={(event) => setBatchNo(event.target.value.replace(/\D/g, ''))}
          placeholder="Batch no."
          aria-label="Batch number"
        />
        <input
          className="neo-input"
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(event) => setFile(event.target.files?.[0] || null)}
          aria-label="Photo proof"
        />
      </div>
      {error ? <p className="font-black text-[var(--coral)]">{error}</p> : null}
      {done ? <p className="flex items-center gap-2 font-black text-green-700"><CheckCircle2 size={18} /> Proof saved and tracker updated</p> : null}
      <button className="neo-button w-full bg-[var(--yellow)] text-xs" disabled={loading}>
        {loading ? <Loader2 className="animate-spin" size={16} /> : <Camera size={16} />}
        {label}
      </button>
    </form>
  );
}
