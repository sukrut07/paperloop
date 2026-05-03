'use client';

import { FormEvent, useState } from 'react';
import { DoorOpen, LogIn } from 'lucide-react';
import { api } from '@/lib/api';
import type { Room } from '@/lib/types';

export default function JoinRoomPage() {
  const [code, setCode] = useState('');
  const [userUid, setUserUid] = useState('demo-teacher');
  const [room, setRoom] = useState<Room>();
  const [error, setError] = useState<string>();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(undefined);
    try {
      setRoom(await api.joinRoom({ code, userUid }));
    } catch (err: any) {
      setError(err.message || 'Could not join room');
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-7">
      <header>
        <p className="font-black uppercase text-[var(--coral)]">Room System</p>
        <h1 className="mt-2 text-4xl font-black uppercase md:text-6xl">Join Room</h1>
      </header>

      <form onSubmit={submit} className="neo-card space-y-5 bg-white p-6">
        <label className="block space-y-2">
          <span className="flex items-center gap-2 text-sm font-black uppercase"><DoorOpen size={18} /> 6 Digit Code</span>
          <input className="neo-input text-2xl" value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))} required />
        </label>
        <label className="block space-y-2">
          <span className="text-sm font-black uppercase">Teacher UID</span>
          <input className="neo-input" value={userUid} onChange={(event) => setUserUid(event.target.value)} required />
        </label>
        <button className="neo-button w-full bg-[var(--green)]">
          <LogIn size={18} />
          Join Room
        </button>
      </form>

      {error ? <div className="neo-card bg-[var(--coral)] p-4 font-black">{error}</div> : null}
      {room ? <div className="neo-card bg-[var(--cyan)] p-5 text-xl font-black">Joined {room.name} with {room.members.length} member(s)</div> : null}
    </div>
  );
}
