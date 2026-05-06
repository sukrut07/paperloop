import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Batch, ImpactReport, Room, TrackingLog, TrackingStatus, User, UserRole } from '../models';
import { estimateImpact, estimatePages } from '../utils/impact';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

const statusMessages: Record<TrackingStatus, string> = {
  Created: 'Paper batch created by institution',
  Accepted: 'Pickup accepted by recycling plant',
  PickupStarted: 'Recycler started the pickup process',
  PickedUp: 'Paper collected from institution',
  InTransit: 'Batch is moving to the recycling plant',
  ReceivedAtPlant: 'Recycling plant received the batch',
  Processing: 'Paper processing is underway at the plant',
  Recycled: 'Paper recycled into notebook stock',
  BooksProduced: 'Notebook production completed',
  SentToNGO: 'Notebook stock accepted by NGO',
  ReceivedByNGO: 'NGO received notebook delivery',
  DistributionStarted: 'NGO started notebook distribution',
  Delivered: 'NGO confirmed distribution to students',
  Rejected: 'Recycler rejected the shipment request',
};

function verificationFor(actor: string, role: UserRole) {
  return {
    verifiedBy: actor,
    verifiedRole: role,
    verificationTimestamp: new Date().toISOString(),
  };
}

function actorName(req: AuthenticatedRequest) {
  return req.authUser?.institutionName || req.authUser?.name || 'Paperloop member';
}

async function addTrackingLog(params: {
  batchId: number;
  status: TrackingStatus;
  actorRole: UserRole | 'system';
  message?: string;
  proofUrl?: string;
  proofFileName?: string;
  verifiedBy?: string;
  verifiedRole?: UserRole;
  verificationTimestamp?: string;
  location?: { lat: number; lng: number; address?: string };
}) {
  return TrackingLog.create({
    ...params,
    message: params.message || statusMessages[params.status],
  });
}

async function updateBatchTransition(req: AuthenticatedRequest, res: Response, status: TrackingStatus) {
  try {
    const { batchId, proofUrl, proofFileName, message, location } = req.body;
    const batch = await Batch.findOne({ batchId: Number(batchId) });
    if (!batch) return res.status(404).json({ error: 'Batch not found' });

    const role = (req.authUser?.role || (status === 'SentToNGO' || status === 'Delivered' ? 'ngo' : 'recycler')) as UserRole;
    const verification = verificationFor(actorName(req), role);

    batch.status = status;
    batch.proofUrl = proofUrl || batch.proofUrl;
    batch.proofFileName = proofFileName || batch.proofFileName;
    batch.verifiedBy = verification.verifiedBy;
    batch.verifiedRole = verification.verifiedRole;
    batch.verificationTimestamp = verification.verificationTimestamp;

    if (status === 'Accepted' || status === 'PickupStarted' || status === 'PickedUp' || status === 'ReceivedAtPlant' || status === 'Processing' || status === 'Recycled' || status === 'BooksProduced') {
      if (req.authUser?._id) batch.recyclerId = req.authUser._id as mongoose.Types.ObjectId;
    }

    if (status === 'SentToNGO' || status === 'Delivered' || status === 'ReceivedByNGO' || status === 'DistributionStarted') {
      if (req.authUser?._id) batch.ngoId = req.authUser._id as mongoose.Types.ObjectId;
    }

    await batch.save();
    await addTrackingLog({
      batchId: batch.batchId,
      status,
      actorRole: role,
      proofUrl,
      proofFileName,
      message,
      location,
      ...verification,
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

export const uploadProofAsset = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { proofImages = [], proofType = 'proof', proofFileName } = req.body;
    const proofUrl = Array.isArray(proofImages) && proofImages.length ? String(proofImages[0]) : '';

    return res.status(201).json({
      proofUrl,
      proofType,
      proofFileName: proofFileName || 'proof-upload',
      uploadedAt: new Date().toISOString(),
      uploadedBy: actorName(req),
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const createBatch = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { batchId, title, weight, roomCode, pickupLocation, proofImages = [], proofUrl, proofFileName, paperType } = req.body;

    if (!batchId || !weight || !req.authUser?._id) {
      return res.status(400).json({
        error: 'batchId, weight, and authentication are required',
      });
    }

    const verification = verificationFor(actorName(req), 'institution');
    const impact = estimateImpact(Number(weight));
    const batch = await Batch.findOneAndUpdate(
      { batchId: Number(batchId) },
      {
        batchId: Number(batchId),
        institutionId: req.authUser._id,
        title: title || `Paper batch ${batchId}`,
        weight: Number(weight),
        paperType,
        pagesEstimate: estimatePages(Number(weight)),
        notebooksEstimate: impact.notebooksCreated,
        status: 'Created',
        proofImages,
        roomCode,
        pickupLocation,
        proofUrl: proofUrl || proofImages[0],
        proofFileName: proofFileName || 'initial-proof',
        ...verification,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    if (roomCode) {
      await Room.findOneAndUpdate({ code: roomCode }, { $addToSet: { batches: Number(batchId) } });
    }

    await addTrackingLog({
      batchId: Number(batchId),
      status: 'Created',
      actorRole: 'institution',
      location: pickupLocation,
      proofUrl: proofUrl || proofImages[0],
      proofFileName: proofFileName || 'initial-proof',
      ...verification,
    });

    await ImpactReport.findOneAndUpdate(
      { batchId: Number(batchId) },
      {
        batchId: Number(batchId),
        ownerId: req.authUser._id,
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
    const batch = await Batch.findOne({ batchId }).populate('institutionId recyclerId ngoId');

    if (!batch) return res.status(404).json({ error: 'Batch not found' });
    return res.json({ batch });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const listBatches = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const status = req.query.status as TrackingStatus | undefined;
    const filter: Record<string, unknown> = status ? { status } : {};
    if (req.authUser?.role === 'institution') filter.institutionId = req.authUser._id;
    if (req.authUser?.role === 'recycler' && !status) {
      filter.status = { $in: ['Created', 'Accepted', 'PickupStarted', 'PickedUp', 'InTransit', 'ReceivedAtPlant', 'Processing', 'Recycled', 'BooksProduced'] };
    }
    if (req.authUser?.role === 'ngo' && !status) {
      filter.status = { $in: ['SentToNGO', 'ReceivedByNGO', 'DistributionStarted'] };
    }
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

export const acceptBatch = (req: AuthenticatedRequest, res: Response) => updateBatchTransition(req, res, 'Accepted');
export const pickupBatch = (req: AuthenticatedRequest, res: Response) => updateBatchTransition(req, res, 'PickedUp');
export const transitBatch = (req: AuthenticatedRequest, res: Response) => updateBatchTransition(req, res, 'InTransit');
export const receiveBatch = (req: AuthenticatedRequest, res: Response) => updateBatchTransition(req, res, 'ReceivedAtPlant');
export const recycleBatch = (req: AuthenticatedRequest, res: Response) => updateBatchTransition(req, res, 'Recycled');
export const distributeBatch = (req: AuthenticatedRequest, res: Response) => {
  const targetStatus: TrackingStatus = req.body.finalDelivery ? 'Delivered' : 'SentToNGO';
  return updateBatchTransition(req, res, targetStatus);
};

export const addProofUpdate = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { batchId, proofUrl, proofFileName, message, location } = req.body;
    const batch = await Batch.findOne({ batchId: Number(batchId) });
    if (!batch) return res.status(404).json({ error: 'Batch not found' });

    const role = (req.authUser?.role || 'institution') as UserRole;
    const verification = verificationFor(actorName(req), role);

    batch.proofUrl = proofUrl || batch.proofUrl;
    batch.proofFileName = proofFileName || batch.proofFileName;
    batch.verifiedBy = verification.verifiedBy;
    batch.verifiedRole = verification.verifiedRole;
    batch.verificationTimestamp = verification.verificationTimestamp;
    await batch.save();

    await addTrackingLog({
      batchId: batch.batchId,
      status: batch.status,
      actorRole: role,
      proofUrl,
      proofFileName,
      message: message || 'Progress proof uploaded',
      location,
      ...verification,
    });

    return res.json(batch);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const getTracking = async (req: Request, res: Response) => {
  try {
    const batchId = Number(req.params.batchId);
    const [batch, logs] = await Promise.all([Batch.findOne({ batchId }), TrackingLog.find({ batchId }).sort({ createdAt: 1 })]);

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
        role: 'institution',
        name: 'Paperloop Public School',
        institutionName: 'Paperloop Public School',
      },
      { upsert: true, new: true }
    );

    await Batch.findOneAndUpdate(
      { batchId: 101 },
      {
        batchId: 101,
        institutionId: institution._id,
        title: 'Semester answer sheets',
        weight: 85,
        pagesEstimate: estimatePages(85),
        notebooksEstimate: estimateImpact(85).notebooksCreated,
        status: 'InTransit',
        proofImages: [],
        proofUrl: 'https://example.com/proofs/demo-shipment.jpg',
        proofFileName: 'demo-shipment.jpg',
        pickupLocation: { lat: 19.076, lng: 72.8777, address: 'Mumbai, Maharashtra' },
        verifiedBy: 'Paperloop demo',
        verifiedRole: 'institution',
        verificationTimestamp: new Date().toISOString(),
      },
      { upsert: true, new: true }
    );

    return res.json({ ok: true });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};
