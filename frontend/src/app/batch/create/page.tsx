'use client';

import Link from 'next/link';
import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function LegacyBatchCreateInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomCode = (searchParams.get('room') || '').replace(/\D/g, '').slice(0, 6);

  useEffect(() => {
    router.replace(roomCode ? `/dashboard/room/${roomCode}` : '/dashboard');
  }, [roomCode, router]);

  return (
    <div className="neo-card mx-auto max-w-2xl space-y-4 bg-white p-6">
      <h1 className="text-3xl font-black uppercase">Batch Creation Moved</h1>
      <p className="font-bold">Batches are now created only inside shipment rooms.</p>
      <Link className="neo-button bg-[var(--cyan)]" href={roomCode ? `/dashboard/room/${roomCode}` : '/dashboard'}>
        Open Room Workflow
      </Link>
    </div>
  );
}

export default function LegacyBatchCreatePage() {
  return (
    <Suspense fallback={null}>
      <LegacyBatchCreateInner />
    </Suspense>
  );
}
