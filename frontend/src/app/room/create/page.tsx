'use client';

import { FormEvent, useState } from 'react';
import { Copy, DoorOpen, Users } from 'lucide-react';
import { api } from '@/lib/api';

const demoInstitutionId = process.env.NEXT_PUBLIC_DEMO_INSTITUTION_ID || '000000000000000000000001';

export default function CreateRoomPage() {
  const [name, setName] = useState('Grade 10 Paper Drive');
  const [createdByUid, setCreatedByUid] = useState('demo-teacher');
  const [code, setCode] = useState<string>();
  const [error, setError] = useState<string>();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(undefined);
    try {
      const room = await api.createRoom({ name, institutionId: demoInstitutionId, createdByUid });
      setCode(room.code);
    } catch (err: any) {
      setError(err.message || 'Could not create room');
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-7">
      <header>
        <p className="font-black uppercase text-[var(--coral)]">Room System</p>
        <h1 className="mt-2 text-4xl font-black uppercase md:text-6xl">Create Room</h1>
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
          <p className="text-sm font-black uppercase">Room Code</p>
          <p className="mt-2 text-6xl font-black">{code}</p>
          <button className="neo-button mt-5 bg-white" onClick={() => navigator.clipboard.writeText(code)}>
            <Copy size={18} />
            Copy Code
          </button>
        </div>
      ) : null}
    </div>
  );
}
