import mongoose, { Schema, Document } from 'mongoose';

// --- USER MODEL ---
export interface IUser extends Document {
  uid: string;
  email: string;
  role: 'institution' | 'recycler' | 'ngo' | 'admin';
  name: string;
  walletAddress?: string;
  institutionDetails?: {
    address: string;
    contactPerson: string;
  };
  recyclerDetails?: {
    location: {
      lat: number;
      lng: number;
    };
    capacity: number;
  };
  ngoDetails?: {
    focusArea: string;
  };
  createdAt: Date;
}

const UserSchema: Schema = new Schema({
  uid: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  role: { type: String, enum: ['institution', 'recycler', 'ngo', 'admin'], required: true },
  name: { type: String, required: true },
  walletAddress: { type: String },
  institutionDetails: {
    address: String,
    contactPerson: String,
  },
  recyclerDetails: {
    location: {
      lat: Number,
      lng: Number,
    },
    capacity: Number,
  },
  ngoDetails: {
    focusArea: String,
  },
  createdAt: { type: Date, default: Date.now },
});

export const User = mongoose.model<IUser>('User', UserSchema);

// --- BATCH MODEL ---
export interface IBatch extends Document {
  blockchainId: number;
  institutionId: mongoose.Types.ObjectId;
  recyclerId?: mongoose.Types.ObjectId;
  ngoId?: mongoose.Types.ObjectId;
  weight: number;
  status: string;
  ipfsHash: string;
  roomCode?: string;
  proofImages: string[];
  createdAt: Date;
}

const BatchSchema: Schema = new Schema({
  blockchainId: { type: Number, required: true, unique: true },
  institutionId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  recyclerId: { type: Schema.Types.ObjectId, ref: 'User' },
  ngoId: { type: Schema.Types.ObjectId, ref: 'User' },
  weight: { type: Number, required: true },
  status: { type: String, required: true },
  ipfsHash: { type: String, required: true },
  roomCode: { type: String },
  proofImages: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
});

export const Batch = mongoose.model<IBatch>('Batch', BatchSchema);

// --- ROOM MODEL ---
export interface IRoom extends Document {
  code: string;
  institutionId: mongoose.Types.ObjectId;
  name: string;
  members: string[]; // Firebase UIDs
  batches: number[]; // Blockchain IDs
  createdAt: Date;
}

const RoomSchema: Schema = new Schema({
  code: { type: String, required: true, unique: true },
  institutionId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  members: [{ type: String }],
  batches: [{ type: Number }],
  createdAt: { type: Date, default: Date.now },
});

export const Room = mongoose.model<IRoom>('Room', RoomSchema);

// --- TRACKING LOG MODEL ---
export interface ITrackingLog extends Document {
  batchId: number;
  status: string;
  timestamp: Date;
  location?: {
    lat: number;
    lng: number;
  };
  message: string;
}

const TrackingLogSchema: Schema = new Schema({
  batchId: { type: Number, required: true },
  status: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  location: {
    lat: Number,
    lng: Number,
  },
  message: { type: String },
});

export const TrackingLog = mongoose.model<ITrackingLog>('TrackingLog', TrackingLogSchema);
