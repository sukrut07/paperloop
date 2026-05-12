export type TrackingStatus =
  | 'Created'
  | 'Accepted'
  | 'PickupStarted'
  | 'PickedUp'
  | 'InTransit'
  | 'ReceivedAtPlant'
  | 'Processing'
  | 'Recycled'
  | 'BooksProduced'
  | 'SentToNGO'
  | 'ReceivedByNGO'
  | 'DistributionStarted'
  | 'Delivered'
  | 'Rejected';

export type Role = 'institution' | 'recycler' | 'ngo' | 'admin';

export interface VerificationRecord {
  status: 'verified';
  verifiedBy: string;
  verifiedRole: Role;
  verifiedAt: string;
}

export interface UserProfile {
  id: string;
  uid: string;
  name: string;
  email: string;
  role: Role;
  isVerified: boolean;
  institutionName?: string;
  organizationName?: string;
  phone?: string;
  createdAt?: string;
}

export interface ProofAsset {
  id: string;
  proofUrl: string;
  proofType: string;
  proofFileName?: string;
  uploadedBy: string;
  uploadedRole: Role;
  uploadedAt: string;
  shipmentId?: string;
  verification?: VerificationRecord;
}

export interface Batch {
  _id?: string;
  batchId: number;
  title: string;
  paperType?: string;
  institutionId?: string;
  recyclerId?: string;
  ngoId?: string;
  weight: number;
  pagesEstimate?: number;
  notebooksEstimate?: number;
  status: TrackingStatus;
  roomCode?: string;
  proofImages?: string[];
  proofs?: ProofAsset[];
  proofUrl?: string;
  proofFileName?: string;
  verifiedBy?: string;
  verifiedRole?: Role;
  verificationTimestamp?: string;
  pickupLocation?: {
    lat: number;
    lng: number;
    address?: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface TrackingLog {
  _id?: string;
  batchId: number;
  status: TrackingStatus;
  actorRole: string;
  message: string;
  proofUrl?: string;
  proofFileName?: string;
  verifiedBy?: string;
  verifiedRole?: Role;
  verificationTimestamp?: string;
  createdAt: string;
}

export interface RoomPartner {
  id: string;
  name: string;
  role: 'recycler' | 'ngo';
  email?: string;
  phone?: string;
  address?: string;
  rating?: number;
  distanceKm?: number;
  capacityKgPerDay?: number;
}

export interface RoomMessage {
  id: string;
  author: string;
  body: string;
  kind?: 'message' | 'announcement' | 'file' | 'image';
  attachmentName?: string;
  attachmentUrl?: string;
  createdAt: string;
}

export interface RoomMember {
  id: string;
  name: string;
  role: Role;
  email: string;
  phone?: string;
}

export interface RoomTimelineItem {
  id: string;
  actor: string;
  role: Role | 'system';
  status?: TrackingStatus;
  kind?: 'status' | 'invite' | 'announcement' | 'document' | 'note' | 'notification';
  message: string;
  proofRequired?: boolean;
  proofUrl?: string;
  proofFileName?: string;
  verification?: VerificationRecord;
  createdAt: string;
}

export interface RoomDocument {
  id: string;
  title: string;
  ownerRole: Role;
  kind: 'institution-proof' | 'recycler-proof' | 'ngo-proof' | 'delivery-proof';
  url?: string;
  proofFileName?: string;
  uploadedBy?: string;
  uploadedAt?: string;
  shipmentId?: string;
  verification?: VerificationRecord;
  createdAt: string;
}

export interface RoomNotification {
  id: string;
  roomCode: string;
  title: string;
  message: string;
  recipients: string[];
  channel: 'email';
  emailStatus: 'queued' | 'sent';
  createdAt: string;
}

export interface Room {
  _id: string;
  code: string;
  roomId?: string;
  name: string;
  institutionId: string;
  createdByUid: string;
  members: Array<string | RoomMember>;
  batches: number[];
  shipmentName?: string;
  shipmentTitle?: string;
  paperType?: string;
  estimatedWeight?: number;
  pickupLocation?: {
    lat?: number;
    lng?: number;
    address?: string;
  };
  pickupDeadline?: string;
  shipmentStatus?: TrackingStatus;
  recyclerResponse?: 'pending' | 'accepted' | 'rejected';
  selectedRecycler?: RoomPartner;
  selectedNgo?: RoomPartner;
  selectedRecyclerId?: string;
  selectedNgoId?: string;
  invitedPeople?: string[];
  messages?: RoomMessage[];
  timeline?: RoomTimelineItem[];
  documents?: RoomDocument[];
  notifications?: RoomNotification[];
  createdAt?: string;
  updatedAt?: string;
}

export interface RecyclerMatch {
  id: string;
  name: string;
  contactName?: string;
  rating: number;
  distanceKm: number;
  phone: string;
  email?: string;
  capacityKgPerDay: number;
  address: string;
  isCustom?: boolean;
  notes?: string;
}

export interface ShipmentHistoryItem {
  id: string;
  roomName: string;
  shipmentName: string;
  recyclerDetails: string;
  ngoDetails: string;
  totalWeight: number;
  deliveryProof: string;
  verificationSummary: string;
  completedAt: string;
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
