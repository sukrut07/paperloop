import { Request, Response } from 'express';
import mongoose from 'mongoose';
import {
  Batch,
  IBatch,
  ImpactReport,
  Room,
  TrackingLog,
  TrackingStatus,
  User,
  UserRole,
} from '../models';
import { readOnChainBatch } from '../services/blockchain';
import { uploadToIPFS } from '../services/pinata';
import { estimateImpact, estimatePages } from '../utils/impact';

const statusMessages: Record<TrackingStatus, string> = {
  Created: 'Paper batch created by institution',
  Accepted: 'Pickup accepted by recycling plant',
  PickedUp: 'Paper collected from institution',
  InTransit: 'Batch is moving to the recycling plant',
  Received: 'Recycling plant received the batch',
  Recycled: 'Paper recycled into notebook stock',
  SentToNGO: 'Notebook stock accepted by NGO',
  Delivered: 'NGO confirmed distribution to students',
};

const txKeyByStatus: Partial<Record<TrackingStatus, keyof IBatch['txHashes']>> = {
  Created: 'created',
  Accepted: 'accepted',
  PickedUp: 'pickedUp',
  Received: 'received',
  Recycled: 'recycled',
  SentToNGO: 'sentToNgo',
  Delivered: 'delivered',
};

function asObjectId(id?: string) {
  return id && mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : undefined;
}

async function addTrackingLog(params: {
  batchId: number;
  status: TrackingStatus;
  actorRole: UserRole | 'system';
  actorWallet?: string;
  txHash?: string;
  message?: string;
  location?: { lat: number; lng: number; address?: string };
}) {
  return TrackingLog.create({
    ...params,
    message: params.message || statusMessages[params.status],
  });
}

async function updateBatchTransition(req: Request, res: Response, status: TrackingStatus) {
  try {
    const { batchId, actorId, actorWallet, txHash, message, location } = req.body;
    const batch = await Batch.findOne({ batchId: Number(batchId) });
    if (!batch) return res.status(404).json({ error: 'Batch not found' });

    const txKey = txKeyByStatus[status];
    batch.status = status;
    if (txKey && txHash) {
      batch.txHashes[txKey] = txHash;
    }

    const actorObjectId = asObjectId(actorId);
    if (status === 'Accepted' || status === 'PickedUp' || status === 'Received' || status === 'Recycled') {
      if (actorObjectId) batch.recyclerId = actorObjectId;
      if (actorWallet) batch.recyclerWallet = actorWallet.toLowerCase();
    }

    if (status === 'SentToNGO' || status === 'Delivered') {
      if (actorObjectId) batch.ngoId = actorObjectId;
      if (actorWallet) batch.ngoWallet = actorWallet.toLowerCase();
    }

    await batch.save();
    await addTrackingLog({
      batchId: batch.batchId,
      status,
      actorRole: status === 'SentToNGO' || status === 'Delivered' ? 'ngo_admin' : 'recycler',
      actorWallet,
      txHash,
      message,
      location,
    });

    if (status === 'Delivered') {
      const impact = estimateImpact(batch.weight);
      await ImpactReport.findOneAndUpdate(
        { batchId: batch.batchId },
        {
          batchId: batch.batchId,
          ownerId: batch.ngoId || batch.institutionId,
          paperKg: batch.weight,
          ...impact,
        },
        { upsert: true, new: true }
      );
    }

    return res.json(batch);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export const prepareBatchIPFS = async (req: Request, res: Response) => {
  try {
    const {
      title,
      institutionId,
      institutionWallet,
      weight,
      roomCode,
      pickupLocation,
      proofImages = [],
      notes,
    } = req.body;

    const metadata = {
      app: 'Paperloop',
      title,
      institutionId,
      institutionWallet,
      weight: Number(weight),
      pagesEstimate: estimatePages(Number(weight)),
      impact: estimateImpact(Number(weight)),
      roomCode,
      pickupLocation,
      proofImages,
      notes,
      createdAt: new Date().toISOString(),
    };

    const ipfsHash = await uploadToIPFS(metadata);
    return res.status(201).json({ ipfsHash, metadata });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const createBatch = async (req: Request, res: Response) => {
  try {
    const {
      batchId,
      institutionId,
      institutionWallet,
      title,
      weight,
      roomCode,
      pickupLocation,
      proofImages = [],
      ipfsHash,
      txHash,
    } = req.body;

    if (!batchId || !institutionId || !institutionWallet || !weight || !ipfsHash) {
      return res.status(400).json({
        error: 'batchId, institutionId, institutionWallet, weight, and ipfsHash are required',
      });
    }

    const impact = estimateImpact(Number(weight));
    const batch = await Batch.findOneAndUpdate(
      { batchId: Number(batchId) },
      {
        batchId: Number(batchId),
        institutionId,
        institutionWallet: institutionWallet.toLowerCase(),
        title: title || `Paper batch ${batchId}`,
        weight: Number(weight),
        pagesEstimate: estimatePages(Number(weight)),
        notebooksEstimate: impact.notebooksCreated,
        status: 'Created',
        ipfsHash,
        proofImages,
        roomCode,
        pickupLocation,
        txHashes: { created: txHash },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    if (roomCode) {
      await Room.findOneAndUpdate({ code: roomCode }, { $addToSet: { batches: Number(batchId) } });
    }

    await addTrackingLog({
      batchId: Number(batchId),
      status: 'Created',
      actorRole: 'institution_admin',
      actorWallet: institutionWallet,
      txHash,
      location: pickupLocation,
    });

    await ImpactReport.findOneAndUpdate(
      { batchId: Number(batchId) },
      {
        batchId: Number(batchId),
        ownerId: institutionId,
        paperKg: Number(weight),
        ...impact,
      },
      { upsert: true, new: true }
    );

    return res.status(201).json(batch);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const getBatch = async (req: Request, res: Response) => {
  try {
    const batchId = Number(req.params.id);
    const [batch, chainBatch] = await Promise.all([
      Batch.findOne({ batchId }).populate('institutionId recyclerId ngoId'),
      readOnChainBatch(batchId).catch(() => null),
    ]);

    if (!batch) return res.status(404).json({ error: 'Batch not found' });
    return res.json({ batch, chainBatch });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const listBatches = async (req: Request, res: Response) => {
  try {
    const status = req.query.status as TrackingStatus | undefined;
    const filter: Record<string, unknown> = status ? { status } : {};
    const batches = await Batch.find(filter).sort({ createdAt: -1 }).limit(50);
    return res.json(batches);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const getAvailableBatches = async (_req: Request, res: Response) => {
  try {
    const batches = await Batch.find({ status: 'Created' }).sort({ createdAt: -1 }).limit(50);
    return res.json(batches);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const getRecycledBatches = async (_req: Request, res: Response) => {
  try {
    const batches = await Batch.find({ status: 'Recycled' }).sort({ updatedAt: -1 }).limit(50);
    return res.json(batches);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const acceptBatch = (req: Request, res: Response) => updateBatchTransition(req, res, 'Accepted');
export const pickupBatch = (req: Request, res: Response) => updateBatchTransition(req, res, 'PickedUp');
export const receiveBatch = (req: Request, res: Response) => updateBatchTransition(req, res, 'Received');
export const recycleBatch = (req: Request, res: Response) => updateBatchTransition(req, res, 'Recycled');
export const distributeBatch = (req: Request, res: Response) => {
  const targetStatus: TrackingStatus = req.body.finalDelivery ? 'Delivered' : 'SentToNGO';
  return updateBatchTransition(req, res, targetStatus);
};

export const getTracking = async (req: Request, res: Response) => {
  try {
    const batchId = Number(req.params.batchId);
    const [batch, logs] = await Promise.all([
      Batch.findOne({ batchId }),
      TrackingLog.find({ batchId }).sort({ createdAt: 1 }),
    ]);

    if (!batch) return res.status(404).json({ error: 'Batch not found' });
    return res.json({ batch, logs });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const getAnalytics = async (_req: Request, res: Response) => {
  try {
    const [statusCounts, reports] = await Promise.all([
      Batch.aggregate([{ $group: { _id: '$status', count: { $sum: 1 }, weight: { $sum: '$weight' } } }]),
      ImpactReport.aggregate([
        {
          $group: {
            _id: null,
            paperKg: { $sum: '$paperKg' },
            notebooksCreated: { $sum: '$notebooksCreated' },
            studentsImpacted: { $sum: '$studentsImpacted' },
            treesSavedEstimate: { $sum: '$treesSavedEstimate' },
            waterSavedLitresEstimate: { $sum: '$waterSavedLitresEstimate' },
            co2SavedKgEstimate: { $sum: '$co2SavedKgEstimate' },
          },
        },
      ]),
    ]);

    return res.json({
      statusCounts,
      impact: reports[0] || {
        paperKg: 0,
        notebooksCreated: 0,
        studentsImpacted: 0,
        treesSavedEstimate: 0,
        waterSavedLitresEstimate: 0,
        co2SavedKgEstimate: 0,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const seedDemoData = async (_req: Request, res: Response) => {
  try {
    const institution = await User.findOneAndUpdate(
      { uid: 'demo-institution' },
      {
        uid: 'demo-institution',
        email: 'admin@paperloop.edu',
        role: 'institution_admin',
        name: 'Paperloop Public School',
        walletAddress: '0x0000000000000000000000000000000000000001',
      },
      { upsert: true, new: true }
    );

    await Batch.findOneAndUpdate(
      { batchId: 101 },
      {
        batchId: 101,
        institutionId: institution._id,
        institutionWallet: institution.walletAddress,
        title: 'Semester answer sheets',
        weight: 85,
        pagesEstimate: estimatePages(85),
        notebooksEstimate: estimateImpact(85).notebooksCreated,
        status: 'InTransit',
        ipfsHash: 'local-demo-ipfs-hash',
        proofImages: [],
        pickupLocation: { lat: 19.076, lng: 72.8777, address: 'Mumbai, Maharashtra' },
        txHashes: { created: '0xdemo' },
      },
      { upsert: true, new: true }
    );

    return res.json({ ok: true });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};
