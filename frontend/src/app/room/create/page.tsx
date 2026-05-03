'use client';

import { FormEvent, useState } from 'react';
import { CheckCircle2, Copy, DoorOpen, Share2, Users } from 'lucide-react';
import { api } from '@/lib/api';

const demoInstitutionId = process.env.NEXT_PUBLIC_DEMO_INSTITUTION_ID || '000000000000000000000001';

export default function CreateRoomPage() {
  const [name, setName] = useState('Grade 10 Paper Drive');
  const [createdByUid, setCreatedByUid] = useState('demo-teacher');
  const [code, setCode] = useState<string>();
  const [error, setError] = useState<string>();
  const [roomName, setRoomName] = useState<string>();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(undefined);
    try {
      const room = await api.createRoom({ name, institutionId: demoInstitutionId, createdByUid });
      setCode(room.code);
      setRoomName(room.name);
    } catch (err: any) {
      setError(err.message || 'Could not create room code');
    }
  }

  const joinUrl = code && typeof window !== 'undefined' ? `${window.location.origin}/room/join?code=${code}` : '';

  return (
    <div className="mx-auto max-w-2xl space-y-7">
      <header>
        <p className="font-black uppercase text-[var(--coral)]">Room System</p>
        <h1 className="mt-2 text-4xl font-black uppercase md:text-6xl">Create Teacher Room</h1>
        <p className="mt-2 text-lg font-bold">Generate a shareable 6-digit code. Teachers enter this code to join the same paper drive and track batches.</p>
      </header>

      <form onSubmit={submit} className="neo-card space-y-5 bg-white p-6">
        <label className="block space-y-2">
          <span className="flex items-center gap-2 text-sm font-black uppercase"><DoorOpen size={18} /> Room Name</span>
          <input className="neo-input" value={name} onChange={(event) => setName(event.target.value)} required />
        </label>
        <label className="block space-y-2">
          <span className="flex items-center gap-2 text-sm font-black uppercase"><Users size={18} /> Teacher UID</span>
          <input className="neo-input" value={createdByUid} onChange={(event) => setCreatedByUid(event.target.value)} required />
        </label>
        <button className="neo-button w-full bg-[var(--cyan)]">Generate 6 Digit Code</button>
      </form>

      {error ? <div className="neo-card bg-[var(--coral)] p-4 font-black">{error}</div> : null}
      {code ? (
        <div className="neo-card bg-[var(--green)] p-6 text-center">
          <CheckCircle2 className="mx-auto" size={40} strokeWidth={3} />
          <p className="mt-3 text-sm font-black uppercase">{roomName || 'Paper drive'} is ready</p>
          <p className="mt-2 text-6xl font-black">{code}</p>
          <p className="mx-auto mt-3 max-w-md font-bold">Share this code with another teacher. They can open Join Room, enter the code, and see the same tracking workflow.</p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <button className="neo-button bg-white" onClick={() => navigator.clipboard.writeText(code)}>
              <Copy size={18} />
              Copy Code
            </button>
            <button className="neo-button bg-[var(--yellow)]" onClick={() => navigator.clipboard.writeText(joinUrl)}>
              <Share2 size={18} />
              Copy Join Link
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
