'use client';

import { formatTrackingStatus } from './shipmentFlow';
import type {
  Batch,
  ProofAsset,
  RecyclerMatch,
  Role,
  Room,
  RoomDocument,
  RoomMember,
  RoomMessage,
  RoomNotification,
  RoomPartner,
  ShipmentHistoryItem,
  TrackingLog,
  TrackingStatus,
  UserProfile,
  VerificationRecord,
} from './types';
import { demoBatches, demoLogs, demoRecyclerMatches, demoShipmentHistory } from './demo';

const BATCHES_KEY = 'paperloop:v3:batches';
const LOGS_KEY = 'paperloop:v3:logs';
const ROOMS_KEY = 'paperloop:v3:rooms';
const ROLE_KEY = 'paperloop:role';

function canUseStorage() {
  return typeof window !== 'undefined' && Boolean(window.localStorage);
}

function readJson<T>(key: string, fallback: T): T {
  if (!canUseStorage()) return fallback;
  const raw = window.localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function asRoomRole(role: string): Role {
  if (role === 'recycler' || role === 'ngo' || role === 'admin') return role;
  return 'institution';
}

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function proofKindForRole(role: Role): RoomDocument['kind'] {
  if (role === 'ngo') return 'ngo-proof';
  if (role === 'recycler') return 'recycler-proof';
  return 'institution-proof';
}

function verificationFor(actor: string, role: Role): VerificationRecord {
  return {
    status: 'verified',
    verifiedBy: actor,
    verifiedRole: role,
    verifiedAt: new Date().toISOString(),
  };
}

function roomRecipientEmails(room: Room) {
  return room.members.map((member) => (typeof member === 'string' ? `${member}@paperloop.local` : member.email)).filter(Boolean);
}

function createRoomNotification(room: Room, title: string, message: string): RoomNotification {
  return {
    id: createId('notification'),
    roomCode: room.code,
    title,
    message,
    recipients: roomRecipientEmails(room),
    channel: 'email',
    emailStatus: 'sent',
    createdAt: new Date().toISOString(),
  };
}

export function getLocalRole() {
  if (!canUseStorage()) return 'institution';
  const role = window.localStorage.getItem(ROLE_KEY) || 'institution';
  return role === 'teacher' ? 'institution' : role;
}

export function setLocalRole(role: string) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(ROLE_KEY, role);
  window.dispatchEvent(new CustomEvent('paperloop-role-change', { detail: role }));
}

export function getLocalBatches() {
  const existing = readJson<Batch[]>(BATCHES_KEY, []);
  if (existing.length) return existing;
  writeJson(BATCHES_KEY, demoBatches);
  return demoBatches;
}

export function saveLocalBatches(batches: Batch[]) {
  writeJson(BATCHES_KEY, batches);
}

export function getLocalLogs(batchId?: number) {
  const existing = readJson<TrackingLog[]>(LOGS_KEY, []);
  const logs = existing.length ? existing : demoLogs;
  if (!existing.length) writeJson(LOGS_KEY, demoLogs);
  return batchId ? logs.filter((log) => log.batchId === batchId) : logs;
}

export function addLocalLog(log: Omit<TrackingLog, 'createdAt'> & { createdAt?: string }) {
  const logs = getLocalLogs();
  const nextLog = { ...log, createdAt: log.createdAt || new Date().toISOString() };
  writeJson(LOGS_KEY, [...logs, nextLog]);
  return nextLog;
}

export function generateRoomCode() {
  const rooms = readJson<Room[]>(ROOMS_KEY, []);
  let code = '';
  do {
    code = Math.floor(100000 + Math.random() * 900000).toString();
  } while (rooms.some((room) => room.code === code));
  return code;
}

export function getLocalRooms() {
  return readJson<Room[]>(ROOMS_KEY, []);
}

export function getLocalRoom(code: string) {
  return getLocalRooms().find((room) => room.code === code);
}

function updateLocalRoom(code: string, updater: (room: Room) => Room) {
  const rooms = getLocalRooms();
  const next = rooms.map((room) => (room.code === code ? updater(room) : room));
  writeJson(ROOMS_KEY, next);
  const room = next.find((item) => item.code === code);
  if (!room) throw new Error('Room not found');
  return room;
}

export function getPrimaryLocalRoom(user?: UserProfile | null) {
  const rooms = getLocalRooms();
  const existing = rooms.find((room) => room.createdByUid === user?.uid && room.name === 'Primary Shipment Room') || rooms[0];
  if (existing) return existing;
  return createLocalRoom({
    name: 'Primary Shipment Room',
    shipmentTitle: 'Primary paper shipment',
    institutionId: user?.id || 'local-institution',
    createdByUid: user?.uid || 'local-user',
    memberName: user?.name,
    memberEmail: user?.email,
  });
}

export function createLocalRoom(payload: {
  name: string;
  roomName?: string;
  shipmentName?: string;
  institutionId?: string;
  createdByUid?: string;
  shipmentTitle?: string;
  paperType?: string;
  estimatedWeight?: number;
  pickupLocation?: string | { lat?: number; lng?: number; address?: string };
  pickupDeadline?: string;
  memberName?: string;
  memberEmail?: string;
  memberPhone?: string;
}) {
  const rooms = readJson<Room[]>(ROOMS_KEY, []);
  const createdAt = new Date().toISOString();
  const member: RoomMember = {
    id: payload.createdByUid || 'local-user',
    name: payload.memberName || 'Institution Admin',
    role: 'institution',
    email: payload.memberEmail || 'admin@paperloop.edu',
    phone: payload.memberPhone || '+91 90000 00000',
  };
  const pickupLocation =
    typeof payload.pickupLocation === 'string'
      ? { lat: 18.5204, lng: 73.8567, address: payload.pickupLocation }
      : payload.pickupLocation || { lat: 18.5204, lng: 73.8567, address: 'Pune, Maharashtra' };
  const room: Room = {
    _id: `local-room-${Date.now()}`,
    roomId: `ROOM-${Date.now().toString(36).toUpperCase()}`,
    code: generateRoomCode(),
    name: payload.roomName || payload.name,
    institutionId: payload.institutionId || 'local-institution',
    createdByUid: payload.createdByUid || 'local-user',
    members: [member],
    batches: [],
    shipmentName: payload.shipmentName || payload.shipmentTitle || payload.name,
    shipmentTitle: payload.shipmentName || payload.shipmentTitle || payload.name,
    paperType: payload.paperType || 'Mixed paper',
    estimatedWeight: payload.estimatedWeight || 50,
    pickupLocation,
    pickupDeadline: payload.pickupDeadline || new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString().slice(0, 10),
    shipmentStatus: 'Created',
    recyclerResponse: 'pending',
    invitedPeople: [],
    notifications: [],
    messages: [
      {
        id: createId('message'),
        author: 'Paperloop',
        body: 'Room created. Chat, batches, members, tracking, shipment updates, and documents now live here.',
        kind: 'announcement',
        createdAt,
      },
    ],
    timeline: [
      {
        id: createId('timeline'),
        actor: 'Paperloop',
        role: 'system',
        status: 'Created',
        kind: 'status',
        message: 'Shipment room created with room ID and 6-digit invite code.',
        createdAt,
      },
    ],
    documents: [],
    createdAt,
    updatedAt: createdAt,
  };
  writeJson(ROOMS_KEY, [...rooms, room]);
  return room;
}

export function joinLocalRoom(payload: { code: string; userUid?: string; memberName?: string; role?: Role; email?: string }) {
  const rooms = readJson<Room[]>(ROOMS_KEY, []);
  const room = rooms.find((item) => item.code === payload.code);
  if (!room) throw new Error('Room code not found on this device. Start the backend for multi-device room sharing.');
  const member: RoomMember = {
    id: payload.userUid || `guest-${Date.now()}`,
    name: payload.memberName || payload.userUid || 'Guest',
    role: payload.role || 'institution',
    email: payload.email || `${(payload.memberName || payload.userUid || 'guest').toLowerCase().replace(/\s+/g, '.')}@paperloop.local`,
    phone: '+91 90000 00000',
  };
  if (!room.members.some((item) => (typeof item === 'string' ? item : item.id) === member.id)) room.members.push(member);
  writeJson(ROOMS_KEY, rooms);
  return room;
}

export function createLocalBatch(batch: Batch) {
  const createdAt = new Date().toISOString();
  const proofs: ProofAsset[] = (batch.proofImages || []).map((proofUrl, index) => ({
    id: createId(`proof-${index}`),
    proofUrl,
    proofType: 'institution-proof',
    proofFileName: `proof-${index + 1}.jpg`,
    uploadedBy: 'Institution',
    uploadedRole: 'institution',
    uploadedAt: createdAt,
    shipmentId: String(batch.batchId),
    verification: verificationFor('Institution', 'institution'),
  }));

  const normalizedBatch: Batch = {
    ...batch,
    proofs,
    proofUrl: proofs[0]?.proofUrl,
    proofFileName: proofs[0]?.proofFileName,
    verifiedBy: 'Institution',
    verifiedRole: 'institution',
    verificationTimestamp: createdAt,
    createdAt,
    updatedAt: createdAt,
  };

  const batches = getLocalBatches();
  const next = [normalizedBatch, ...batches.filter((item) => item.batchId !== normalizedBatch.batchId)];
  saveLocalBatches(next);

  if (normalizedBatch.roomCode) {
    try {
      updateLocalRoom(normalizedBatch.roomCode, (room) => {
        const notification = createRoomNotification(
          room,
          'Batch created',
          `A new batch, ${normalizedBatch.title}, was added to room ${room.name}.`
        );

        return {
          ...room,
          batches: room.batches.includes(normalizedBatch.batchId) ? room.batches : [...room.batches, normalizedBatch.batchId],
          shipmentTitle: room.shipmentTitle || normalizedBatch.title,
          shipmentStatus: normalizedBatch.status,
          timeline: [
            ...(room.timeline || []),
            {
              id: createId('timeline'),
              actor: 'Institution',
              role: 'institution',
              status: normalizedBatch.status,
              kind: 'status',
              message: `Created room batch "${normalizedBatch.title}" with ${normalizedBatch.weight} kg of ${normalizedBatch.paperType || room.paperType || 'paper'}.`,
              proofRequired: true,
              proofUrl: normalizedBatch.proofUrl,
              proofFileName: normalizedBatch.proofFileName,
              verification: verificationFor('Institution', 'institution'),
              createdAt,
            },
            {
              id: createId('timeline'),
              actor: 'Paperloop',
              role: 'system',
              kind: 'notification',
              message: `Email notification sent to ${notification.recipients.length} room members about the new batch.`,
              createdAt,
            },
          ],
          documents: [
            ...(room.documents || []),
            ...proofs.map((proof, index) => ({
              id: createId(`doc-${index}`),
              title: `${normalizedBatch.title} institution proof ${index + 1}`,
              ownerRole: 'institution' as const,
              kind: 'institution-proof' as const,
              url: proof.proofUrl,
              proofFileName: proof.proofFileName,
              uploadedBy: proof.uploadedBy,
              uploadedAt: proof.uploadedAt,
              shipmentId: proof.shipmentId,
              verification: proof.verification,
              createdAt,
            })),
          ],
          notifications: [notification, ...(room.notifications || [])],
          updatedAt: createdAt,
        };
      });
    } catch {
      // Room may not exist in local fallback storage.
    }
  }

  addLocalLog({
    batchId: normalizedBatch.batchId,
    status: normalizedBatch.status,
    actorRole: 'institution',
    message: 'Institution created paper batch and uploaded initial proof',
    proofUrl: normalizedBatch.proofUrl,
    proofFileName: normalizedBatch.proofFileName,
    verifiedBy: 'Institution',
    verifiedRole: 'institution',
    verificationTimestamp: createdAt,
  });

  return normalizedBatch;
}

export function addLocalRoomMember(code: string, member: string, method: 'email' | 'code' = 'email') {
  const role = member.toLowerCase().includes('ngo') ? 'ngo' : member.toLowerCase().includes('recycl') ? 'recycler' : 'institution';
  const structuredMember: RoomMember = {
    id: createId('member'),
    name: member.includes('@') ? member.split('@')[0] : member,
    role,
    email: member.includes('@') ? member : `${member.toLowerCase().replace(/\s+/g, '.')}@paperloop.local`,
    phone: role === 'recycler' ? '+91 98765 43012' : role === 'ngo' ? '+91 98111 22009' : '+91 90000 00000',
  };

  return updateLocalRoom(code, (room) => {
    const alreadyMember = room.members.some((item) => (typeof item === 'string' ? item : item.email) === structuredMember.email);
    const notification = createRoomNotification(
      room,
      'Member invited',
      `${structuredMember.name} was invited to room ${room.name} via ${method === 'code' ? 'join code' : 'email'}.`
    );

    return {
      ...room,
      invitedPeople: [...(room.invitedPeople || []), member].filter(Boolean),
      members: alreadyMember ? room.members : [...room.members, structuredMember],
      timeline: [
        ...(room.timeline || []),
        {
          id: createId('timeline'),
          actor: 'Institution',
          role: 'institution',
          kind: 'invite',
          message: `Invited ${structuredMember.name} via ${method === 'code' ? 'join code' : 'email'}.`,
          createdAt: new Date().toISOString(),
        },
      ],
      notifications: [notification, ...(room.notifications || [])],
      updatedAt: new Date().toISOString(),
    };
  });
}

export function addLocalRoomMessage(code: string, message: Omit<RoomMessage, 'id' | 'createdAt'>) {
  return updateLocalRoom(code, (room) => ({
    ...room,
    messages: [
      ...(room.messages || []),
      {
        ...message,
        id: createId('message'),
        createdAt: new Date().toISOString(),
      },
    ],
    timeline:
      message.kind === 'announcement'
        ? [
            ...(room.timeline || []),
            {
              id: createId('timeline'),
              actor: message.author,
              role: 'institution',
              kind: 'announcement',
              message: message.body,
              createdAt: new Date().toISOString(),
            },
          ]
        : room.timeline,
    updatedAt: new Date().toISOString(),
  }));
}

export function selectLocalRecycler(code: string, recycler: RecyclerMatch) {
  const recyclerPartner: RoomPartner = {
    id: recycler.id,
    name: recycler.name,
    role: 'recycler',
    phone: recycler.phone,
    address: recycler.address,
    rating: recycler.rating,
    distanceKm: recycler.distanceKm,
    capacityKgPerDay: recycler.capacityKgPerDay,
  };

  return updateLocalRoom(code, (room) => {
    const notification = createRoomNotification(
      room,
      'Recycler connected',
      `${recycler.name} has been connected to room ${room.name} for shipment review.`
    );

    return {
      ...room,
      recyclerResponse: 'pending',
      selectedRecyclerId: recycler.id,
      selectedRecycler: recyclerPartner,
      members: room.members.some((item) => (typeof item === 'string' ? item : item.id) === recycler.id)
        ? room.members
        : [
            ...room.members,
            {
              id: recycler.id,
              name: recycler.name,
              role: 'recycler',
              email: `${recycler.id}@paperloop.recycler`,
              phone: recycler.phone,
            },
          ],
      timeline: [
        ...(room.timeline || []),
        {
          id: createId('timeline'),
          actor: 'Institution',
          role: 'institution',
          kind: 'status',
          message: `Matched ${recycler.name} at ${recycler.distanceKm} km with ${recycler.capacityKgPerDay} kg/day capacity.`,
          createdAt: new Date().toISOString(),
        },
      ],
      notifications: [notification, ...(room.notifications || [])],
      updatedAt: new Date().toISOString(),
    };
  });
}

export function updateLocalRoomShipment(
  code: string,
  update: {
    status: TrackingStatus;
    actor: string;
    role: Role;
    message: string;
    proofUrl?: string;
    proofFileName?: string;
    documentTitle?: string;
  }
) {
  return updateLocalRoom(code, (room) => {
    const verification = verificationFor(update.actor, update.role);
    const documentTitle = update.documentTitle || `${formatTrackingStatus(update.status)} proof`;
    const notification = createRoomNotification(
      room,
      `${formatTrackingStatus(update.status)} update`,
      `${update.actor} marked shipment room ${room.name} as ${formatTrackingStatus(update.status)}.`
    );

    return {
      ...room,
      shipmentStatus: update.status,
      recyclerResponse:
        update.role === 'recycler' && update.status === 'Accepted'
          ? 'accepted'
          : update.role === 'recycler' && update.status === 'Rejected'
            ? 'rejected'
            : room.recyclerResponse,
      selectedRecycler:
        update.role === 'recycler' && !room.selectedRecycler
          ? {
              id: `recycler-${room.code}`,
              name: update.actor,
              role: 'recycler',
              email: `${update.actor.toLowerCase().replace(/\s+/g, '.')}@paperloop.recycler`,
            }
          : room.selectedRecycler,
      selectedNgo:
        update.role === 'ngo' && !room.selectedNgo
          ? {
              id: `ngo-${room.code}`,
              name: update.actor,
              role: 'ngo',
              email: `${update.actor.toLowerCase().replace(/\s+/g, '.')}@paperloop.ngo`,
            }
          : room.selectedNgo,
      timeline: [
        ...(room.timeline || []),
        {
          id: createId('timeline'),
          actor: update.actor,
          role: update.role,
          status: update.status,
          kind: 'status',
          message: update.message,
          proofRequired: Boolean(update.proofUrl),
          proofUrl: update.proofUrl,
          proofFileName: update.proofFileName,
          verification,
          createdAt: new Date().toISOString(),
        },
        {
          id: createId('timeline'),
          actor: 'Paperloop',
          role: 'system',
          kind: 'notification',
          message: `Email notification sent to ${notification.recipients.length} room members for ${formatTrackingStatus(update.status)}.`,
          createdAt: new Date().toISOString(),
        },
      ],
      documents: update.proofUrl
        ? [
            ...(room.documents || []),
            {
              id: createId('doc'),
              title: documentTitle,
              ownerRole: update.role,
              kind: proofKindForRole(update.role),
              url: update.proofUrl,
              proofFileName: update.proofFileName,
              uploadedBy: update.actor,
              uploadedAt: new Date().toISOString(),
              shipmentId: room.code,
              verification,
              createdAt: new Date().toISOString(),
            },
          ]
        : room.documents,
      notifications: [notification, ...(room.notifications || [])],
      updatedAt: new Date().toISOString(),
    };
  });
}

export function transitionLocalBatch(params: {
  batchId: number;
  status: TrackingStatus;
  actorRole: string;
  proofUrl?: string;
  proofFileName?: string;
  message: string;
}) {
  const actorRole = asRoomRole(params.actorRole);
  const verification = verificationFor(params.actorRole, actorRole);
  const batches = getLocalBatches();
  const next = batches.map((batch) =>
    batch.batchId === params.batchId
      ? {
          ...batch,
          status: params.status,
          proofUrl: params.proofUrl || batch.proofUrl,
          proofFileName: params.proofFileName || batch.proofFileName,
          verifiedBy: verification.verifiedBy,
          verifiedRole: verification.verifiedRole,
          verificationTimestamp: verification.verifiedAt,
          updatedAt: new Date().toISOString(),
        }
      : batch
  );
  saveLocalBatches(next);

  const updated = next.find((batch) => batch.batchId === params.batchId);
  if (updated?.roomCode) {
    try {
      updateLocalRoomShipment(updated.roomCode, {
        status: params.status,
        actor: params.actorRole,
        role: actorRole,
        message: params.message,
        proofUrl: params.proofUrl,
        proofFileName: params.proofFileName,
      });
    } catch {
      // Room may not exist in local fallback storage.
    }
  }

  addLocalLog({
    batchId: params.batchId,
    status: params.status,
    actorRole: params.actorRole,
    message: params.message,
    proofUrl: params.proofUrl,
    proofFileName: params.proofFileName,
    verifiedBy: verification.verifiedBy,
    verifiedRole: verification.verifiedRole,
    verificationTimestamp: verification.verifiedAt,
  });

  return updated || getLocalBatches()[0];
}

export function addLocalProof(params: {
  batchId: number;
  actorRole: string;
  proofUrl?: string;
  proofFileName?: string;
  message: string;
}) {
  const batch = getLocalBatches().find((item) => item.batchId === params.batchId) || getLocalBatches()[0];
  const role = asRoomRole(params.actorRole);
  const verification = verificationFor(params.actorRole, role);

  if (batch.roomCode && params.proofUrl) {
    updateLocalRoom(batch.roomCode, (room) => ({
      ...room,
      documents: [
        ...(room.documents || []),
        {
          id: createId('doc'),
          title: `${formatTrackingStatus(batch.status)} proof`,
          ownerRole: role,
          kind: proofKindForRole(role),
          url: params.proofUrl,
          proofFileName: params.proofFileName,
          uploadedBy: params.actorRole,
          uploadedAt: new Date().toISOString(),
          shipmentId: room.code,
          verification,
          createdAt: new Date().toISOString(),
        },
      ],
      timeline: [
        ...(room.timeline || []),
        {
          id: createId('timeline'),
          actor: params.actorRole,
          role,
          kind: 'document',
          status: batch.status,
          message: params.message,
          proofRequired: true,
          proofUrl: params.proofUrl,
          proofFileName: params.proofFileName,
          verification,
          createdAt: new Date().toISOString(),
        },
      ],
      notifications: [
        createRoomNotification(
          room,
          'Proof uploaded',
          `${params.actorRole} uploaded a ${formatTrackingStatus(batch.status)} proof in room ${room.name}.`
        ),
        ...(room.notifications || []),
      ],
      updatedAt: new Date().toISOString(),
    }));
  }

  addLocalLog({
    batchId: params.batchId,
    status: batch.status,
    actorRole: params.actorRole,
    message: params.message,
    proofUrl: params.proofUrl,
    proofFileName: params.proofFileName,
    verifiedBy: verification.verifiedBy,
    verifiedRole: verification.verifiedRole,
    verificationTimestamp: verification.verifiedAt,
  });

  return batch;
}

export function getLocalRecyclerMatches(_location?: Room['pickupLocation'], minKm = 5, maxKm = 20): RecyclerMatch[] {
  return demoRecyclerMatches.filter((recycler) => recycler.distanceKm >= minKm && recycler.distanceKm <= maxKm);
}

export function getLocalShipmentHistory(): ShipmentHistoryItem[] {
  return demoShipmentHistory;
}
