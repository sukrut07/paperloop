import mongoose, { Document, Schema } from 'mongoose';

export const TRACKING_STATUSES = [
  'Created',
  'Accepted',
  'PickupStarted',
  'PickedUp',
  'InTransit',
  'ReceivedAtPlant',
  'Processing',
  'Recycled',
  'BooksProduced',
  'SentToNGO',
  'ReceivedByNGO',
  'DistributionStarted',
  'Delivered',
  'Rejected',
] as const;

export type TrackingStatus = (typeof TRACKING_STATUSES)[number];
export type UserRole = 'institution' | 'recycler' | 'ngo' | 'admin';

const LocationSchema = new Schema(
  {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    address: { type: String },
  },
  { _id: false }
);

const VerificationSchema = new Schema(
  {
    status: { type: String, enum: ['verified'], default: 'verified' },
    verifiedBy: { type: String },
    verifiedRole: { type: String, enum: ['institution', 'recycler', 'ngo', 'admin'] },
    verifiedAt: { type: String },
  },
  { _id: false }
);

const RoomPartnerSchema = new Schema(
  {
    id: { type: String },
    name: { type: String, required: true },
    role: { type: String, enum: ['recycler', 'ngo'], required: true },
    email: { type: String },
    phone: { type: String },
    address: { type: String },
    rating: { type: Number },
    distanceKm: { type: Number },
    capacityKgPerDay: { type: Number },
  },
  { _id: false }
);

const RoomMemberSchema = new Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    role: { type: String, enum: ['institution', 'recycler', 'ngo', 'admin'], required: true },
    email: { type: String, required: true },
    phone: { type: String },
  },
  { _id: false }
);

const RoomMessageSchema = new Schema(
  {
    id: { type: String, required: true },
    author: { type: String, required: true },
    body: { type: String, required: true },
    kind: { type: String, enum: ['message', 'announcement', 'file', 'image'], default: 'message' },
    attachmentName: { type: String },
    attachmentUrl: { type: String },
    createdAt: { type: String, required: true },
  },
  { _id: false }
);

const RoomTimelineSchema = new Schema(
  {
    id: { type: String, required: true },
    actor: { type: String, required: true },
    role: { type: String, enum: ['institution', 'recycler', 'ngo', 'admin', 'system'], required: true },
    status: { type: String, enum: TRACKING_STATUSES },
    kind: { type: String, enum: ['status', 'invite', 'announcement', 'document', 'note', 'notification'], default: 'status' },
    message: { type: String, required: true },
    proofRequired: { type: Boolean },
    proofUrl: { type: String },
    proofFileName: { type: String },
    verification: VerificationSchema,
    createdAt: { type: String, required: true },
  },
  { _id: false }
);

const RoomDocumentSchema = new Schema(
  {
    id: { type: String, required: true },
    title: { type: String, required: true },
    ownerRole: { type: String, enum: ['institution', 'recycler', 'ngo', 'admin'], required: true },
    kind: { type: String, enum: ['institution-proof', 'recycler-proof', 'ngo-proof', 'delivery-proof'], required: true },
    url: { type: String },
    proofFileName: { type: String },
    uploadedBy: { type: String },
    uploadedAt: { type: String },
    shipmentId: { type: String },
    verification: VerificationSchema,
    createdAt: { type: String, required: true },
  },
  { _id: false }
);

const RoomNotificationSchema = new Schema(
  {
    id: { type: String, required: true },
    roomCode: { type: String, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    recipients: [{ type: String }],
    channel: { type: String, enum: ['email'], default: 'email' },
    emailStatus: { type: String, enum: ['queued', 'sent'], default: 'sent' },
    createdAt: { type: String, required: true },
  },
  { _id: false }
);

export interface IUser extends Document {
  uid: string;
  email: string;
  password?: string;
  role: UserRole;
  name: string;
  isVerified: boolean;
  isBlocked: boolean;
  phone?: string;
  institutionName?: string;
  location?: { lat: number; lng: number; address?: string };
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    uid: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, select: false },
    role: {
      type: String,
      enum: ['institution', 'recycler', 'ngo', 'admin'],
      required: true,
    },
    name: { type: String, required: true, trim: true },
    isVerified: { type: Boolean, default: false, index: true },
    isBlocked: { type: Boolean, default: false, index: true },
    phone: { type: String },
    institutionName: { type: String, trim: true },
    location: LocationSchema,
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>('User', UserSchema);

export interface IRoom extends Document {
  code: string;
  roomId?: string;
  name: string;
  institutionId: mongoose.Types.ObjectId;
  createdByUid: string;
  members: Array<string | Record<string, unknown>>;
  batches: number[];
  shipmentName?: string;
  shipmentTitle?: string;
  paperType?: string;
  estimatedWeight?: number;
  pickupLocation?: { lat: number; lng: number; address?: string };
  pickupDeadline?: string;
  shipmentStatus?: TrackingStatus;
  recyclerResponse?: 'pending' | 'accepted' | 'rejected';
  selectedRecycler?: Record<string, unknown>;
  selectedNgo?: Record<string, unknown>;
  selectedRecyclerId?: string;
  selectedNgoId?: string;
  invitedPeople?: string[];
  messages?: Record<string, unknown>[];
  timeline?: Record<string, unknown>[];
  documents?: Record<string, unknown>[];
  notifications?: Record<string, unknown>[];
  createdAt: Date;
  updatedAt: Date;
}

const RoomSchema = new Schema<IRoom>(
  {
    code: { type: String, required: true, unique: true, match: /^\d{6}$/ },
    roomId: { type: String, index: true },
    name: { type: String, required: true, trim: true },
    institutionId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    createdByUid: { type: String, required: true, index: true },
    members: [{ type: Schema.Types.Mixed }],
    batches: [{ type: Number, index: true }],
    shipmentName: { type: String, trim: true },
    shipmentTitle: { type: String, trim: true },
    paperType: { type: String, trim: true },
    estimatedWeight: { type: Number, min: 0 },
    pickupLocation: LocationSchema,
    pickupDeadline: { type: String },
    shipmentStatus: { type: String, enum: TRACKING_STATUSES, default: 'Created' },
    recyclerResponse: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
    selectedRecycler: RoomPartnerSchema,
    selectedNgo: RoomPartnerSchema,
    selectedRecyclerId: { type: String },
    selectedNgoId: { type: String },
    invitedPeople: [{ type: String }],
    messages: [RoomMessageSchema],
    timeline: [RoomTimelineSchema],
    documents: [RoomDocumentSchema],
    notifications: [RoomNotificationSchema],
  },
  { timestamps: true }
);

export const Room = mongoose.model<IRoom>('Room', RoomSchema);

export interface IBatch extends Document {
  batchId: number;
  institutionId: mongoose.Types.ObjectId;
  recyclerId?: mongoose.Types.ObjectId;
  ngoId?: mongoose.Types.ObjectId;
  title: string;
  paperType?: string;
  weight: number;
  pagesEstimate?: number;
  notebooksEstimate?: number;
  status: TrackingStatus;
  proofImages: string[];
  roomCode?: string;
  pickupLocation?: { lat: number; lng: number; address?: string };
  verifiedBy?: string;
  verifiedRole?: UserRole;
  verificationTimestamp?: string;
  proofUrl?: string;
  proofFileName?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BatchSchema = new Schema<IBatch>(
  {
    batchId: { type: Number, required: true, unique: true, index: true },
    institutionId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    recyclerId: { type: Schema.Types.ObjectId, ref: 'User' },
    ngoId: { type: Schema.Types.ObjectId, ref: 'User' },
    title: { type: String, required: true, trim: true },
    paperType: { type: String, trim: true },
    weight: { type: Number, required: true, min: 1 },
    pagesEstimate: { type: Number, default: 0 },
    notebooksEstimate: { type: Number, default: 0 },
    status: { type: String, enum: TRACKING_STATUSES, default: 'Created', index: true },
    proofImages: [{ type: String }],
    roomCode: { type: String, match: /^\d{6}$/ },
    pickupLocation: LocationSchema,
    verifiedBy: { type: String },
    verifiedRole: { type: String, enum: ['institution', 'recycler', 'ngo', 'admin'] },
    verificationTimestamp: { type: String },
    proofUrl: { type: String },
    proofFileName: { type: String },
  },
  { timestamps: true }
);

BatchSchema.index({ status: 1, createdAt: -1 });
BatchSchema.index({ 'pickupLocation.lat': 1, 'pickupLocation.lng': 1 });

export const Batch = mongoose.model<IBatch>('Batch', BatchSchema);

export interface ITrackingLog extends Document {
  batchId: number;
  status: TrackingStatus;
  actorRole: UserRole | 'system';
  message: string;
  proofUrl?: string;
  proofFileName?: string;
  verifiedBy?: string;
  verifiedRole?: UserRole;
  verificationTimestamp?: string;
  location?: { lat: number; lng: number; address?: string };
  createdAt: Date;
}

const TrackingLogSchema = new Schema<ITrackingLog>(
  {
    batchId: { type: Number, required: true, index: true },
    status: { type: String, enum: TRACKING_STATUSES, required: true },
    actorRole: {
      type: String,
      enum: ['institution', 'recycler', 'ngo', 'admin', 'system'],
      required: true,
    },
    message: { type: String, required: true },
    proofUrl: { type: String },
    proofFileName: { type: String },
    verifiedBy: { type: String },
    verifiedRole: { type: String, enum: ['institution', 'recycler', 'ngo', 'admin'] },
    verificationTimestamp: { type: String },
    location: LocationSchema,
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const TrackingLog = mongoose.model<ITrackingLog>('TrackingLog', TrackingLogSchema);

export interface IRecycler extends Document {
  userId: mongoose.Types.ObjectId;
  plantName: string;
  capacityKgPerDay: number;
  serviceRadiusKm: number;
  location: { lat: number; lng: number; address?: string };
  verified: boolean;
}

const RecyclerSchema = new Schema<IRecycler>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    plantName: { type: String, required: true },
    capacityKgPerDay: { type: Number, default: 500 },
    serviceRadiusKm: { type: Number, default: 25 },
    location: LocationSchema,
    verified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Recycler = mongoose.model<IRecycler>('Recycler', RecyclerSchema);

export interface INGO extends Document {
  userId: mongoose.Types.ObjectId;
  organizationName: string;
  studentsServed: number;
  location: { lat: number; lng: number; address?: string };
  verified: boolean;
}

const NGOSchema = new Schema<INGO>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    organizationName: { type: String, required: true },
    studentsServed: { type: Number, default: 0 },
    location: LocationSchema,
    verified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const NGO = mongoose.model<INGO>('NGO', NGOSchema);

export interface IImpactReport extends Document {
  batchId?: number;
  ownerId: mongoose.Types.ObjectId;
  paperKg: number;
  notebooksCreated: number;
  studentsImpacted: number;
  treesSavedEstimate: number;
  waterSavedLitresEstimate: number;
  co2SavedKgEstimate: number;
}

const ImpactReportSchema = new Schema<IImpactReport>(
  {
    batchId: { type: Number, index: true },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    paperKg: { type: Number, required: true },
    notebooksCreated: { type: Number, required: true },
    studentsImpacted: { type: Number, default: 0 },
    treesSavedEstimate: { type: Number, required: true },
    waterSavedLitresEstimate: { type: Number, required: true },
    co2SavedKgEstimate: { type: Number, required: true },
  },
  { timestamps: true }
);

export const ImpactReport = mongoose.model<IImpactReport>('ImpactReport', ImpactReportSchema);

export { VerificationSchema };
