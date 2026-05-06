'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { DoorOpen, LogIn } from 'lucide-react';
import { api } from '@/lib/api';
import type { Room } from '@/lib/types';
import { useRequireAuth } from '@/lib/auth';

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function JoinRoomForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [code, setCode] = useState(() => (searchParams.get('code') || '').replace(/\D/g, '').slice(0, 6));
  const [room, setRoom] = useState<Room>();
  const [error, setError] = useState<string>();
  const { user } = useRequireAuth(['institution', 'recycler', 'ngo', 'admin']);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(undefined);
    try {
      const joinedRoom = await api.joinRoom({ code }, user);
      setRoom(joinedRoom);
      router.push(`/room/${joinedRoom.code}`);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Could not join room'));
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-7">
      <header>
        <p className="font-black uppercase text-[var(--coral)]">Room System</p>
        <h1 className="mt-2 text-4xl font-black uppercase md:text-6xl">Join Room</h1>
        <p className="mt-2 text-lg font-bold">Enter the 6-digit room code to join that shipment workspace, chat with members, and follow its batch tracker.</p>
      </header>

      <form onSubmit={submit} className="neo-card space-y-5 bg-white p-6">
        <label className="block space-y-2">
          <span className="flex items-center gap-2 text-sm font-black uppercase"><DoorOpen size={18} /> 6 Digit Code</span>
          <input className="neo-input text-2xl" value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))} required />
        </label>
        <button className="neo-button w-full bg-[var(--green)]">
          <LogIn size={18} />
          Join Room
        </button>
      </form>

      {error ? <div className="neo-card bg-[var(--coral)] p-4 font-black">{error}</div> : null}
      {room ? (
        <div className="neo-card space-y-4 bg-[var(--cyan)] p-5">
          <p className="text-xl font-black">Joined {room.name} with {room.members.length} member(s)</p>
          <Link href={`/room/${room.code}`} className="neo-button bg-white">Open Shipment Room</Link>
        </div>
      ) : null}
    </div>
  );
}

export default function JoinRoomPage() {
  return (
    <Suspense fallback={null}>
      <JoinRoomForm />
    </Suspense>
  );
}
