'use client';

import type { Batch, Room, TrackingLog, TrackingStatus } from './types';
import { demoBatches, demoLogs } from './demo';

const BATCHES_KEY = 'paperloop:v2:batches';
const LOGS_KEY = 'paperloop:v2:logs';
const ROOMS_KEY = 'paperloop:rooms';
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

export function getLocalRole() {
  if (!canUseStorage()) return 'teacher';
  return window.localStorage.getItem(ROLE_KEY) || 'teacher';
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

export function createLocalBatch(batch: Batch) {
  const batches = getLocalBatches();
  const next = [batch, ...batches.filter((item) => item.batchId !== batch.batchId)];
  saveLocalBatches(next);
  addLocalLog({
    batchId: batch.batchId,
    status: batch.status,
    actorRole: 'teacher',
    actorWallet: batch.institutionWallet,
    txHash: batch.txHashes?.created,
    message: 'Teacher created paper batch and uploaded initial proof',
  });
  return batch;
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

export function createLocalRoom(payload: { name: string; institutionId: string; createdByUid: string }) {
  const rooms = readJson<Room[]>(ROOMS_KEY, []);
  const room: Room = {
    _id: `local-room-${Date.now()}`,
    code: generateRoomCode(),
    name: payload.name,
    institutionId: payload.institutionId,
    createdByUid: payload.createdByUid,
    members: [payload.createdByUid],
    batches: [],
  };
  writeJson(ROOMS_KEY, [...rooms, room]);
  return room;
}

export function joinLocalRoom(payload: { code: string; userUid: string }) {
  const rooms = readJson<Room[]>(ROOMS_KEY, []);
  const room = rooms.find((item) => item.code === payload.code);
  if (!room) throw new Error('Room code not found on this device. Start the backend for multi-device room sharing.');
  if (!room.members.includes(payload.userUid)) room.members.push(payload.userUid);
  writeJson(ROOMS_KEY, rooms);
  return room;
}

export function transitionLocalBatch(params: {
  batchId: number;
  status: TrackingStatus;
  actorRole: string;
  actorWallet?: string;
  txHash?: string;
  proofHash?: string;
  message: string;
}) {
  const batches = getLocalBatches();
  const next = batches.map((batch) =>
    batch.batchId === params.batchId
      ? {
          ...batch,
          status: params.status,
          txHashes: { ...(batch.txHashes || {}), [params.status]: params.txHash || params.proofHash || `local-${Date.now()}` },
          updatedAt: new Date().toISOString(),
        }
      : batch
  );
  saveLocalBatches(next);
  addLocalLog({
    batchId: params.batchId,
    status: params.status,
    actorRole: params.actorRole,
    actorWallet: params.actorWallet,
    txHash: params.txHash || params.proofHash,
    message: params.message,
  });
  return next.find((batch) => batch.batchId === params.batchId) || getLocalBatches()[0];
}

export function addLocalProof(params: {
  batchId: number;
  actorRole: string;
  actorWallet?: string;
  proofHash?: string;
  message: string;
}) {
  const batch = getLocalBatches().find((item) => item.batchId === params.batchId) || getLocalBatches()[0];
  addLocalLog({
    batchId: params.batchId,
    status: batch.status,
    actorRole: params.actorRole,
    actorWallet: params.actorWallet,
    txHash: params.proofHash,
    proofHash: params.proofHash,
    message: params.message,
  });
  return batch;
}
