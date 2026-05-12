'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  Bell,
  CalendarClock,
  CheckSquare,
  Copy,
  DoorOpen,
  Download,
  ExternalLink,
  FileText,
  FolderArchive,
  Hash,
  Image as ImageIcon,
  Mail,
  Map,
  MessageSquare,
  Package,
  Paperclip,
  Phone,
  Plus,
  Send,
  Share2,
  ShieldCheck,
  Truck,
  Users,
  Weight,
  X,
} from 'lucide-react';
import { MapPanel } from '@/components/MapPanel';
import ProgressTracker from '@/components/ProgressTracker';
import { RoomStatusUpdateForm } from '@/components/RoomStatusUpdateForm';
import { StatusBadge } from '@/components/StatusBadge';
import { api } from '@/lib/api';
import { useRequireAuth } from '@/lib/auth';
import { uniqueRoomMembers } from '@/lib/roomMembers';
import { formatTrackingStatus } from '@/lib/shipmentFlow';
import type { Batch, RecyclerMatch, Role, Room, RoomMember, TrackingStatus } from '@/lib/types';

const tabs = ['Chat', 'Batches', 'Members', 'Timeline', 'Tracking', 'Documents'] as const;
type RoomTab = (typeof tabs)[number];

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function dataUrlToObjectUrl(dataUrl: string) {
  if (!dataUrl.startsWith('data:')) return dataUrl;
  const [header, base64 = ''] = dataUrl.split(',');
  const mime = header.match(/data:(.*?);base64/)?.[1] || 'application/octet-stream';
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return URL.createObjectURL(new Blob([bytes], { type: mime }));
}

function ChatAttachment({
  name,
  url,
  kind,
}: {
  name?: string;
  url?: string;
  kind?: 'message' | 'announcement' | 'file' | 'image';
}) {
  if (!url) return null;

  const isImage = kind === 'image' || url.startsWith('data:image/');

  function openAttachment() {
    if (!url) return;
    const objectUrl = dataUrlToObjectUrl(url);
    window.open(objectUrl, '_blank', 'noopener,noreferrer');
    if (objectUrl.startsWith('blob:')) window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
  }

  return (
    <div className="mt-3 space-y-2">
      {isImage ? (
        <button type="button" onClick={openAttachment} className="block w-fit text-left">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt={name || 'Shared image'} className="max-h-72 max-w-full rounded-lg border-2 border-black object-contain" />
        </button>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <button className="neo-button bg-white text-xs" type="button" onClick={openAttachment}>
          <ExternalLink size={16} />
          Open
        </button>
        <a className="neo-button bg-[var(--yellow)] text-xs" href={url} download={name || 'paperloop-attachment'}>
          <Download size={16} />
          Download
        </a>
        <span className="break-all rounded-md border-2 border-black bg-[var(--paper)] px-3 py-2 text-sm font-black">
          {name || 'Attachment'}
        </span>
      </div>
    </div>
  );
}

function memberName(member: string | RoomMember) {
  return typeof member === 'string' ? member : member.name;
}

function memberRole(member: string | RoomMember): Role {
  return typeof member === 'string' ? 'institution' : member.role;
}

function memberEmail(member: string | RoomMember) {
  return typeof member === 'string' ? `${member.toLowerCase().replace(/\s+/g, '.')}@paperloop.local` : member.email;
}

function memberPhone(member: string | RoomMember) {
  return typeof member === 'string' ? '+91 90000 00000' : member.phone || '+91 90000 00000';
}

function isCurrentUserMember(room: Room, user?: { uid?: string; email?: string; name?: string } | null) {
  if (!user) return false;
  return room.members.some((member) => {
    if (typeof member === 'string') return member === user.uid || member === user.email || member === user.name;
    return member.id === user.uid || member.email === user.email || member.name === user.name;
  });
}

function nextRecyclerUpdate(status: TrackingStatus) {
  if (status === 'Created') {
    return {
      status: 'Accepted' as const,
      label: 'Accept shipment',
      message: 'Recycler accepted the shipment request.',
    };
  }
  if (status === 'Accepted') {
    return {
      status: 'PickupStarted' as const,
      label: 'Pickup started proof',
      message: 'Recycler started pickup from the institution.',
    };
  }
  if (status === 'PickupStarted') {
    return {
      status: 'PickedUp' as const,
      label: 'Picked up proof',
      message: 'Recycler picked up the room shipment.',
    };
  }
  if (status === 'PickedUp') {
    return {
      status: 'InTransit' as const,
      label: 'In transit proof',
      message: 'Recycler moved the shipment in transit to the plant.',
    };
  }
  if (status === 'InTransit') {
    return {
      status: 'ReceivedAtPlant' as const,
      label: 'Received at plant proof',
      message: 'Recycler confirmed receipt at the recycling plant.',
    };
  }
  if (status === 'ReceivedAtPlant') {
    return {
      status: 'Processing' as const,
      label: 'Processing proof',
      message: 'Recycler started processing the paper batch.',
    };
  }
  if (status === 'Processing') {
    return {
      status: 'Recycled' as const,
      label: 'Recycled proof',
      message: 'Recycler completed recycling.',
    };
  }
  if (status === 'Recycled') {
    return {
      status: 'BooksProduced' as const,
      label: 'Books produced proof',
      message: 'Recycler completed notebook production.',
    };
  }
  return {
    status: 'SentToNGO' as const,
    label: 'Shipped to NGO proof',
    message: 'Recycler shipped notebooks to the NGO.',
  };
}

function nextNgoUpdate(status: TrackingStatus) {
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
      message: 'NGO started notebook distribution.',
    };
  }
  return {
    status: 'Delivered' as const,
    label: 'Distribution proof',
    message: 'NGO completed distribution and uploaded impact proof.',
  };
}

export default function ShipmentRoomPage() {
  const params = useParams<{ code?: string; id?: string }>();
  const code = params.code || params.id || '';
  const { user } = useRequireAuth(['institution', 'recycler', 'ngo', 'admin']);
  const [room, setRoom] = useState<Room | null>();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [activeTab, setActiveTab] = useState<RoomTab>('Chat');
  const [member, setMember] = useState('');
  const [inviteMode, setInviteMode] = useState<'email' | 'code'>('email');
  const [message, setMessage] = useState('');
  const [messageKind, setMessageKind] = useState<'message' | 'announcement' | 'file' | 'image'>('message');
  const [messageFile, setMessageFile] = useState<File | null>(null);
  const [chatActionOpen, setChatActionOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [matches, setMatches] = useState<RecyclerMatch[]>([]);
  const [batchTitle, setBatchTitle] = useState('Room paper batch');
  const [paperType, setPaperType] = useState('Answer sheets');
  const [weight, setWeight] = useState(50);
  const [pageCount, setPageCount] = useState(10000);
  const [documentTitle, setDocumentTitle] = useState('Room proof');
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [documentBusy, setDocumentBusy] = useState(false);
  const [customRecycler, setCustomRecycler] = useState({
    enterpriseName: '',
    contactName: '',
    address: '',
    phone: '',
    email: '',
    capacityKgPerDay: 500,
    notes: '',
  });

  const load = useCallback(() => {
    api.getRoom(code).then((nextRoom) => {
      setRoom(nextRoom || null);
      if (nextRoom?.pickupLocation) api.recyclerMatches(nextRoom.pickupLocation).then(setMatches);
    });
    api.listBatches().then((nextBatches) => setBatches(nextBatches.filter((batch) => batch.roomCode === code)));
  }, [code]);

  useEffect(() => {
    load();
    const interval = window.setInterval(load, 5000);
    return () => window.clearInterval(interval);
  }, [load]);

  const activeStatus = room?.shipmentStatus || 'Created';
  const currentBatch = useMemo(() => batches[0], [batches]);
  const joinUrl = typeof window !== 'undefined' ? `${window.location.origin}/room/join?code=${code}` : '';
  const canCreateBatch = user?.role === 'institution';
  const canInvite = user?.role === 'institution';
  const canSelectRecycler = user?.role === 'institution';
  const canRecyclerUpdate = user?.role === 'recycler' && room?.recyclerResponse === 'accepted';
  const canNgoUpdate = user?.role === 'ngo';
  const recyclerStep = nextRecyclerUpdate(activeStatus);
  const ngoStep = nextNgoUpdate(activeStatus);
  const visibleMembers = uniqueRoomMembers(room);
  const recyclerMember = visibleMembers.find((item) => memberRole(item) === 'recycler');
  const ngoMember = visibleMembers.find((item) => memberRole(item) === 'ngo');
  const isMember = room ? isCurrentUserMember(room, user) : false;
  const actorName = user?.organizationName || user?.institutionName || user?.name || 'Paperloop member';
  const recyclerRoomState =
    activeStatus === 'Created'
      ? 'Incoming Request'
      : ['Accepted', 'PickupStarted'].includes(activeStatus)
        ? 'Accepted Pickup'
        : ['PickedUp', 'InTransit', 'ReceivedAtPlant', 'Processing', 'Recycled', 'BooksProduced'].includes(activeStatus)
          ? 'Active Recycling'
          : ['SentToNGO', 'ReceivedByNGO', 'DistributionStarted', 'Delivered'].includes(activeStatus)
            ? 'Delivery'
            : 'Closed';

  async function addMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!member.trim()) return;
    setRoom(await api.addRoomMember(code, member.trim(), inviteMode));
    setMember('');
  }

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!message.trim() && !messageFile) return;
    const attachmentUrl = messageFile ? await fileToDataUrl(messageFile) : undefined;
    setRoom(
      await api.addRoomMessage(code, {
        author: user?.name || 'Member',
        body: message.trim() || `${messageFile?.name || 'Attachment'} shared.`,
        kind: messageKind,
        attachmentName: messageFile?.name,
        attachmentUrl,
      })
    );
    setMessage('');
    setMessageFile(null);
    setMessageKind('message');
    setChatActionOpen(false);
  }

  async function createBatch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const batchId = Date.now();
    await api.createBatch({
      batchId,
      institutionId: user?.id,
      title: batchTitle,
      paperType,
      weight,
      pagesEstimate: pageCount,
      notebooksEstimate: Math.round(weight * 5),
      roomCode: code,
      pickupLocation: room?.pickupLocation || { lat: 18.5204, lng: 73.8567, address: 'Pune, Maharashtra' },
      proofImages: [`https://example.com/proofs/${batchId}-created.jpg`],
      status: 'Created',
    });
    setBatchTitle('Room paper batch');
    setPageCount(10000);
    load();
  }

  function openChatAction(kind: 'announcement' | 'file' | 'image') {
    setMessageKind(kind);
    setChatActionOpen(true);
  }

  async function uploadRoomDocument(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!documentFile || !room) return;

    setDocumentBusy(true);
    try {
      const proof = await api.uploadProof({
        proofImages: [await fileToDataUrl(documentFile)],
        proofType: `${user?.role || 'institution'}-proof`,
        uploadedBy: user?.organizationName || user?.institutionName || user?.name || 'Paperloop member',
        shipmentId: room.code,
        proofFileName: documentFile.name,
      });

      await api.updateRoomShipment(room.code, {
        status: room.shipmentStatus || 'Created',
        actor: user?.organizationName || user?.institutionName || user?.name || 'Paperloop member',
        role: user?.role || 'institution',
        message: `${user?.name || 'A member'} uploaded a room document.`,
        proofUrl: proof.proofUrl,
        proofFileName: proof.proofFileName,
        documentTitle,
      });

      setDocumentFile(null);
      setDocumentTitle('Room proof');
      load();
    } finally {
      setDocumentBusy(false);
    }
  }

  async function selectRecycler(recycler: RecyclerMatch) {
    setRoom(await api.selectRecycler(code, recycler));
    setMapOpen(false);
  }

  async function registerAndSelectRecycler(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const recycler = await api.registerRecycler(customRecycler);
    setMatches(await api.recyclerMatches(room?.pickupLocation));
    setCustomRecycler({ enterpriseName: '', contactName: '', address: '', phone: '', email: '', capacityKgPerDay: 500, notes: '' });
    await selectRecycler(recycler);
  }

  async function joinThisRoom() {
    const joinedRoom = await api.joinRoom({ code }, user);
    setRoom(joinedRoom);
  }

  async function acceptRecyclerRoom() {
    await api.updateRoomShipment(code, {
      status: 'Accepted',
      actor: actorName,
      role: 'recycler',
      message: 'Recycler accepted the room shipment and joined the pickup workflow.',
    });
    load();
  }

  if (room === undefined) {
    return <div className="neo-card p-8 text-xl font-black uppercase">Loading shipment room...</div>;
  }

  if (!room) {
    return (
      <div className="neo-card mx-auto max-w-2xl space-y-4 bg-white p-6">
        <h1 className="text-3xl font-black uppercase">Room Not Found</h1>
        <p className="font-bold">Create a shipment room first or join with a valid 6-digit code.</p>
        <Link className="neo-button bg-[var(--cyan)]" href="/room/create">Create Room</Link>
      </div>
    );
  }

  return (
    <div className="space-y-7">
      <header className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <p className="font-black uppercase text-[var(--coral)]">Room {room.roomId || room._id} · Invite {room.code}</p>
          <h1 className="mt-2 text-4xl font-black uppercase md:text-6xl">{room.name}</h1>
          <p className="mt-2 max-w-3xl text-lg font-bold">
            {room.shipmentTitle || room.shipmentName} · {room.paperType || 'Mixed paper'} · {room.estimatedWeight || currentBatch?.weight || 0} kg · pickup by {room.pickupDeadline || 'deadline pending'}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {!isMember && user?.role === 'recycler' ? (
            <button className="neo-button bg-[var(--green)]" onClick={joinThisRoom}>
              <DoorOpen size={18} />
              Join Room
            </button>
          ) : null}
          <button className="neo-button bg-[var(--cyan)]" onClick={() => setMapOpen(true)} disabled={user?.role !== 'institution'}>
            <Map size={18} />
            Find Recycler
          </button>
          <button className="neo-button bg-white" onClick={() => setInviteOpen(true)}>
            <Copy size={18} />
            Invite Code
          </button>
          <button className="neo-button bg-[var(--yellow)]" onClick={() => setChatOpen(true)}>
            <MessageSquare size={18} />
            Chat Drawer
          </button>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-4">
        <div className="neo-card bg-[var(--cyan)] p-5">
          <p className="flex items-center gap-2 text-sm font-black uppercase"><Hash size={18} /> Room ID</p>
          <p className="mt-3 break-all text-xl font-black">{room.roomId || room._id}</p>
        </div>
        <div className="neo-card bg-[var(--yellow)] p-5">
          <p className="flex items-center gap-2 text-sm font-black uppercase"><Users size={18} /> Members</p>
          <p className="mt-3 text-4xl font-black">{visibleMembers.length}</p>
        </div>
        <div className="neo-card bg-[var(--green)] p-5">
          <p className="flex items-center gap-2 text-sm font-black uppercase"><Package size={18} /> Batches</p>
          <p className="mt-3 text-4xl font-black">{batches.length}</p>
        </div>
        <div className="neo-card bg-white p-5">
          <p className="flex items-center gap-2 text-sm font-black uppercase"><Truck size={18} /> Tracking</p>
          <div className="mt-4"><StatusBadge status={activeStatus} /></div>
        </div>
      </section>

      {user?.role === 'recycler' ? (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className={`neo-card p-5 ${recyclerRoomState === 'Incoming Request' ? 'bg-[var(--cyan)]' : 'bg-white'}`}>
            <p className="font-black uppercase">Incoming Request</p>
            <p className="mt-3 text-3xl font-black">{recyclerRoomState === 'Incoming Request' ? 'Active' : '0'}</p>
          </div>
          <div className={`neo-card p-5 ${recyclerRoomState === 'Accepted Pickup' ? 'bg-[var(--yellow)]' : 'bg-white'}`}>
            <p className="font-black uppercase">Accepted Pickup</p>
            <p className="mt-3 text-3xl font-black">{recyclerRoomState === 'Accepted Pickup' ? 'Active' : '0'}</p>
          </div>
          <div className={`neo-card p-5 ${recyclerRoomState === 'Active Recycling' ? 'bg-[var(--green)]' : 'bg-white'}`}>
            <p className="font-black uppercase">Active Recycling</p>
            <p className="mt-3 text-3xl font-black">{recyclerRoomState === 'Active Recycling' ? 'Active' : '0'}</p>
          </div>
          <div className={`neo-card p-5 ${recyclerRoomState === 'Delivery' ? 'bg-[var(--paper)]' : 'bg-white'}`}>
            <p className="font-black uppercase">Delivery</p>
            <p className="mt-3 text-3xl font-black">{recyclerRoomState === 'Delivery' ? 'Active' : '0'}</p>
          </div>
          {isMember && activeStatus === 'Created' ? (
            <button className="neo-button bg-[var(--yellow)] md:col-span-2 xl:col-span-4" onClick={acceptRecyclerRoom}>
              <CheckSquare size={18} />
              Accept Room Shipment
            </button>
          ) : null}
        </section>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr_0.8fr]">
        <div className="neo-card bg-white p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-black uppercase text-[var(--coral)]">Shipment Overview</p>
              <p className="mt-2 text-2xl font-black">{room.shipmentTitle || room.shipmentName}</p>
            </div>
            <StatusBadge status={activeStatus} />
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border-2 border-black bg-[var(--paper)] p-3">
              <p className="text-xs font-black uppercase">Paper Type</p>
              <p className="mt-1 font-bold">{room.paperType}</p>
            </div>
            <div className="rounded-lg border-2 border-black bg-[var(--paper)] p-3">
              <p className="text-xs font-black uppercase">Estimated Weight</p>
              <p className="mt-1 font-bold">{room.estimatedWeight} kg</p>
            </div>
            <div className="rounded-lg border-2 border-black bg-[var(--paper)] p-3">
              <p className="text-xs font-black uppercase">Pickup Location</p>
              <p className="mt-1 font-bold">{room.pickupLocation?.address}</p>
            </div>
            <div className="rounded-lg border-2 border-black bg-[var(--paper)] p-3">
              <p className="text-xs font-black uppercase">Pickup Deadline</p>
              <p className="mt-1 font-bold">{room.pickupDeadline}</p>
            </div>
          </div>
        </div>
        <div className="neo-card bg-[var(--paper)] p-5">
          <p className="text-sm font-black uppercase text-[var(--coral)]">Recycler Match</p>
          <p className="mt-2 text-2xl font-black">{room.selectedRecycler?.name || 'Pending'}</p>
          <p className="mt-2 font-bold opacity-70">{room.selectedRecycler?.phone || 'Choose a recycler from the map modal.'}</p>
          <p className="font-bold opacity-70">{room.selectedRecycler?.distanceKm ? `${room.selectedRecycler.distanceKm} km away · ${room.selectedRecycler.capacityKgPerDay} kg/day` : 'Institution location drives 5km to 20km matching.'}</p>
        </div>
        <div className="neo-card bg-[var(--paper)] p-5">
          <p className="text-sm font-black uppercase text-[var(--coral)]">NGO Delivery</p>
          <p className="mt-2 text-2xl font-black">{room.selectedNgo?.name || (ngoMember ? memberName(ngoMember) : 'Pending')}</p>
          <p className="mt-2 font-bold opacity-70">
            {room.selectedNgo?.phone || room.selectedNgo?.email || (ngoMember ? `${memberEmail(ngoMember)} · ${memberPhone(ngoMember)}` : 'NGO assignment appears once delivery is accepted.')}
          </p>
          <p className="font-bold opacity-70">{room.documents?.length || 0} room documents stored</p>
        </div>
      </section>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <button
            key={tab}
            className={`neo-button shrink-0 text-xs transition ${activeTab === tab ? 'bg-black text-white' : 'bg-white'}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'Chat' ? (
        <section className="neo-card grid min-h-[580px] gap-0 overflow-hidden bg-white lg:grid-cols-[1fr_320px]">
          <div className="flex min-h-[540px] flex-col p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-2xl font-black uppercase"><MessageSquare size={24} /> Room Chat</h2>
              <div className="flex flex-wrap gap-2">
                <button className="neo-button bg-white px-3 text-xs" onClick={() => openChatAction('announcement')} type="button" title="Post announcement"><Bell size={16} /> Announce</button>
                <button className="neo-button bg-white px-3 text-xs" onClick={() => openChatAction('file')} type="button" title="Upload file note"><Paperclip size={16} /> File</button>
                <button className="neo-button bg-white px-3 text-xs" onClick={() => openChatAction('image')} type="button" title="Upload image note"><ImageIcon size={16} /> Image</button>
              </div>
            </div>
            <div className="flex-1 space-y-3 overflow-auto rounded-lg border-[3px] border-black bg-[var(--paper)] p-4">
              {(room.messages || []).map((item) => (
                <div key={item.id} className="max-w-3xl rounded-lg border-2 border-black bg-white p-3 shadow-[3px_3px_0_#111]">
                  <p className="text-xs font-black uppercase opacity-60">{item.author} · {item.kind || 'message'} · {new Date(item.createdAt).toLocaleString()}</p>
                  <p className="mt-1 font-bold">{item.body}</p>
                  <ChatAttachment name={item.attachmentName} url={item.attachmentUrl} kind={item.kind} />
                </div>
              ))}
            </div>
            <form onSubmit={sendMessage} className="mt-4 grid gap-2 md:grid-cols-[1fr_auto]">
              <input className="neo-input" value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Share a live update, file note, image note, or announcement" />
              <button className="neo-button bg-[var(--yellow)] px-4" aria-label="Send message"><Send size={18} /> Send</button>
            </form>
          </div>
          <aside className="border-t-[3px] border-black bg-[var(--cyan)] p-5 lg:border-l-[3px] lg:border-t-0">
            <h3 className="text-xl font-black uppercase">Shared Room</h3>
            <p className="mt-2 font-bold">{visibleMembers.map(memberName).slice(0, 6).join(', ')}</p>
            <div className="mt-5 space-y-3">
              <div className="rounded-lg border-2 border-black bg-white p-3">
                <p className="text-sm font-black uppercase">Announcements</p>
                <p className="mt-1 font-bold">{(room.messages || []).filter((item) => item.kind === 'announcement').length} posted</p>
              </div>
              <div className="rounded-lg border-2 border-black bg-white p-3">
                <p className="text-sm font-black uppercase">Uploads</p>
                <p className="mt-1 font-bold">{(room.messages || []).filter((item) => item.kind === 'file' || item.kind === 'image').length} shared in chat</p>
              </div>
            </div>
          </aside>
        </section>
      ) : null}

      {activeTab === 'Batches' ? (
        <section className="grid gap-6 lg:grid-cols-[380px_1fr]">
          <form onSubmit={createBatch} className="neo-card space-y-4 bg-white p-5">
            <h2 className="text-2xl font-black uppercase">Create Batch In Room</h2>
            <label className="block space-y-2">
              <span className="flex items-center gap-2 text-sm font-black uppercase"><Hash size={18} /> Batch Title</span>
              <input className="neo-input" value={batchTitle} onChange={(event) => setBatchTitle(event.target.value)} disabled={!canCreateBatch} required />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-black uppercase">Paper Type</span>
              <select className="neo-input" value={paperType} onChange={(event) => setPaperType(event.target.value)} disabled={!canCreateBatch}>
                <option>Answer sheets</option>
                <option>Assignment paper</option>
                <option>Office paper</option>
                <option>Mixed paper</option>
              </select>
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block space-y-2">
                <span className="flex items-center gap-2 text-sm font-black uppercase"><Weight size={18} /> KG</span>
                <input className="neo-input" type="number" min={1} value={weight} onChange={(event) => setWeight(Number(event.target.value))} disabled={!canCreateBatch} required />
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-black uppercase">Page Count</span>
                <input className="neo-input" type="number" min={1} value={pageCount} onChange={(event) => setPageCount(Number(event.target.value))} disabled={!canCreateBatch} required />
              </label>
            </div>
            <button className="neo-button w-full bg-[var(--yellow)]" disabled={!canCreateBatch}><Plus size={18} /> Add Batch</button>
          </form>

          <div className="space-y-4">
            {batches.length ? batches.map((batch) => (
              <div key={batch.batchId} className="neo-card bg-white p-5">
                <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
                  <div>
                    <p className="text-2xl font-black">#{batch.batchId} {batch.title}</p>
                    <p className="font-bold opacity-70">{batch.paperType || room.paperType} · {batch.weight} kg · {batch.pagesEstimate || 0} pages · visible to all room members</p>
                  </div>
                  <StatusBadge status={batch.status} />
                </div>
                <div className="mt-4 grid gap-2 sm:grid-cols-3">
                  <span className="rounded-lg border-2 border-black bg-[var(--paper)] p-3 text-sm font-black">{batch.notebooksEstimate || Math.round(batch.weight * 5)} notebooks est.</span>
                  <span className="rounded-lg border-2 border-black bg-[var(--paper)] p-3 text-sm font-black">
                    {batch.verificationTimestamp ? 'System verified' : 'Awaiting verification'}
                  </span>
                </div>
              </div>
            )) : (
              <div className="neo-card bg-white p-6 font-black">No batches yet. Institutions create all batches inside this room only.</div>
            )}
          </div>
        </section>
      ) : null}

      {activeTab === 'Members' ? (
        <section className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <form onSubmit={addMember} className="neo-card space-y-4 bg-white p-5">
            <h2 className="text-2xl font-black uppercase">Invite Members</h2>
            <input className="neo-input" value={member} onChange={(event) => setMember(event.target.value)} placeholder="Email or invite label" disabled={!canInvite} />
            <div className="grid gap-3 sm:grid-cols-2">
              <button type="button" className={`neo-button ${inviteMode === 'email' ? 'bg-[var(--cyan)]' : 'bg-white'}`} onClick={() => setInviteMode('email')}>
                <Mail size={18} />
                Email
              </button>
              <button type="button" className={`neo-button ${inviteMode === 'code' ? 'bg-[var(--yellow)]' : 'bg-white'}`} onClick={() => setInviteMode('code')}>
                <Share2 size={18} />
                Join Code
              </button>
            </div>
            <button className="neo-button w-full bg-[var(--green)]" disabled={!canInvite}>Invite Member</button>
            <button type="button" className="neo-button w-full bg-white" onClick={() => navigator.clipboard.writeText(joinUrl)}>
              <Copy size={18} />
              Copy Join Link
            </button>
          </form>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="neo-card bg-[var(--cyan)] p-5">
                <p className="text-sm font-black uppercase">Recycler in room</p>
                <p className="mt-2 text-2xl font-black">{room.selectedRecycler?.name || (recyclerMember ? memberName(recyclerMember) : 'Not added yet')}</p>
                <p className="mt-1 font-bold opacity-70">{room.selectedRecycler?.address || room.selectedRecycler?.phone || 'Add a recycler from the finder or invite by join code.'}</p>
              </div>
              <div className="neo-card bg-[var(--green)] p-5">
                <p className="text-sm font-black uppercase">NGO supplied to</p>
                <p className="mt-2 text-2xl font-black">{room.selectedNgo?.name || (ngoMember ? memberName(ngoMember) : 'Not assigned yet')}</p>
                <p className="mt-1 font-bold opacity-70">{room.selectedNgo?.phone || 'NGO details appear when delivery/distribution updates are posted.'}</p>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {visibleMembers.map((item) => (
                <div key={memberEmail(item)} className="neo-card bg-white p-5">
                  <p className="text-2xl font-black">{memberName(item)}</p>
                  <p className="mt-1 font-black uppercase text-[var(--coral)]">{memberRole(item)}</p>
                  <p className="mt-3 font-bold">{memberEmail(item)}</p>
                  <p className="flex items-center gap-2 font-bold opacity-70"><Phone size={16} /> {memberPhone(item)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {activeTab === 'Timeline' ? (
        <section className="neo-card bg-white p-5">
          <h2 className="text-2xl font-black uppercase">Unified Room Timeline</h2>
          <div className="mt-5 space-y-4">
            {(room.timeline || []).map((item) => (
              <div key={item.id} className="rounded-lg border-[3px] border-black bg-[var(--paper)] p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-black uppercase">{item.actor} · {item.role}</p>
                  {item.status ? <StatusBadge status={item.status} /> : null}
                </div>
                <p className="mt-2 font-bold">{item.message}</p>
                {item.proofUrl ? <p className="mt-2 break-all text-sm font-bold opacity-70">Proof: {item.proofUrl}</p> : null}
                {item.verification ? (
                  <p className="mt-2 text-sm font-bold opacity-70">
                    Verified by {item.verification.verifiedBy} · {item.verification.verifiedRole} · {new Date(item.verification.verifiedAt).toLocaleString()}
                  </p>
                ) : null}
                <p className="mt-2 text-sm font-black opacity-60">{new Date(item.createdAt).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {activeTab === 'Tracking' ? (
        <section className="space-y-6">
          <div className="neo-card bg-white p-5">
            <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
              <div>
                <p className="font-black uppercase text-[var(--coral)]">Room Tracking</p>
                <h2 className="text-2xl font-black uppercase">{formatTrackingStatus(activeStatus)}</h2>
              </div>
              <StatusBadge status={activeStatus} />
            </div>
            <div className="mt-5">
              <ProgressTracker currentStatus={activeStatus} />
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
            <div className="neo-card bg-white p-5">
              <h3 className="text-2xl font-black uppercase">Shipment Updates</h3>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border-[3px] border-black bg-[var(--paper)] p-4">
                  <p className="flex items-center gap-2 text-sm font-black uppercase"><CalendarClock size={18} /> Current Room State</p>
                  <p className="mt-2 text-2xl font-black">{formatTrackingStatus(activeStatus)}</p>
                  <p className="mt-2 font-bold opacity-70">All tracking in this room now follows the shared shipment lifecycle instead of a global batch page.</p>
                </div>
                <div className="rounded-lg border-[3px] border-black bg-[var(--paper)] p-4">
                  <p className="flex items-center gap-2 text-sm font-black uppercase"><ShieldCheck size={18} /> Required Proofs</p>
                  <p className="mt-2 font-bold opacity-70">Institution proof, recycler proof, NGO proof, and delivery proof stay attached to the room with system verification.</p>
                </div>
              </div>

              {canCreateBatch ? (
                <div className="mt-5 rounded-lg border-[3px] border-black bg-[var(--cyan)] p-4">
                  <p className="text-sm font-black uppercase">Institution Permissions</p>
                  <p className="mt-2 font-bold">Create room, create batch, invite members, select recycler, and review proofs without leaving this shipment room.</p>
                </div>
              ) : null}

              {canRecyclerUpdate && !['SentToNGO', 'ReceivedByNGO', 'DistributionStarted', 'Delivered', 'Rejected'].includes(activeStatus) ? (
                <div className="mt-5">
                  <p className="mb-3 text-sm font-black uppercase text-[var(--coral)]">Recycler Next Step</p>
                  <RoomStatusUpdateForm
                    roomCode={room.code}
                    role="recycler"
                    actor={user?.organizationName || user?.institutionName || user?.name || 'Recycler'}
                    status={recyclerStep.status}
                    label={recyclerStep.label}
                    message={recyclerStep.message}
                    onUpdated={load}
                  />
                </div>
              ) : null}

              {canNgoUpdate && ['SentToNGO', 'ReceivedByNGO', 'DistributionStarted'].includes(activeStatus) ? (
                <div className="mt-5">
                  <p className="mb-3 text-sm font-black uppercase text-[var(--coral)]">NGO Next Step</p>
                  <RoomStatusUpdateForm
                    roomCode={room.code}
                    role="ngo"
                    actor={user?.organizationName || user?.institutionName || user?.name || 'NGO'}
                    status={ngoStep.status}
                    label={ngoStep.label}
                    message={ngoStep.message}
                    onUpdated={load}
                    requireProof={ngoStep.status === 'Delivered'}
                  />
                </div>
              ) : null}
            </div>

            <div className="neo-card bg-[var(--paper)] p-5">
              <h3 className="text-2xl font-black uppercase">Room Notes</h3>
              <div className="mt-4 space-y-3">
                <div className="rounded-lg border-2 border-black bg-white p-3">
                  <p className="text-sm font-black uppercase">Recycler</p>
                  <p className="mt-1 font-bold">{room.selectedRecycler?.name || 'Not selected yet'}</p>
                </div>
                <div className="rounded-lg border-2 border-black bg-white p-3">
                  <p className="text-sm font-black uppercase">NGO</p>
                  <p className="mt-1 font-bold">{room.selectedNgo?.name || 'Will appear after notebook delivery'}</p>
                </div>
                <div className="rounded-lg border-2 border-black bg-white p-3">
                  <p className="text-sm font-black uppercase">Proof Vault</p>
                  <p className="mt-1 font-bold">{room.documents?.length || 0} documents in this room</p>
                </div>
                <div className="rounded-lg border-2 border-black bg-white p-3">
                  <p className="flex items-center gap-2 text-sm font-black uppercase"><Bell size={16} /> Notifications</p>
                  <p className="mt-1 font-bold">{room.notifications?.length || 0} email notifications sent</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {activeTab === 'Documents' ? (
        <section className="neo-card bg-white p-5">
          <h2 className="flex items-center gap-2 text-2xl font-black uppercase"><FolderArchive size={24} /> Documents</h2>
          <form onSubmit={uploadRoomDocument} className="mt-5 grid gap-3 rounded-lg border-[3px] border-black bg-[var(--paper)] p-4 md:grid-cols-[1fr_1fr_auto]">
            <input className="neo-input" value={documentTitle} onChange={(event) => setDocumentTitle(event.target.value)} placeholder="Document title" />
            <input className="neo-input" type="file" onChange={(event) => setDocumentFile(event.target.files?.[0] || null)} />
            <button className="neo-button bg-[var(--yellow)]" disabled={!documentFile || documentBusy}>
              <Plus size={18} />
              {documentBusy ? 'Uploading...' : 'Upload File'}
            </button>
          </form>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {(room.documents || []).length ? room.documents?.map((doc) => (
              <div key={doc.id} className="rounded-lg border-[3px] border-black bg-[var(--paper)] p-4">
                <p className="flex items-center gap-2 text-xl font-black"><FileText size={20} /> {doc.title}</p>
                <p className="mt-1 font-black uppercase text-[var(--coral)]">{doc.ownerRole} · {doc.kind}</p>
                <p className="mt-2 break-all font-bold opacity-70">{doc.url || 'Stored in room vault'}</p>
                {doc.verification ? (
                  <p className="mt-2 text-sm font-bold text-green-700">
                    Verified by {doc.verification.verifiedBy} · {new Date(doc.verification.verifiedAt).toLocaleString()}
                  </p>
                ) : null}
                <div className="mt-4 flex flex-wrap gap-2">
                  {doc.url ? (
                    <>
                      <a className="neo-button bg-white text-xs" href={doc.url} target="_blank" rel="noreferrer">
                        <ExternalLink size={16} />
                        View File
                      </a>
                      <a className="neo-button bg-[var(--yellow)] text-xs" href={doc.url} download={doc.proofFileName || doc.title}>
                        <Download size={16} />
                        Download File
                      </a>
                    </>
                  ) : null}
                </div>
              </div>
            )) : (
              ['institution proofs', 'recycler proofs', 'NGO proofs', 'delivery proofs'].map((label) => (
                <div key={label} className="rounded-lg border-[3px] border-black bg-[var(--paper)] p-4">
                  <p className="flex items-center gap-2 text-xl font-black capitalize"><ShieldCheck size={20} /> {label}</p>
                  <p className="mt-2 font-bold opacity-70">Uploads, downloads, and verification badges appear here as the room advances.</p>
                </div>
              ))
            )}
          </div>
          {(room.notifications || []).length ? (
            <div className="mt-6 rounded-lg border-[3px] border-black bg-[var(--cyan)] p-4">
              <p className="flex items-center gap-2 text-xl font-black uppercase"><Bell size={20} /> Notification Feed</p>
              <div className="mt-3 space-y-2">
                {room.notifications?.slice(0, 4).map((notification) => (
                  <div key={notification.id} className="rounded-lg border-2 border-black bg-white p-3">
                    <p className="font-black">{notification.title}</p>
                    <p className="font-bold opacity-70">{notification.message}</p>
                    <p className="mt-1 text-xs font-black uppercase opacity-60">
                      {notification.channel} · {notification.emailStatus} · {notification.recipients.length} recipients
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      {chatActionOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <form onSubmit={sendMessage} className="neo-card w-full max-w-2xl space-y-4 bg-white p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-black uppercase text-[var(--coral)]">Room chat</p>
                <h2 className="text-3xl font-black uppercase">
                  {messageKind === 'announcement' ? 'Post Announcement' : messageKind === 'image' ? 'Upload Image Note' : 'Upload File Note'}
                </h2>
              </div>
              <button className="neo-button bg-white p-2" type="button" onClick={() => setChatActionOpen(false)} aria-label="Close chat action">
                <X size={18} />
              </button>
            </div>
            <textarea
              className="neo-input min-h-32"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder={messageKind === 'announcement' ? 'Write the announcement for all room members' : 'Add a note for this upload'}
            />
            {messageKind !== 'announcement' ? (
              <input
                className="neo-input"
                type="file"
                accept={messageKind === 'image' ? 'image/*' : undefined}
                onChange={(event) => setMessageFile(event.target.files?.[0] || null)}
              />
            ) : null}
            <button className="neo-button w-full bg-[var(--yellow)]">
              <Send size={18} />
              Share In Room
            </button>
          </form>
        </div>
      ) : null}

      {chatOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <div className="neo-card max-h-[86vh] w-full max-w-4xl overflow-auto bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-black uppercase">Chat Drawer</h2>
              <button className="neo-button bg-white p-2" onClick={() => setChatOpen(false)} aria-label="Close chat"><X size={18} /></button>
            </div>
            <div className="max-h-[55vh] space-y-3 overflow-auto rounded-lg border-[3px] border-black bg-[var(--paper)] p-4">
              {(room.messages || []).map((item) => (
                <div key={item.id} className="rounded-lg border-2 border-black bg-white p-3">
                  <p className="text-xs font-black uppercase opacity-60">{item.author} · {item.kind || 'message'}</p>
                  <p className="font-bold">{item.body}</p>
                  <ChatAttachment name={item.attachmentName} url={item.attachmentUrl} kind={item.kind} />
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {inviteOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <div className="neo-card w-full max-w-2xl bg-white p-5 text-center">
            <div className="mb-4 flex items-center justify-between">
              <div className="text-left">
                <p className="font-black uppercase text-[var(--coral)]">Room invite code</p>
                <p className="text-sm font-black uppercase">{room.roomId || room._id}</p>
              </div>
              <button className="neo-button bg-white p-2" onClick={() => setInviteOpen(false)} aria-label="Close invite code dialog">
                <X size={18} />
              </button>
            </div>
            <p className="text-6xl font-black">{room.code}</p>
            <p className="mx-auto mt-3 max-w-md font-bold">Share this 6-digit code so other people can join this room and be added into the shipment workflow.</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <button className="neo-button bg-white" onClick={() => navigator.clipboard.writeText(room.code)}>
                <Copy size={18} />
                Copy Code
              </button>
              <button className="neo-button bg-[var(--yellow)]" onClick={() => navigator.clipboard.writeText(joinUrl)}>
                <Share2 size={18} />
                Copy Join Link
              </button>
              <Link className="neo-button bg-[var(--cyan)] sm:col-span-2" href={`/room/join?code=${room.code}`}>
                Open Join Page
              </Link>
            </div>
          </div>
        </div>
      ) : null}

      {mapOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <div className="neo-card max-h-[86vh] w-full max-w-5xl overflow-auto bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="font-black uppercase text-[var(--coral)]">Google Maps API Ready · 5km to 20km</p>
                <h2 className="text-3xl font-black uppercase">Recycler Selection</h2>
              </div>
              <button className="neo-button bg-white p-2" onClick={() => setMapOpen(false)} aria-label="Close map"><X size={18} /></button>
            </div>
              <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
                <MapPanel
                  address={room.pickupLocation?.address || 'Pune, Maharashtra'}
                  searchQuery={`paper recycling centers near ${room.pickupLocation?.address || 'Pune, Maharashtra'}`}
                  title="Recycler matching map"
                  heightClassName="h-[360px]"
                />
                <div className="space-y-3">
                  <form onSubmit={registerAndSelectRecycler} className="space-y-2 rounded-lg border-[3px] border-black bg-white p-4">
                    <p className="font-black uppercase text-[var(--coral)]">Add custom recycler</p>
                    <input className="neo-input" placeholder="Enterprise name" value={customRecycler.enterpriseName} onChange={(event) => setCustomRecycler((current) => ({ ...current, enterpriseName: event.target.value }))} required />
                    <input className="neo-input" placeholder="Recycler name" value={customRecycler.contactName} onChange={(event) => setCustomRecycler((current) => ({ ...current, contactName: event.target.value }))} required />
                    <input className="neo-input" placeholder="Location" value={customRecycler.address} onChange={(event) => setCustomRecycler((current) => ({ ...current, address: event.target.value }))} required />
                    <input className="neo-input" placeholder="Phone" value={customRecycler.phone} onChange={(event) => setCustomRecycler((current) => ({ ...current, phone: event.target.value }))} required />
                    <input className="neo-input" type="email" placeholder="Email ID" value={customRecycler.email} onChange={(event) => setCustomRecycler((current) => ({ ...current, email: event.target.value }))} required />
                    <button className="neo-button w-full bg-[var(--yellow)] text-xs" disabled={!canSelectRecycler}>
                      <Plus size={16} />
                      Register And Connect
                    </button>
                  </form>
                  {matches.map((recycler) => (
                    <div key={recycler.id} className="rounded-lg border-[3px] border-black bg-[var(--paper)] p-4">
                      <p className="text-xl font-black">{recycler.name}</p>
                    <p className="font-bold">{recycler.rating} rating · {recycler.distanceKm} km · {recycler.capacityKgPerDay} kg/day</p>
                    <p className="font-bold opacity-70">{recycler.address} · {recycler.phone}</p>
                    {recycler.email ? <p className="break-all font-bold opacity-70">{recycler.email}</p> : null}
                    <button className="neo-button mt-3 w-full bg-[var(--green)] text-xs" disabled={!canSelectRecycler} onClick={() => selectRecycler(recycler)}>
                      <Share2 size={16} />
                      Connect Recycler
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
