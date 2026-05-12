'use client';

import { type FormEvent, type ReactNode, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { CheckSquare, DoorOpen, Factory, Loader2, Mail, Map, MapPin, PackageCheck, Phone, Plus, RefreshCw, Star, Truck, Users, X } from 'lucide-react';
import { MapPanel } from '@/components/MapPanel';
import ProgressTracker from '@/components/ProgressTracker';
import { RoleGate } from '@/components/RoleGate';
import { StatusBadge } from '@/components/StatusBadge';
import { api } from '@/lib/api';
import { uniqueRoomMembers } from '@/lib/roomMembers';
import { isRoomDelivered } from '@/lib/shipmentFlow';
import { useAuth } from '@/lib/auth';
import type { RecyclerMatch, Room, RoomMember, TrackingStatus, UserProfile } from '@/lib/types';

const recyclerWorkflow: Array<{ status: TrackingStatus; label: string; message: string }> = [
  { status: 'Accepted', label: 'Accept shipment', message: 'Recycler accepted the shipment request.' },
  { status: 'PickupStarted', label: 'Pickup started', message: 'Recycler started pickup from the institution.' },
  { status: 'PickedUp', label: 'Picked up', message: 'Recycler picked up the paper shipment.' },
  { status: 'InTransit', label: 'In transit', message: 'Recycler moved the shipment in transit to the plant.' },
  { status: 'ReceivedAtPlant', label: 'Received at plant', message: 'Recycler confirmed receipt at the recycling plant.' },
  { status: 'Processing', label: 'Processing', message: 'Recycler started paper processing at the plant.' },
  { status: 'Recycled', label: 'Recycled', message: 'Recycler completed the recycling step.' },
  { status: 'BooksProduced', label: 'Books produced', message: 'Recycler completed notebook production.' },
  { status: 'SentToNGO', label: 'Sent to NGO', message: 'Recycler shipped finished notebooks to the NGO.' },
];

function workflowIndex(status: TrackingStatus) {
  return recyclerWorkflow.findIndex((step) => step.status === status);
}

function getActiveRoomsByRecency(rooms: Room[]) {
  return rooms
    .filter((room) => !isRoomDelivered(room.shipmentStatus))
    .sort((a, b) => {
      const bTime = new Date(b.updatedAt || b.createdAt || 0).getTime();
      const aTime = new Date(a.updatedAt || a.createdAt || 0).getTime();
      return bTime - aTime;
    });
}

function isRoomParticipant(room: Room, user?: UserProfile | null) {
  if (!user) return false;
  return room.members.some((member) => {
    if (typeof member === 'string') return member === user.uid || member === user.email || member === user.name;
    return member.id === user.uid || member.email === user.email || member.name === user.name;
  });
}

function recyclerDisplayName(user?: UserProfile | null) {
  return user?.organizationName || user?.institutionName || user?.name || 'Recycler';
}

function roomMemberRole(member: string | RoomMember) {
  return typeof member === 'string' ? 'member' : member.role;
}

function RecyclerTrackingChecklist({
  room,
  actor,
  onUpdated,
}: {
  room: Room;
  actor: string;
  onUpdated: () => void;
}) {
  const [updatingStatus, setUpdatingStatus] = useState<TrackingStatus | null>(null);
  const [error, setError] = useState<string>();
  const currentIndex = workflowIndex(room.shipmentStatus || 'Created');
  const nextIndex = Math.max(0, currentIndex + 1);

  async function confirmStep(status: TrackingStatus, message: string) {
    setUpdatingStatus(status);
    setError(undefined);
    try {
      await api.updateRoomShipment(room.code, {
        status,
        actor,
        role: 'recycler',
        message,
      });
      onUpdated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update shipment status');
    } finally {
      setUpdatingStatus(null);
    }
  }

  return (
    <div className="space-y-4 rounded-lg border-[3px] border-black bg-[var(--paper)] p-4">
      <div>
        <p className="text-sm font-black uppercase text-[var(--coral)]">Live Tracking Chart</p>
        <ProgressTracker currentStatus={room.shipmentStatus || 'Created'} />
      </div>
      <div className="grid gap-2 md:grid-cols-3">
        {recyclerWorkflow.map((step, index) => {
          const done = index <= currentIndex;
          const next = index === nextIndex;
          const disabled = !next || Boolean(updatingStatus);

          return (
            <label
              key={step.status}
              className={`flex min-h-20 items-start gap-3 rounded-lg border-2 border-black p-3 font-black ${
                done ? 'bg-[var(--green)]' : next ? 'bg-white' : 'bg-[var(--paper)] opacity-60'
              }`}
            >
              <input
                className="mt-1"
                type="checkbox"
                checked={done}
                disabled={disabled}
                onChange={() => confirmStep(step.status, step.message)}
              />
              <span className="flex-1 text-sm uppercase">
                {step.label}
                {updatingStatus === step.status ? <Loader2 className="mt-2 animate-spin" size={16} /> : null}
              </span>
            </label>
          );
        })}
      </div>
      {error ? <p className="font-black text-[var(--coral)]">{error}</p> : null}
    </div>
  );
}

function RoomCard({ room, children, showOpenRoom = true }: { room: Room; children?: ReactNode; showOpenRoom?: boolean }) {
  return (
    <div className="neo-card bg-white p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-black uppercase text-[var(--coral)]">{room.roomId || room.code}</p>
          <p className="mt-1 text-2xl font-black">{room.name}</p>
          <p className="font-bold opacity-70">{room.shipmentTitle || room.shipmentName} · {room.paperType} · {room.estimatedWeight} kg</p>
          <p className="mt-2 text-sm font-bold opacity-70">{room.pickupLocation?.address} · pickup by {room.pickupDeadline}</p>
        </div>
        <StatusBadge status={room.shipmentStatus || 'Created'} />
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <span className="rounded-md border-2 border-black bg-[var(--paper)] px-3 py-2 text-sm font-black">{uniqueRoomMembers(room).length} members</span>
        <span className="rounded-md border-2 border-black bg-[var(--paper)] px-3 py-2 text-sm font-black">{room.batches.length} batches</span>
        {showOpenRoom ? (
          <Link href={`/dashboard/room/${room.code}`} className="rounded-md border-2 border-black bg-[var(--paper)] px-3 py-2 text-center text-sm font-black uppercase transition hover:bg-white">
            Open Room
          </Link>
        ) : (
          <span className="rounded-md border-2 border-black bg-[var(--paper)] px-3 py-2 text-center text-sm font-black uppercase">Accept to enter room</span>
        )}
      </div>
      {children ? <div className="mt-4">{children}</div> : null}
    </div>
  );
}

function InstitutionRecyclerFinder({
  matches,
  activeRoom,
  onOpenMap,
  onConnect,
  onRegister,
}: {
  matches: RecyclerMatch[];
  activeRoom?: Room;
  onOpenMap: () => void;
  onConnect: (recycler: RecyclerMatch) => void;
  onRegister: () => void;
}) {
  const defaultAddress = activeRoom?.pickupLocation?.address || 'Pune, Maharashtra';
  const nearest = matches[0];

  return (
    <div className="space-y-6">
      <header className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="font-black uppercase text-[var(--coral)]">5km to 20km Radius</p>
          <h1 className="mt-2 text-4xl font-black uppercase md:text-6xl">Recycler Finder</h1>
          <p className="mt-2 max-w-3xl text-lg font-bold">Use the institution pickup location to compare nearby recyclers and send room-specific connect requests.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button className="neo-button bg-white" onClick={onRegister}>
            <Plus size={18} />
            Register Recycler
          </button>
          <button className="neo-button bg-[var(--cyan)]" onClick={onOpenMap}>
            <Map size={18} />
            Open Map
          </button>
        </div>
      </header>

      {nearest ? (
        <section className="neo-card bg-[var(--green)] p-5">
          <p className="text-sm font-black uppercase">Nearest recycler for {defaultAddress}</p>
          <div className="mt-3 grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <p className="text-3xl font-black">{nearest.name}</p>
              <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 font-bold">
                <span className="flex items-center gap-2"><MapPin size={18} /> {nearest.address} · {nearest.distanceKm} km</span>
                <span className="flex items-center gap-2"><Phone size={18} /> {nearest.phone}</span>
                {nearest.email ? <span className="flex items-center gap-2"><Mail size={18} /> {nearest.email}</span> : null}
              </p>
              <p className="mt-1 font-bold opacity-70">{nearest.capacityKgPerDay} kg/day capacity{nearest.isCustom ? ' · custom institute recycler' : ''}</p>
            </div>
            <button className="neo-button bg-[var(--yellow)]" onClick={() => onConnect(nearest)}>Add To Room</button>
          </div>
        </section>
      ) : null}

      <section className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <MapPanel
          address={defaultAddress}
          searchQuery={`paper recycling centers near ${defaultAddress}`}
          title="Recycler matching map"
          heightClassName="h-[420px]"
        />
        <div className="space-y-4">
          {matches.map((recycler) => (
            <div key={recycler.id} className="neo-card bg-white p-5">
              <p className="text-2xl font-black">{recycler.name}</p>
              <p className="mt-2 flex items-center gap-2 font-bold"><Star size={18} /> {recycler.rating} rating · {recycler.distanceKm} km</p>
              <p className="flex items-center gap-2 font-bold"><MapPin size={18} /> {recycler.address}</p>
              <p className="flex items-center gap-2 font-bold"><Phone size={18} /> {recycler.phone}</p>
              {recycler.email ? <p className="flex items-center gap-2 font-bold"><Mail size={18} /> {recycler.email}</p> : null}
              <p className="font-bold opacity-70">{recycler.capacityKgPerDay} kg/day capacity</p>
              <button className="neo-button mt-4 w-full bg-[var(--yellow)] text-xs" onClick={() => onConnect(recycler)}>
                Connect Recycler
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default function RecyclerDashboardPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [matches, setMatches] = useState<RecyclerMatch[]>([]);
  const [mapOpen, setMapOpen] = useState(false);
  const [connectRecycler, setConnectRecycler] = useState<RecyclerMatch | null>(null);
  const [termsRoom, setTermsRoom] = useState<Room | null>(null);
  const [termsChecks, setTermsChecks] = useState([false, false, false, false]);
  const [joinCode, setJoinCode] = useState('');
  const [joinBusy, setJoinBusy] = useState(false);
  const [joinError, setJoinError] = useState<string>();
  const [registerOpen, setRegisterOpen] = useState(false);
  const [customRecycler, setCustomRecycler] = useState({
    enterpriseName: '',
    contactName: '',
    address: '',
    phone: '',
    email: '',
    capacityKgPerDay: 500,
    notes: '',
  });
  const { user } = useAuth();

  function load() {
    api.listRooms().then((nextRooms) => {
      setRooms(nextRooms);
      const nextActiveRooms = getActiveRoomsByRecency(nextRooms);
      api.recyclerMatches(nextActiveRooms[0]?.pickupLocation).then(setMatches);
    });
  }

  useEffect(() => {
    load();
    const interval = window.setInterval(load, 5000);
    return () => window.clearInterval(interval);
  }, []);

  const activeRooms = useMemo(() => getActiveRoomsByRecency(rooms), [rooms]);
  const activeRoom = activeRooms[0];
  const defaultAddress = activeRoom?.pickupLocation?.address || 'Pune, Maharashtra';
  const actorName = recyclerDisplayName(user);

  const joinedRooms = useMemo(
    () => getActiveRoomsByRecency(rooms.filter((room) => isRoomParticipant(room, user))),
    [rooms, user]
  );

  const incoming = useMemo(
    () =>
      joinedRooms.filter(
        (room) =>
          room.selectedRecycler &&
          room.recyclerResponse !== 'accepted' &&
          !isRoomDelivered(room.shipmentStatus) &&
          ['Created', 'Rejected'].includes(room.shipmentStatus || 'Created')
      ),
    [joinedRooms]
  );

  const joinedPendingRooms = useMemo(
    () =>
      joinedRooms.filter((room) => {
        const status = room.shipmentStatus || 'Created';
        return status === 'Created' && room.recyclerResponse !== 'accepted' && !incoming.some((incomingRoom) => incomingRoom.code === room.code);
      }),
    [incoming, joinedRooms]
  );

  const acceptedPickups = useMemo(
    () => joinedRooms.filter((room) => room.recyclerResponse === 'accepted' && ['Accepted', 'PickupStarted'].includes(room.shipmentStatus || 'Created')),
    [joinedRooms]
  );

  const activeRecycling = useMemo(
    () =>
      joinedRooms.filter(
        (room) =>
          room.recyclerResponse === 'accepted' &&
          ['PickedUp', 'InTransit', 'ReceivedAtPlant', 'Processing', 'Recycled', 'BooksProduced'].includes(room.shipmentStatus || 'Created')
      ),
    [joinedRooms]
  );

  const deliveries = useMemo(
    () =>
      joinedRooms.filter((room) =>
        ['SentToNGO', 'ReceivedByNGO', 'DistributionStarted', 'Delivered'].includes(room.shipmentStatus || 'Created')
      ),
    [joinedRooms]
  );

  async function acceptShipment(room: Room) {
    await api.updateRoomShipment(room.code, {
      status: 'Accepted',
      actor: actorName || room.selectedRecycler?.name || 'Recycler',
      role: 'recycler',
      message: 'Recycler accepted the shipment request after reviewing the pickup terms.',
    });
    setTermsRoom(null);
    setTermsChecks([false, false, false, false]);
    load();
  }

  async function joinByCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!joinCode.trim()) return;
    setJoinBusy(true);
    setJoinError(undefined);
    try {
      const joined = await api.joinRoom({ code: joinCode }, user);
      setJoinCode('');
      window.location.href = `/dashboard/room/${joined.code}`;
    } catch (err) {
      setJoinError(err instanceof Error ? err.message : 'Could not join room');
    } finally {
      setJoinBusy(false);
    }
  }

  async function registerRecycler(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const recycler = await api.registerRecycler(customRecycler);
    setMatches(await api.recyclerMatches(activeRoom?.pickupLocation));
    setCustomRecycler({ enterpriseName: '', contactName: '', address: '', phone: '', email: '', capacityKgPerDay: 500, notes: '' });
    setRegisterOpen(false);
    setConnectRecycler(recycler);
  }

  if (user?.role === 'institution') {
    return (
      <>
        <InstitutionRecyclerFinder
          matches={matches}
          activeRoom={activeRoom}
          onOpenMap={() => setMapOpen(true)}
          onConnect={(recycler) => setConnectRecycler(recycler)}
          onRegister={() => setRegisterOpen(true)}
        />

        {connectRecycler ? (
          <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
            <div className="neo-card w-full max-w-3xl bg-white p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="font-black uppercase text-[var(--coral)]">Connect recycler</p>
                  <h2 className="text-3xl font-black uppercase">{connectRecycler.name}</h2>
                </div>
                <button className="neo-button bg-white p-2" onClick={() => setConnectRecycler(null)} aria-label="Close connect modal">
                  <X size={18} />
                </button>
              </div>
              <p className="mb-4 font-bold">Choose which shipment room should send a connection request to this recycler.</p>
              <div className="grid gap-3">
                {activeRooms.length ? activeRooms.map((room) => (
                  <button
                    key={room.code}
                    className="rounded-lg border-[3px] border-black bg-[var(--paper)] p-4 text-left shadow-[4px_4px_0_#111] transition hover:-translate-y-1"
                    onClick={async () => {
                      await api.selectRecycler(room.code, connectRecycler);
                      setConnectRecycler(null);
                      load();
                    }}
                  >
                    <p className="text-xl font-black">{room.name}</p>
                    <p className="font-bold opacity-70">{room.shipmentTitle || room.shipmentName} · {room.pickupLocation?.address}</p>
                  </button>
                )) : <div className="rounded-lg border-[3px] border-black bg-[var(--paper)] p-4 font-black">Create an active shipment room first.</div>}
              </div>
            </div>
          </div>
        ) : null}

        {mapOpen ? (
          <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
            <div className="neo-card max-h-[86vh] w-full max-w-5xl overflow-auto bg-white p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="font-black uppercase text-[var(--coral)]">5km to 20km Radius</p>
                  <h2 className="text-3xl font-black uppercase">Recycler Matching Map</h2>
                </div>
                <button className="neo-button bg-white p-2" onClick={() => setMapOpen(false)} aria-label="Close matching map">
                  <X size={18} />
                </button>
              </div>
              <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
                <MapPanel
                  address={defaultAddress}
                  searchQuery={`paper recycling centers near ${defaultAddress}`}
                  title="Nearby recyclers"
                  heightClassName="h-[360px]"
                />
                <div className="space-y-3">
                  {matches.map((recycler) => (
                    <div key={recycler.id} className="rounded-lg border-[3px] border-black bg-[var(--paper)] p-4">
                      <p className="text-xl font-black">{recycler.name}</p>
                      <p className="mt-2 flex items-center gap-2 font-bold"><Star size={16} /> {recycler.rating} rating · {recycler.distanceKm} km</p>
                      <p className="flex items-center gap-2 font-bold"><MapPin size={16} /> {recycler.address}</p>
                      <p className="flex items-center gap-2 font-bold"><Phone size={16} /> {recycler.phone}</p>
                      <button className="neo-button mt-3 w-full bg-[var(--yellow)] text-xs" onClick={() => setConnectRecycler(recycler)}>
                        Connect Recycler
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {registerOpen ? (
          <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
            <form onSubmit={registerRecycler} className="neo-card max-h-[86vh] w-full max-w-3xl space-y-4 overflow-auto bg-white p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-black uppercase text-[var(--coral)]">Custom recycler</p>
                  <h2 className="text-3xl font-black uppercase">Register Institute Recycler</h2>
                </div>
                <button className="neo-button bg-white p-2" type="button" onClick={() => setRegisterOpen(false)} aria-label="Close recycler registration">
                  <X size={18} />
                </button>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <input className="neo-input" placeholder="Enterprise name" value={customRecycler.enterpriseName} onChange={(event) => setCustomRecycler((current) => ({ ...current, enterpriseName: event.target.value }))} required />
                <input className="neo-input" placeholder="Recycler contact name" value={customRecycler.contactName} onChange={(event) => setCustomRecycler((current) => ({ ...current, contactName: event.target.value }))} required />
                <input className="neo-input" placeholder="Location / address" value={customRecycler.address} onChange={(event) => setCustomRecycler((current) => ({ ...current, address: event.target.value }))} required />
                <input className="neo-input" placeholder="Phone number" value={customRecycler.phone} onChange={(event) => setCustomRecycler((current) => ({ ...current, phone: event.target.value }))} required />
                <input className="neo-input" type="email" placeholder="Email ID" value={customRecycler.email} onChange={(event) => setCustomRecycler((current) => ({ ...current, email: event.target.value }))} required />
                <input className="neo-input" type="number" min={1} placeholder="Capacity kg/day" value={customRecycler.capacityKgPerDay} onChange={(event) => setCustomRecycler((current) => ({ ...current, capacityKgPerDay: Number(event.target.value) }))} />
                <textarea className="neo-input md:col-span-2" placeholder="Notes, fixed enterprise contract, pickup window, material types" value={customRecycler.notes} onChange={(event) => setCustomRecycler((current) => ({ ...current, notes: event.target.value }))} />
              </div>
              <button className="neo-button w-full bg-[var(--yellow)]">
                <Plus size={18} />
                Register And Add To Room
              </button>
            </form>
          </div>
        ) : null}
      </>
    );
  }

  return (
    <RoleGate allowed="recycler">
      <div className="space-y-8">
        <header className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="font-black uppercase text-[var(--coral)]">Recycler Dashboard</p>
            <h1 className="mt-2 text-4xl font-black uppercase md:text-6xl">Room-Based Pickup Flow</h1>
            <p className="mt-2 max-w-3xl text-lg font-bold">Shipment rooms are private. Join by code, accept direct institution requests, and update the shared room tracker from a checklist.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link className="neo-button bg-white" href="/room/join">
              <DoorOpen size={18} />
              Join Room
            </Link>
            <button className="neo-button bg-[var(--cyan)]" onClick={() => setMapOpen(true)}>
              <Map size={18} />
              Matching Map
            </button>
            <button className="neo-button bg-[var(--yellow)]" onClick={load}>
              <RefreshCw size={18} />
              Refresh
            </button>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <div className="neo-card bg-[var(--cyan)] p-5"><p className="font-black uppercase">Joined Rooms</p><p className="mt-3 text-4xl font-black">{joinedRooms.length}</p></div>
          <div className="neo-card bg-white p-5"><p className="font-black uppercase">Incoming Requests</p><p className="mt-3 text-4xl font-black">{incoming.length}</p></div>
          <div className="neo-card bg-[var(--yellow)] p-5"><p className="font-black uppercase">Accepted Pickups</p><p className="mt-3 text-4xl font-black">{acceptedPickups.length}</p></div>
          <div className="neo-card bg-[var(--green)] p-5"><p className="font-black uppercase">Active Recycling</p><p className="mt-3 text-4xl font-black">{activeRecycling.length}</p></div>
          <div className="neo-card bg-[var(--paper)] p-5"><p className="font-black uppercase">Deliveries</p><p className="mt-3 text-4xl font-black">{deliveries.length}</p></div>
        </section>

        <section className="grid gap-5 lg:grid-cols-[420px_1fr]">
          <form onSubmit={joinByCode} className="neo-card space-y-4 bg-white p-5">
            <div>
              <p className="font-black uppercase text-[var(--coral)]">Direct room join</p>
              <h2 className="mt-1 text-2xl font-black uppercase">Join by 6-digit code</h2>
            </div>
            <input
              className="neo-input text-2xl"
              value={joinCode}
              onChange={(event) => setJoinCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="535614"
              required
            />
            {joinError ? <p className="font-black text-[var(--coral)]">{joinError}</p> : null}
            <button className="neo-button w-full bg-[var(--green)]" disabled={joinBusy || joinCode.length !== 6}>
              {joinBusy ? <Loader2 className="animate-spin" size={18} /> : <DoorOpen size={18} />}
              Join Room
            </button>
          </form>
          <div className="neo-card bg-[var(--paper)] p-5">
            <p className="font-black uppercase text-[var(--coral)]">Live data</p>
            <h2 className="mt-1 text-2xl font-black uppercase">Auto-refreshing recycler queue</h2>
            <p className="mt-2 font-bold opacity-70">This dashboard refreshes every 5 seconds. Public recycling postings are disabled; room access requires a join code, invite link, or direct recycler request.</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <span className="rounded-lg border-2 border-black bg-white p-3 text-sm font-black">{joinedRooms.length} joined rooms</span>
              <span className="rounded-lg border-2 border-black bg-white p-3 text-sm font-black">0 public postings</span>
              <span className="rounded-lg border-2 border-black bg-white p-3 text-sm font-black">{incoming.length} direct requests</span>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2 text-2xl font-black uppercase"><DoorOpen size={22} /> Joined Rooms</div>
          <div className="dashboard-room-grid grid gap-4 md:grid-cols-2">
            {joinedPendingRooms.length ? joinedPendingRooms.map((room) => (
              <RoomCard key={room.code} room={room}>
                <div className="space-y-3 rounded-lg border-2 border-black bg-[var(--paper)] p-3">
                  <p className="font-black uppercase text-[var(--coral)]">Joined by code</p>
                  <p className="font-bold opacity-70">You are in this room as a {room.members.find((member) => typeof member !== 'string' && (member.email === user?.email || member.id === user?.uid)) ? roomMemberRole(room.members.find((member) => typeof member !== 'string' && (member.email === user?.email || member.id === user?.uid))!) : 'recycler'}. Accept the pickup when you are ready to start tracking.</p>
                  <button className="neo-button w-full bg-[var(--yellow)] text-xs" onClick={() => setTermsRoom(room)}>
                    Review Terms & Accept
                  </button>
                </div>
              </RoomCard>
            )) : <div className="neo-card bg-white p-6 font-black">No newly joined rooms are waiting for acceptance.</div>}
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2 text-2xl font-black uppercase"><Truck size={22} /> Incoming Requests</div>
          <div className="dashboard-room-grid grid gap-4 md:grid-cols-2">
            {incoming.length ? incoming.map((room) => (
              <RoomCard key={room.code} room={room} showOpenRoom={false}>
                {room.selectedRecycler ? (
                  <div className="mb-4 rounded-lg border-2 border-black bg-[var(--paper)] p-3">
                    <p className="font-black">{room.selectedRecycler.name}</p>
                    <p className="text-sm font-bold opacity-70">{room.selectedRecycler.distanceKm} km · {room.selectedRecycler.capacityKgPerDay} kg/day · {room.selectedRecycler.phone}</p>
                  </div>
                ) : null}
                <div className="grid gap-3 md:grid-cols-2">
                      <button className="neo-button w-full bg-[var(--yellow)] text-xs" onClick={() => setTermsRoom(room)}>
                    Review Terms & Accept
                  </button>
                  <button
                    className="neo-button w-full bg-white text-xs"
                    onClick={() =>
                      api.updateRoomShipment(room.code, {
                        status: 'Rejected',
                        actor: actorName,
                        role: 'recycler',
                        message: 'Recycler declined the pickup request.',
                      }).then(load)
                    }
                  >
                    Reject Shipment
                  </button>
                </div>
              </RoomCard>
            )) : <div className="neo-card bg-white p-6 font-black">No incoming shipment rooms right now.</div>}
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2 text-2xl font-black uppercase"><PackageCheck size={22} /> Accepted Pickups</div>
          <div className="dashboard-room-grid grid gap-4 md:grid-cols-2">
            {acceptedPickups.length ? acceptedPickups.map((room) => {
              return (
                <RoomCard key={room.code} room={room}>
                  <RecyclerTrackingChecklist
                    room={room}
                    actor={actorName}
                    onUpdated={load}
                  />
                </RoomCard>
              );
            }) : <div className="neo-card bg-white p-6 font-black">No accepted pickups yet.</div>}
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2 text-2xl font-black uppercase"><Factory size={22} /> Active Recycling</div>
          <div className="dashboard-room-grid grid gap-4 md:grid-cols-2">
            {activeRecycling.length ? activeRecycling.map((room) => {
              return (
                <RoomCard key={room.code} room={room}>
                  <RecyclerTrackingChecklist
                    room={room}
                    actor={actorName}
                    onUpdated={load}
                  />
                </RoomCard>
              );
            }) : <div className="neo-card bg-white p-6 font-black">No room is in active recycling right now.</div>}
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2 text-2xl font-black uppercase"><Users size={22} /> Deliveries</div>
          <div className="dashboard-room-grid grid gap-4 md:grid-cols-2">
            {deliveries.length ? deliveries.map((room) => (
              <RoomCard key={room.code} room={room}>
                <div className="rounded-lg border-2 border-black bg-[var(--paper)] p-3">
                  <p className="font-black">{room.selectedNgo?.name || 'NGO assignment pending'}</p>
                  <p className="text-sm font-bold opacity-70">{room.selectedNgo?.phone || 'Distribution partner will appear here once matched.'}</p>
                </div>
              </RoomCard>
            )) : <div className="neo-card bg-white p-6 font-black">No notebook deliveries are waiting right now.</div>}
          </div>
        </section>

        {termsRoom ? (
          <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
            <div className="neo-card w-full max-w-2xl bg-white p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="font-black uppercase text-[var(--coral)]">Terms and conditions</p>
                  <h2 className="text-3xl font-black uppercase">{termsRoom.name}</h2>
                </div>
                <button className="neo-button bg-white p-2" onClick={() => setTermsRoom(null)} aria-label="Close terms dialog">
                  <X size={18} />
                </button>
              </div>
              <div className="space-y-3 rounded-lg border-[3px] border-black bg-[var(--paper)] p-4">
                {[
                  'I confirm the pickup location and timeline are feasible.',
                  'I agree to update the shipment lifecycle inside Paperloop.',
                  'I understand room access begins only after this shipment is accepted.',
                  'I accept the handling and responsibility terms for this room shipment.',
                ].map((label, index) => (
                  <label key={label} className="flex items-start gap-3 font-bold">
                    <input
                      type="checkbox"
                      checked={termsChecks[index]}
                      onChange={(event) => setTermsChecks((current) => current.map((value, itemIndex) => (itemIndex === index ? event.target.checked : value)))}
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
              <button
                className="neo-button mt-4 w-full bg-[var(--yellow)]"
                disabled={!termsChecks.every(Boolean)}
                onClick={() => acceptShipment(termsRoom)}
              >
                <CheckSquare size={18} />
                Accept Shipment And Enter Room
              </button>
            </div>
          </div>
        ) : null}

        {mapOpen ? (
          <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
            <div className="neo-card max-h-[86vh] w-full max-w-5xl overflow-auto bg-white p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="font-black uppercase text-[var(--coral)]">5km to 20km Radius</p>
                  <h2 className="text-3xl font-black uppercase">Recycler Matching Map</h2>
                </div>
                <button className="neo-button bg-white p-2" onClick={() => setMapOpen(false)} aria-label="Close matching map">
                  <X size={18} />
                </button>
              </div>
              <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
                <MapPanel
                  address={defaultAddress}
                  searchQuery={`paper recycling centers near ${defaultAddress}`}
                  title="Room-linked pickup map"
                  heightClassName="h-[360px]"
                />
                <div className="space-y-3">
                  {matches.map((recycler) => (
                    <div key={recycler.id} className="rounded-lg border-[3px] border-black bg-[var(--paper)] p-4">
                      <p className="text-xl font-black">{recycler.name}</p>
                      <p className="mt-2 flex items-center gap-2 font-bold"><Star size={16} /> {recycler.rating} rating · {recycler.distanceKm} km</p>
                      <p className="flex items-center gap-2 font-bold"><Phone size={16} /> {recycler.phone}</p>
                      <p className="font-bold opacity-70">{recycler.capacityKgPerDay} kg/day capacity</p>
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
