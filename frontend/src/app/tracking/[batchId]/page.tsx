'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useRequireAuth } from '@/lib/auth';

export default function LegacyTrackingPage() {
  const router = useRouter();
  const { batchId } = useParams<{ batchId: string }>();
  const [targetRoom, setTargetRoom] = useState<string | null>(null);
  useRequireAuth();

  useEffect(() => {
    api.getBatch(batchId).then((result) => {
      const roomCode = result.batch.roomCode;
      setTargetRoom(roomCode || null);
      router.replace(roomCode ? `/dashboard/room/${roomCode}` : '/dashboard');
    });
  }, [batchId, router]);

  return (
    <div className="neo-card mx-auto max-w-2xl space-y-4 bg-white p-6">
      <h1 className="text-3xl font-black uppercase">Tracking Moved Into Rooms</h1>
      <p className="font-bold">Shipment tracking is now room-specific, alongside chat, timeline, members, and documents.</p>
      <Link className="neo-button bg-[var(--cyan)]" href={targetRoom ? `/dashboard/room/${targetRoom}` : '/dashboard'}>
        Open Shipment Room
      </Link>
    </div>
  );
}
