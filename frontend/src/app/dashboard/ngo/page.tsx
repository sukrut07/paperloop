'use client';

import { type ReactNode, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { BookOpenCheck, PackageCheck, Truck, TrendingUp, Users } from 'lucide-react';
import { RoleGate } from '@/components/RoleGate';
import { RoomStatusUpdateForm } from '@/components/RoomStatusUpdateForm';
import { StatusBadge } from '@/components/StatusBadge';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type { Room, TrackingStatus } from '@/lib/types';

function nextNgoStatus(status: TrackingStatus) {
  if (status === 'SentToNGO') {
    return {
      status: 'ReceivedByNGO' as const,
      label: 'Accept delivery proof',
      message: 'NGO received notebook delivery from the recycler.',
    };
  }
  if (status === 'ReceivedByNGO') {
    return {
      status: 'DistributionStarted' as const,
      label: 'Distribution started proof',
      message: 'NGO started distributing notebooks to students.',
    };
  }
  return {
    status: 'Delivered' as const,
    label: 'Distribution proof',
    message: 'NGO completed notebook distribution and uploaded proof.',
  };
}

function NgoRoomCard({ room, children }: { room: Room; children?: ReactNode }) {
  const recyclerName = room.selectedRecycler?.name || 'Recycler pending';
  const hasArrivedFromRecycler = ['SentToNGO', 'ReceivedByNGO', 'DistributionStarted', 'Delivered'].includes(room.shipmentStatus || 'Created');

  return (
    <div className="neo-card bg-white p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-black uppercase text-[var(--coral)]">{room.roomId || room.code}</p>
          <p className="mt-1 text-2xl font-black">{room.name}</p>
          <p className="font-bold opacity-70">{room.shipmentTitle || room.shipmentName} · {room.estimatedWeight} kg</p>
          {hasArrivedFromRecycler ? (
            <div className="mt-3 inline-flex max-w-full items-center gap-2 rounded-md border-2 border-black bg-[var(--green)] px-3 py-2 text-sm font-black uppercase">
              <Truck size={16} />
              <span className="break-words">Books shipment arrived from {recyclerName}</span>
            </div>
          ) : null}
        </div>
        <StatusBadge status={room.shipmentStatus || 'Created'} />
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <span className="rounded-md border-2 border-black bg-[var(--paper)] px-3 py-2 text-sm font-black">{room.batches.length} batches</span>
        <span className="rounded-md border-2 border-black bg-[var(--paper)] px-3 py-2 text-sm font-black">From recycler: {recyclerName}</span>
        <Link href={`/dashboard/room/${room.code}`} className="rounded-md border-2 border-black bg-[var(--paper)] px-3 py-2 text-center text-sm font-black uppercase transition hover:bg-white">
          Open Room
        </Link>
      </div>
      {children ? <div className="mt-4">{children}</div> : null}
    </div>
  );
}

export default function NGODashboardPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const { user } = useAuth();

  function load() {
    api.listRooms().then(setRooms);
  }

  useEffect(() => {
    load();
  }, []);

  const incoming = useMemo(() => rooms.filter((room) => room.shipmentStatus === 'SentToNGO'), [rooms]);
  const accepted = useMemo(() => rooms.filter((room) => ['ReceivedByNGO', 'DistributionStarted'].includes(room.shipmentStatus || 'Created')), [rooms]);
  const distributed = useMemo(() => rooms.filter((room) => room.shipmentStatus === 'Delivered'), [rooms]);

  return (
    <RoleGate allowed="ngo">
      <div className="space-y-8">
        <header className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="font-black uppercase text-[var(--coral)]">NGO Dashboard</p>
            <h1 className="mt-2 text-4xl font-black uppercase md:text-6xl">Notebook Delivery Flow</h1>
            <p className="mt-2 max-w-3xl text-lg font-bold">Incoming notebook deliveries, accepted deliveries, distribution tracking, and impact reporting are now tracked room by room.</p>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-4">
          <div className="neo-card bg-[var(--cyan)] p-5"><p className="font-black uppercase">Incoming Deliveries</p><p className="mt-3 text-4xl font-black">{incoming.length}</p></div>
          <div className="neo-card bg-[var(--yellow)] p-5"><p className="font-black uppercase">Accepted Deliveries</p><p className="mt-3 text-4xl font-black">{accepted.length}</p></div>
          <div className="neo-card bg-[var(--green)] p-5"><p className="font-black uppercase">Distributed</p><p className="mt-3 text-4xl font-black">{distributed.length}</p></div>
          <div className="neo-card bg-white p-5"><p className="font-black uppercase">Impact Rooms</p><p className="mt-3 text-4xl font-black">{accepted.length + distributed.length}</p></div>
        </section>

        <section className="grid gap-5 md:grid-cols-2">
          <div className="neo-card bg-white p-5">
            <p className="flex items-center gap-2 text-2xl font-black uppercase"><TrendingUp size={22} /> Impact Reports</p>
            <p className="mt-2 font-bold">Each delivered room keeps recycler details, NGO details, total weight, distribution proof, and system verification together.</p>
          </div>
          <div className="neo-card bg-[var(--cyan)] p-5">
            <p className="text-2xl font-black uppercase">Distribution Tracking</p>
            <p className="mt-2 font-bold">NGO proof updates cover received, distribution started, and distributed without leaving the room page.</p>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2 text-2xl font-black uppercase"><PackageCheck size={22} /> Incoming Notebook Deliveries</div>
          <div className="dashboard-room-grid grid gap-4 md:grid-cols-2">
            {incoming.length ? incoming.map((room) => {
              const nextStep = nextNgoStatus(room.shipmentStatus || 'SentToNGO');
              return (
                <NgoRoomCard key={room.code} room={room}>
                  <RoomStatusUpdateForm
                    roomCode={room.code}
                    role="ngo"
                    actor={user?.name || 'NGO'}
                    status={nextStep.status}
                    label={nextStep.label}
                    message={nextStep.message}
                    onUpdated={load}
                  />
                </NgoRoomCard>
              );
            }) : <div className="neo-card bg-white p-6 font-black">No notebook deliveries are waiting for acceptance.</div>}
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2 text-2xl font-black uppercase"><BookOpenCheck size={22} /> Accepted Deliveries</div>
          <div className="dashboard-room-grid grid gap-4 md:grid-cols-2">
            {accepted.length ? accepted.map((room) => {
              const nextStep = nextNgoStatus(room.shipmentStatus || 'ReceivedByNGO');
              return (
                <NgoRoomCard key={room.code} room={room}>
                  <RoomStatusUpdateForm
                    roomCode={room.code}
                    role="ngo"
                    actor={user?.name || 'NGO'}
                    status={nextStep.status}
                    label={nextStep.label}
                    message={nextStep.message}
                    onUpdated={load}
                  />
                </NgoRoomCard>
              );
            }) : <div className="neo-card bg-white p-6 font-black">No accepted notebook deliveries are in progress.</div>}
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2 text-2xl font-black uppercase"><Users size={22} /> Distribution Tracking</div>
          <div className="dashboard-room-grid grid gap-4 md:grid-cols-2">
            {distributed.length ? distributed.map((room) => (
              <NgoRoomCard key={room.code} room={room}>
                <div className="rounded-lg border-2 border-black bg-[var(--paper)] p-3">
                  <p className="font-black">{room.selectedNgo?.name || user?.name || 'NGO Partner'}</p>
                  <p className="text-sm font-bold opacity-70">Distribution proof is stored in the room documents tab for this shipment.</p>
                </div>
              </NgoRoomCard>
            )) : <div className="neo-card bg-white p-6 font-black">No distribution proofs have been completed yet.</div>}
          </div>
        </section>
      </div>
    </RoleGate>
  );
}
