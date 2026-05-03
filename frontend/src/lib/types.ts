export type TrackingStatus =
  | 'Created'
  | 'Accepted'
  | 'PickedUp'
  | 'InTransit'
  | 'Received'
  | 'Recycled'
  | 'SentToNGO'
  | 'Delivered';

export type Role = 'teacher' | 'institution_admin' | 'recycler' | 'ngo_admin';

export interface Batch {
  _id?: string;
  batchId: number;
  title: string;
  institutionId?: string;
  institutionWallet: string;
  recyclerWallet?: string;
  ngoWallet?: string;
  weight: number;
  pagesEstimate?: number;
  notebooksEstimate?: number;
  status: TrackingStatus;
  ipfsHash: string;
  roomCode?: string;
  proofImages?: string[];
  pickupLocation?: {
    lat: number;
    lng: number;
    address?: string;
  };
  txHashes?: Record<string, string>;
  createdAt?: string;
  updatedAt?: string;
}

export interface TrackingLog {
  _id?: string;
  batchId: number;
  status: TrackingStatus;
  actorRole: string;
  actorWallet?: string;
  txHash?: string;
  proofHash?: string;
  message: string;
  createdAt: string;
}

export interface Room {
  _id: string;
  code: string;
  name: string;
  institutionId: string;
  createdByUid: string;
  members: string[];
  batches: number[];
}

export interface AnalyticsSummary {
  statusCounts: Array<{ _id: TrackingStatus; count: number; weight: number }>;
  impact: {
    paperKg: number;
    notebooksCreated: number;
    studentsImpacted: number;
    treesSavedEstimate: number;
    waterSavedLitresEstimate: number;
    co2SavedKgEstimate: number;
  };
}
