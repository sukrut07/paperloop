'use client';

import { FormEvent, useState } from 'react';
import { Camera, CheckCircle2, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { formatTrackingStatus } from '@/lib/shipmentFlow';
import type { Role, TrackingStatus } from '@/lib/types';

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function RoomStatusUpdateForm({
  roomCode,
  role,
  actor,
  status,
  label,
  message,
  documentTitle,
  onUpdated,
  requireProof = false,
}: {
  roomCode: string;
  role: Role;
  actor: string;
  status: TrackingStatus;
  label: string;
  message: string;
  documentTitle?: string;
  onUpdated?: () => void;
  requireProof?: boolean;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string>();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setDone(false);
    setError(undefined);

    if (requireProof && !file) {
      setError('Upload a proof image before sending this update.');
      return;
    }

    setLoading(true);
    try {
      const proof = file
        ? await api.uploadProof({
            roomCode,
            role,
            status,
            message,
            proofImages: [await fileToDataUrl(file)],
            proofType: `${role}-proof`,
            uploadedBy: actor,
            proofFileName: file.name,
            capturedAt: new Date().toISOString(),
          })
        : null;

      await api.updateRoomShipment(roomCode, {
        status,
        actor,
        role,
        message,
        proofUrl: proof?.proofUrl,
        proofFileName: proof?.proofFileName,
        documentTitle: documentTitle || `${formatTrackingStatus(status)} proof`,
      });

      setDone(true);
      setFile(null);
      onUpdated?.();
    } catch (err) {
      setError(getErrorMessage(err, 'Could not update shipment room'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-lg border-[3px] border-black bg-[var(--paper)] p-4">
      {requireProof ? (
        <input
          className="neo-input"
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(event) => setFile(event.target.files?.[0] || null)}
          aria-label={`${label} proof`}
        />
      ) : null}
      {error ? <p className="font-black text-[var(--coral)]">{error}</p> : null}
      {done ? <p className="flex items-center gap-2 font-black text-green-700"><CheckCircle2 size={18} /> Shipment room updated</p> : null}
      <button className="neo-button w-full bg-[var(--yellow)] text-xs" disabled={loading}>
        {loading ? <Loader2 className="animate-spin" size={16} /> : <Camera size={16} />}
        {label}
      </button>
    </form>
  );
}
