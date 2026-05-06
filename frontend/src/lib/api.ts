import type {
  AnalyticsSummary,
  Batch,
  RecyclerMatch,
  Role,
  Room,
  RoomMessage,
  ShipmentHistoryItem,
  TrackingLog,
  TrackingStatus,
  UserProfile,
} from './types';
import { demoAnalytics, demoBatches } from './demo';
import {
  addLocalProof,
  addLocalRoomMember,
  addLocalRoomMessage,
  createLocalBatch,
  createLocalRoom,
  getLocalBatches,
  getLocalLogs,
  getLocalRecyclerMatches,
  getLocalRoom,
  getLocalRooms,
  getLocalShipmentHistory,
  getPrimaryLocalRoom,
  joinLocalRoom,
  selectLocalRecycler,
  transitionLocalBatch,
  updateLocalRoomShipment,
} from './localStore';
import { getStoredAuthToken } from './auth';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

async function request<T>(path: string, options?: RequestInit, fallback?: T): Promise<T> {
  const token = getStoredAuthToken();
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options?.headers || {}),
      },
      cache: 'no-store',
    });

    if (!response.ok) throw new Error(await response.text());
    return response.json() as Promise<T>;
  } catch (error) {
    if (fallback !== undefined) return fallback;
    if (token && !token.startsWith('local-demo-token-')) throw error;
    throw error;
  }
}

export const api = {
  listBatches: (status?: string) =>
    request<Batch[]>(`/batch${status ? `?status=${status}` : ''}`, undefined, getLocalBatches()).then((batches) =>
      status ? batches.filter((batch) => batch.status === status) : batches
    ),
  availableBatches: () => request<Batch[]>('/batch/available', undefined, getLocalBatches().filter((b) => b.status === 'Created')),
  recycledBatches: () => request<Batch[]>('/batch/recycled', undefined, getLocalBatches().filter((b) => b.status === 'Recycled')),
  getBatch: (batchId: string | number) =>
    request<{ batch: Batch }>(`/batch/${batchId}`, undefined, {
      batch: getLocalBatches().find((batch) => batch.batchId === Number(batchId)) || demoBatches[0],
    }),
  uploadProof: (payload: {
    proofImages?: string[];
    proofType?: string;
    uploadedBy?: string;
    shipmentId?: string;
    proofFileName?: string;
    [key: string]: unknown;
  }) =>
    request<{ proofUrl: string; proofType: string; proofFileName?: string; uploadedAt: string }>('/batch/proof-upload', {
      method: 'POST',
      body: JSON.stringify(payload),
    }, {
      proofUrl: payload.proofImages?.[0] || '',
      proofType: payload.proofType || 'proof',
      proofFileName: payload.proofFileName,
      uploadedAt: new Date().toISOString(),
    }),
  createBatch: async (payload: unknown) => {
    try {
      return await request<Batch>('/batch/create', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    } catch {
      return createLocalBatch(payload as Batch);
    }
  },
  transitionBatch: async (
    action: 'accept' | 'pickup' | 'transit' | 'receive' | 'recycle' | 'distribute',
    payload: {
      batchId: string | number;
      actorRole?: string;
      proofUrl?: string;
      proofFileName?: string;
      message?: string;
      finalDelivery?: boolean;
    }
  ) => {
    try {
      return await request<Batch>(`/batch/${action}`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    } catch {
      return transitionLocalBatch({
        batchId: Number(payload.batchId),
        status:
          action === 'accept'
            ? 'Accepted'
            : action === 'pickup'
              ? 'PickedUp'
              : action === 'transit'
                ? 'InTransit'
                : action === 'receive'
                  ? 'ReceivedAtPlant'
                  : action === 'recycle'
                    ? 'Recycled'
                    : payload.finalDelivery
                      ? 'Delivered'
                      : 'SentToNGO',
        actorRole: payload.actorRole || 'system',
        proofUrl: payload.proofUrl,
        proofFileName: payload.proofFileName,
        message: payload.message || 'Progress updated with proof',
      });
    }
  },
  addProof: async (payload: {
    batchId: string | number;
    actorRole?: string;
    proofUrl?: string;
    proofFileName?: string;
    message?: string;
  }) => {
    try {
      return await request<Batch>('/batch/proof', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    } catch {
      return addLocalProof({
        batchId: Number(payload.batchId),
        actorRole: payload.actorRole || 'institution',
        proofUrl: payload.proofUrl,
        proofFileName: payload.proofFileName,
        message: payload.message || 'Progress proof uploaded',
      });
    }
  },
  tracking: (batchId: string | number) =>
    request<{ batch: Batch; logs: TrackingLog[] }>(`/tracking/${batchId}`, undefined, {
      batch: getLocalBatches().find((batch) => batch.batchId === Number(batchId)) || demoBatches[0],
      logs: getLocalLogs(Number(batchId)),
    }),
  analytics: () => request<AnalyticsSummary>('/batch/analytics/summary', undefined, demoAnalytics),
  listUsers: () => request<UserProfile[]>('/users'),
  listRooms: () => request<Room[]>('/room', undefined, getLocalRooms()),
  ensurePrimaryRoom: (user?: UserProfile | null) => Promise.resolve(getPrimaryLocalRoom(user)),
  getRoom: (code: string) => request<Room | undefined>(`/room/${code}`, undefined, getLocalRoom(code)),
  createRoom: async (payload: unknown, user?: UserProfile | null) => {
    try {
      return await request<Room>('/room/create', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    } catch {
      return createLocalRoom({
        ...(payload as {
          name: string;
          roomName?: string;
          shipmentName?: string;
          shipmentTitle?: string;
          paperType?: string;
          estimatedWeight?: number;
          pickupLocation?: string;
          pickupDeadline?: string;
        }),
        institutionId: user?.id,
        createdByUid: user?.uid,
        memberName: user?.name,
        memberEmail: user?.email,
      });
    }
  },
  joinRoom: async (payload: unknown, user?: UserProfile | null) => {
    try {
      return await request<Room>('/room/join', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    } catch (error) {
      const token = getStoredAuthToken();
      if (token && !token.startsWith('local-demo-token-')) {
        const message = error instanceof Error ? error.message : '';
        if (message.includes('Failed to fetch')) {
          throw new Error('Backend API is not reachable. Start the backend on port 5001, then try joining again.');
        }
        throw error;
      }
      return joinLocalRoom({ ...(payload as { code: string }), userUid: user?.uid, memberName: user?.name, role: user?.role, email: user?.email });
    }
  },
  addRoomMember: async (code: string, member: string, method: 'email' | 'code' = 'email') => {
    try {
      return await request<Room>(`/room/${code}/members`, {
        method: 'POST',
        body: JSON.stringify({ member, method }),
      });
    } catch {
      return addLocalRoomMember(code, member, method);
    }
  },
  addRoomMessage: async (code: string, message: Omit<RoomMessage, 'id' | 'createdAt'>) => {
    try {
      return await request<Room>(`/room/${code}/messages`, {
        method: 'POST',
        body: JSON.stringify(message),
      });
    } catch {
      return addLocalRoomMessage(code, message);
    }
  },
  selectRecycler: async (code: string, recycler: RecyclerMatch) => {
    try {
      return await request<Room>(`/room/${code}/recycler`, {
        method: 'POST',
        body: JSON.stringify(recycler),
      });
    } catch {
      return selectLocalRecycler(code, recycler);
    }
  },
  updateRoomShipment: async (
    code: string,
    payload: {
      status: TrackingStatus;
      actor: string;
      role: Role;
      message: string;
      proofUrl?: string;
      proofFileName?: string;
      documentTitle?: string;
    }
  ) => {
    try {
      return await request<Room>(`/room/${code}/shipment`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    } catch {
      return updateLocalRoomShipment(code, payload);
    }
  },
  recyclerMatches: (location?: Room['pickupLocation'], minKm = 5, maxKm = 20): Promise<RecyclerMatch[]> =>
    Promise.resolve(getLocalRecyclerMatches(location, minKm, maxKm)),
  shipmentHistory: (): Promise<ShipmentHistoryItem[]> => Promise.resolve(getLocalShipmentHistory()),
};
