'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { CalendarClock, CheckCircle2, Copy, DoorOpen, MapPin, Package, Share2, Weight, X } from 'lucide-react';
import { api } from '@/lib/api';
import { useRequireAuth } from '@/lib/auth';

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export default function CreateRoomPage() {
  const [name, setName] = useState('Grade 10 Paper Drive');
  const [shipmentTitle, setShipmentTitle] = useState('Answer sheet shipment');
  const [paperType, setPaperType] = useState('Answer sheets');
  const [estimatedWeight, setEstimatedWeight] = useState(85);
  const [pickupLocation, setPickupLocation] = useState('Shivajinagar, Pune');
  const [pickupDeadline, setPickupDeadline] = useState(() => new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString().slice(0, 10));
  const [code, setCode] = useState<string>();
  const [roomId, setRoomId] = useState<string>();
  const [error, setError] = useState<string>();
  const [roomName, setRoomName] = useState<string>();
  const [inviteOpen, setInviteOpen] = useState(false);
  const { user } = useRequireAuth(['institution']);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(undefined);
    try {
      const room = await api.createRoom({
        name,
        roomName: name,
        shipmentName: shipmentTitle,
        shipmentTitle,
        paperType,
        estimatedWeight,
        pickupLocation,
        pickupDeadline,
      }, user);
      setCode(room.code);
      setRoomId(room.roomId || room._id);
      setRoomName(room.name);
      setInviteOpen(true);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Could not create room code'));
    }
  }

  const joinUrl = code && typeof window !== 'undefined' ? `${window.location.origin}/room/join?code=${code}` : '';

  return (
    <div className="mx-auto max-w-2xl space-y-7">
      <header>
        <p className="font-black uppercase text-[var(--coral)]">Room System</p>
        <h1 className="mt-2 text-4xl font-black uppercase md:text-6xl">Create Shipment Room</h1>
        <p className="mt-2 text-lg font-bold">Every shipment starts as a room with a room ID, 6-digit invite code, chat, batches, members, tracking, and documents.</p>
      </header>

      <form onSubmit={submit} className="neo-card space-y-5 bg-white p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block space-y-2">
            <span className="flex items-center gap-2 text-sm font-black uppercase"><DoorOpen size={18} /> Room Name</span>
            <input className="neo-input" value={name} onChange={(event) => setName(event.target.value)} required />
          </label>
          <label className="block space-y-2">
            <span className="flex items-center gap-2 text-sm font-black uppercase"><Package size={18} /> Shipment Name</span>
            <input className="neo-input" value={shipmentTitle} onChange={(event) => setShipmentTitle(event.target.value)} required />
          </label>
          <label className="block space-y-2">
            <span className="flex items-center gap-2 text-sm font-black uppercase">Paper Type</span>
            <select className="neo-input" value={paperType} onChange={(event) => setPaperType(event.target.value)} required>
              <option>Answer sheets</option>
              <option>Assignment paper</option>
              <option>Office paper</option>
              <option>Mixed paper</option>
              <option>Library discard paper</option>
            </select>
          </label>
          <label className="block space-y-2">
            <span className="flex items-center gap-2 text-sm font-black uppercase"><Weight size={18} /> Estimated Weight</span>
            <input className="neo-input" type="number" min={1} value={estimatedWeight} onChange={(event) => setEstimatedWeight(Number(event.target.value))} required />
          </label>
          <label className="block space-y-2">
            <span className="flex items-center gap-2 text-sm font-black uppercase"><MapPin size={18} /> Pickup Location</span>
            <input className="neo-input" value={pickupLocation} onChange={(event) => setPickupLocation(event.target.value)} required />
          </label>
          <label className="block space-y-2">
            <span className="flex items-center gap-2 text-sm font-black uppercase"><CalendarClock size={18} /> Pickup Deadline</span>
            <input className="neo-input" type="date" value={pickupDeadline} onChange={(event) => setPickupDeadline(event.target.value)} required />
          </label>
        </div>
        <button className="neo-button w-full bg-[var(--cyan)]">Create Shipment Workspace</button>
      </form>

      {error ? <div className="neo-card bg-[var(--coral)] p-4 font-black">{error}</div> : null}
      {inviteOpen && code ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <div className="neo-card w-full max-w-2xl bg-white p-6 text-center">
            <div className="mb-4 flex items-center justify-between">
              <div className="text-left">
                <p className="font-black uppercase text-[var(--coral)]">Shipment room created</p>
                <p className="text-sm font-black uppercase">{roomId}</p>
              </div>
              <button className="neo-button bg-white p-2" onClick={() => setInviteOpen(false)} aria-label="Close invite dialog">
                <X size={18} />
              </button>
            </div>
            <CheckCircle2 className="mx-auto" size={40} strokeWidth={3} />
            <p className="mt-3 text-sm font-black uppercase">{roomName || 'Paper drive'} is ready</p>
            <p className="mt-2 text-6xl font-black">{code}</p>
            <p className="mx-auto mt-3 max-w-md font-bold">This 6-digit invite code can be used to join the room and add other members into the shipment workflow.</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <button className="neo-button bg-white" onClick={() => navigator.clipboard.writeText(code)}>
                <Copy size={18} />
                Copy Code
              </button>
              <button className="neo-button bg-[var(--yellow)]" onClick={() => navigator.clipboard.writeText(joinUrl)}>
                <Share2 size={18} />
                Copy Join Link
              </button>
              <Link className="neo-button bg-[var(--cyan)] sm:col-span-2" href={`/dashboard/room/${code}`}>
                Open Room
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
