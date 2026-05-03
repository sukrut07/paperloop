import mongoose, { Document, Schema } from 'mongoose';

export const TRACKING_STATUSES = [
  'Created',
  'Accepted',
  'PickedUp',
  'InTransit',
  'Received',
  'Recycled',
  'SentToNGO',
  'Delivered',
] as const;

export type TrackingStatus = (typeof TRACKING_STATUSES)[number];
export type UserRole = 'teacher' | 'institution_admin' | 'recycler' | 'ngo_admin' | 'admin';

const LocationSchema = new Schema(
  {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    address: { type: String },
  },
  { _id: false }
);

export interface IUser extends Document {
  uid: string;
  email: string;
  role: UserRole;
  name: string;
  phone?: string;
  walletAddress?: string;
  institutionName?: string;
  location?: { lat: number; lng: number; address?: string };
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    uid: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    role: {
      type: String,
      enum: ['teacher', 'institution_admin', 'recycler', 'ngo_admin', 'admin'],
      required: true,
    },
    name: { type: String, required: true, trim: true },
    phone: { type: String },
    walletAddress: { type: String, lowercase: true, index: true },
    institutionName: { type: String, trim: true },
    location: LocationSchema,
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>('User', UserSchema);

export interface IRoom extends Document {
  code: string;
  name: string;
  institutionId: mongoose.Types.ObjectId;
  createdByUid: string;
  members: string[];
  batches: number[];
  createdAt: Date;
  updatedAt: Date;
}

const RoomSchema = new Schema<IRoom>(
  {
    code: { type: String, required: true, unique: true, match: /^\d{6}$/ },
    name: { type: String, required: true, trim: true },
    institutionId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    createdByUid: { type: String, required: true, index: true },
    members: [{ type: String, index: true }],
    batches: [{ type: Number, index: true }],
  },
  { timestamps: true }
);

export const Room = mongoose.model<IRoom>('Room', RoomSchema);

export interface IBatch extends Document {
  batchId: number;
  institutionId: mongoose.Types.ObjectId;
  institutionWallet: string;
  recyclerId?: mongoose.Types.ObjectId;
  recyclerWallet?: string;
  ngoId?: mongoose.Types.ObjectId;
  ngoWallet?: string;
  title: string;
  weight: number;
  pagesEstimate?: number;
  notebooksEstimate?: number;
  status: TrackingStatus;
  ipfsHash: string;
  proofImages: string[];
  roomCode?: string;
  pickupLocation?: { lat: number; lng: number; address?: string };
  txHashes: {
    created?: string;
    accepted?: string;
    pickedUp?: string;
    received?: string;
    recycled?: string;
    sentToNgo?: string;
    delivered?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const BatchSchema = new Schema<IBatch>(
  {
    batchId: { type: Number, required: true, unique: true, index: true },
    institutionId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    institutionWallet: { type: String, required: true, lowercase: true },
    recyclerId: { type: Schema.Types.ObjectId, ref: 'User' },
    recyclerWallet: { type: String, lowercase: true },
    ngoId: { type: Schema.Types.ObjectId, ref: 'User' },
    ngoWallet: { type: String, lowercase: true },
    title: { type: String, required: true, trim: true },
    weight: { type: Number, required: true, min: 1 },
    pagesEstimate: { type: Number, default: 0 },
    notebooksEstimate: { type: Number, default: 0 },
    status: { type: String, enum: TRACKING_STATUSES, default: 'Created', index: true },
    ipfsHash: { type: String, required: true },
    proofImages: [{ type: String }],
    roomCode: { type: String, match: /^\d{6}$/ },
    pickupLocation: LocationSchema,
    txHashes: {
      created: String,
      accepted: String,
      pickedUp: String,
      received: String,
      recycled: String,
      sentToNgo: String,
      delivered: String,
    },
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
  actorWallet?: string;
  txHash?: string;
  message: string;
  location?: { lat: number; lng: number; address?: string };
  createdAt: Date;
}

const TrackingLogSchema = new Schema<ITrackingLog>(
  {
    batchId: { type: Number, required: true, index: true },
    status: { type: String, enum: TRACKING_STATUSES, required: true },
    actorRole: {
      type: String,
      enum: ['teacher', 'institution_admin', 'recycler', 'ngo_admin', 'admin', 'system'],
      required: true,
    },
    actorWallet: { type: String, lowercase: true },
    txHash: { type: String },
    message: { type: String, required: true },
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
