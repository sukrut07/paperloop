import type { AnalyticsSummary, Batch, Room, TrackingLog } from './types';
import { demoAnalytics, demoBatches, demoLogs } from './demo';

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
    request<Batch[]>(`/batch${status ? `?status=${status}` : ''}`, undefined, demoBatches),
  availableBatches: () => request<Batch[]>('/batch/available', undefined, demoBatches.filter((b) => b.status === 'Created')),
  recycledBatches: () => request<Batch[]>('/batch/recycled', undefined, demoBatches.filter((b) => b.status === 'Recycled')),
  getBatch: (batchId: string | number) =>
    request<{ batch: Batch; chainBatch?: unknown }>(`/batch/${batchId}`, undefined, {
      batch: demoBatches.find((batch) => batch.batchId === Number(batchId)) || demoBatches[0],
    }),
  prepareBatchIPFS: (payload: unknown) =>
    request<{ ipfsHash: string; metadata: unknown }>('/batch/ipfs', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  createBatch: (payload: unknown) =>
    request<Batch>('/batch/create', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  transitionBatch: (action: 'accept' | 'pickup' | 'receive' | 'recycle' | 'distribute', payload: unknown) =>
    request<Batch>(`/batch/${action}`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  tracking: (batchId: string | number) =>
    request<{ batch: Batch; logs: TrackingLog[] }>(`/tracking/${batchId}`, undefined, {
      batch: demoBatches.find((batch) => batch.batchId === Number(batchId)) || demoBatches[0],
      logs: demoLogs,
    }),
  analytics: () => request<AnalyticsSummary>('/batch/analytics/summary', undefined, demoAnalytics),
  createRoom: (payload: unknown) =>
    request<Room>('/room/create', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  joinRoom: (payload: unknown) =>
    request<Room>('/room/join', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};
