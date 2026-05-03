import type { AnalyticsSummary, Batch, Room, TrackingLog } from './types';
import { demoAnalytics, demoBatches, demoLogs } from './demo';
import {
  createLocalRoom,
  addLocalProof,
  createLocalBatch,
  getLocalBatches,
  getLocalLogs,
  joinLocalRoom,
  transitionLocalBatch,
} from './localStore';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

async function request<T>(path: string, options?: RequestInit, fallback?: T): Promise<T> {
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers || {}),
      },
      cache: 'no-store',
    });

    if (!response.ok) throw new Error(await response.text());
    return response.json() as Promise<T>;
  } catch (error) {
    if (fallback !== undefined) return fallback;
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
    request<{ batch: Batch; chainBatch?: unknown }>(`/batch/${batchId}`, undefined, {
      batch: getLocalBatches().find((batch) => batch.batchId === Number(batchId)) || demoBatches[0],
    }),
  prepareBatchIPFS: (payload: unknown) =>
    request<{ ipfsHash: string; metadata: unknown }>('/batch/ipfs', {
      method: 'POST',
      body: JSON.stringify(payload),
    }, {
      ipfsHash: `local-${Date.now().toString(36)}`,
      metadata: payload,
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
  transitionBatch: async (action: 'accept' | 'pickup' | 'transit' | 'receive' | 'recycle' | 'distribute', payload: any) => {
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
                  ? 'Received'
                  : action === 'recycle'
                    ? 'Recycled'
                    : payload.finalDelivery
                      ? 'Delivered'
                      : 'SentToNGO',
        actorRole: payload.actorRole || 'system',
        actorWallet: payload.actorWallet,
        txHash: payload.txHash,
        proofHash: payload.proofHash,
        message: payload.message || 'Progress updated with proof',
      });
    }
  },
  addProof: async (payload: any) => {
    try {
      return await request<Batch>('/batch/proof', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    } catch {
      return addLocalProof({
        batchId: Number(payload.batchId),
        actorRole: payload.actorRole || 'teacher',
        actorWallet: payload.actorWallet,
        proofHash: payload.proofHash,
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
  createRoom: async (payload: unknown) => {
    try {
      return await request<Room>('/room/create', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    } catch {
      return createLocalRoom(payload as { name: string; institutionId: string; createdByUid: string });
    }
  },
  joinRoom: async (payload: unknown) => {
    try {
      return await request<Room>('/room/join', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    } catch {
      return joinLocalRoom(payload as { code: string; userUid: string });
    }
  },
};
