'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { BookOpenCheck, Clock3, History, Map, Plus, Trash2, Truck, Users, X } from 'lucide-react';
import { MapPanel } from '@/components/MapPanel';
import { StatCard } from '@/components/StatCard';
import { StatusBadge } from '@/components/StatusBadge';
import { RoleGate } from '@/components/RoleGate';
import { api } from '@/lib/api';
import { uniqueRoomMembers } from '@/lib/roomMembers';
import { isRoomDelivered } from '@/lib/shipmentFlow';
import type { Batch, RecyclerMatch, Room, ShipmentHistoryItem } from '@/lib/types';

function memberCount(room: Room) {
  return uniqueRoomMembers(room).length;
}

export default function InstitutionDashboard() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [history, setHistory] = useState<ShipmentHistoryItem[]>([]);
  const [recyclers, setRecyclers] = useState<RecyclerMatch[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [deletingRoom, setDeletingRoom] = useState<string | null>(null);

  const loadDashboard = useCallback(() => {
    api.listBatches().then(setBatches);
    api.ensurePrimaryRoom().then(() => api.listRooms().then(setRooms));
    api.shipmentHistory().then(setHistory);
    api.recyclerMatches().then(setRecyclers);
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  async function deleteRoom(room: Room) {
    const confirmed = window.confirm(`Delete room ${room.code} (${room.name})? This removes the room and its batches from the dashboard.`);
    if (!confirmed) return;
    setDeletingRoom(room.code);
    try {
      await api.deleteRoom(room.code);
      await Promise.all([
        api.listRooms().then(setRooms),
        api.listBatches().then(setBatches),
        api.shipmentHistory().then(setHistory),
      ]);
    } finally {
      setDeletingRoom(null);
    }
  }

  const stats = useMemo(() => {
    const totalWeight = rooms.reduce((sum, room) => sum + (room.estimatedWeight || 0), 0) || batches.reduce((sum, batch) => sum + batch.weight, 0);
    const activeRooms = rooms.filter((room) => !isRoomDelivered(room.shipmentStatus)).length || rooms.length;
    return [
      { label: 'Active Rooms', value: activeRooms, icon: Users, color: 'bg-[var(--cyan)]' },
      { label: 'Created Batches', value: batches.length, icon: BookOpenCheck, color: 'bg-[var(--yellow)]' },
      { label: 'KG Planned', value: totalWeight || 269, icon: Truck, color: 'bg-[var(--green)]' },
      { label: 'Completed', value: history.length, icon: History, color: 'bg-white' },
    ];
  }, [batches, history.length, rooms]);

  return (
    <RoleGate allowed="institution">
      <div className="space-y-9">
        <header className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="font-black uppercase text-[var(--coral)]">Institution Dashboard</p>
            <h1 className="mt-2 text-4xl font-black uppercase md:text-6xl">Shipment Rooms</h1>
            <p className="mt-2 max-w-2xl text-lg font-bold">Create a room first, then manage batches, members, chat, recycler matching, tracking, and documents inside that room.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/room/create" className="neo-button bg-[var(--cyan)]"><Plus size={18} /> Create Room</Link>
            <button className="neo-button bg-white" onClick={() => setHistoryOpen(true)}><History size={18} /> Shipment History</button>
            <button className="neo-button bg-[var(--yellow)]" onClick={() => setMapOpen(true)}><Map size={18} /> Recycler Finder</button>
          </div>
        </header>

        <section className="grid gap-5 md:grid-cols-4">
          {stats.map((stat) => <StatCard key={stat.label} {...stat} />)}
        </section>

        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-2xl font-black uppercase">Active Rooms</h2>
            <Link href="/room/join" className="text-sm font-black uppercase underline">Join by 6-digit code</Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {rooms.map((room) => (
              <div key={room.code} className="neo-card bg-white p-5 transition hover:-translate-y-1">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <Link href={`/dashboard/room/${room.code}`} className="min-w-0 flex-1">
                    <p className="text-sm font-black uppercase text-[var(--coral)]">Room {room.code}</p>
                    <p className="mt-2 text-2xl font-black">{room.name}</p>
                    <p className="mt-1 font-bold opacity-70">{room.shipmentTitle} · {room.paperType} · {room.estimatedWeight} kg</p>
                  </Link>
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <StatusBadge status={room.shipmentStatus || 'Created'} />
                    <button
                      className="neo-button bg-[var(--coral)] px-3 py-2 text-xs"
                      type="button"
                      onClick={() => deleteRoom(room)}
                      disabled={deletingRoom === room.code}
                      aria-label={`Delete room ${room.code}`}
                    >
                      <Trash2 size={15} />
                      {deletingRoom === room.code ? 'Deleting' : 'Delete'}
                    </button>
                  </div>
                </div>
                <Link href={`/dashboard/room/${room.code}`} className="mt-4 grid gap-2 sm:grid-cols-3">
                    <span className="rounded-md border-2 border-black bg-[var(--paper)] px-3 py-2 text-sm font-black">{memberCount(room)} members</span>
                    <span className="rounded-md border-2 border-black bg-[var(--paper)] px-3 py-2 text-sm font-black">{room.batches.length} batches</span>
                    <span className="rounded-md border-2 border-black bg-[var(--paper)] px-3 py-2 text-sm font-black"><Clock3 className="inline" size={14} /> {room.pickupDeadline}</span>
                  </Link>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-5 md:grid-cols-2">
          <Link href="/room/create" className="neo-card bg-[var(--cyan)] p-6">
            <p className="text-2xl font-black uppercase">Create Room</p>
            <p className="mt-2 font-bold">Required: room name, shipment name, paper type, estimated weight, pickup location, and pickup deadline.</p>
          </Link>
          <button className="neo-card bg-[var(--yellow)] p-6 text-left" onClick={() => setMapOpen(true)}>
            <p className="text-2xl font-black uppercase">Recycler Finder</p>
            <p className="mt-2 font-bold">Find recyclers within a 5km to 20km radius and invite one into a room.</p>
          </button>
        </section>

        {historyOpen ? (
          <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
            <div className="neo-card max-h-[86vh] w-full max-w-5xl overflow-auto bg-white p-5">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-3xl font-black uppercase">Shipment History</h2>
                <button className="neo-button bg-white p-2" onClick={() => setHistoryOpen(false)} aria-label="Close history"><X size={18} /></button>
              </div>
              <div className="space-y-4">
                {history.map((item) => (
                  <div key={item.id} className="rounded-lg border-[3px] border-black bg-[var(--paper)] p-4">
                    <p className="text-2xl font-black">{item.shipmentName}</p>
                    <p className="font-bold">{item.recyclerDetails}</p>
                    <p className="font-bold">{item.ngoDetails}</p>
                    <div className="mt-3 grid gap-2 md:grid-cols-3">
                      <span className="break-all rounded-md border-2 border-black bg-white p-2 font-bold">{item.totalWeight} kg</span>
                      <span className="break-all rounded-md border-2 border-black bg-white p-2 font-bold">{item.deliveryProof}</span>
                      <span className="break-all rounded-md border-2 border-black bg-white p-2 font-bold">{item.verificationSummary}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {mapOpen ? (
          <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
            <div className="neo-card max-h-[86vh] w-full max-w-5xl overflow-auto bg-white p-5">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-3xl font-black uppercase">Map Recycler Finder</h2>
                <button className="neo-button bg-white p-2" onClick={() => setMapOpen(false)} aria-label="Close map"><X size={18} /></button>
              </div>
              <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
                <MapPanel
                  address={rooms[0]?.pickupLocation?.address || 'Pune, Maharashtra'}
                  searchQuery={`paper recycling centers near ${rooms[0]?.pickupLocation?.address || 'Pune, Maharashtra'}`}
                  title="Recycler finder map"
                  heightClassName="h-[360px]"
                />
                <div className="space-y-3">
                  {recyclers.map((recycler) => (
                    <div key={recycler.id} className="rounded-lg border-[3px] border-black bg-[var(--paper)] p-4">
                      <p className="text-xl font-black">{recycler.name}</p>
                      <p className="font-bold">{recycler.rating} rating · {recycler.distanceKm} km</p>
                      <p className="font-bold opacity-70">{recycler.phone} · {recycler.capacityKgPerDay} kg/day</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </RoleGate>
  );
}
