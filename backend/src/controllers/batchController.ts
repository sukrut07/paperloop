import { Request, Response } from 'express';
import { Batch, TrackingLog } from '../models';
import { uploadToIPFS } from '../services/pinata';

export const createBatch = async (req: Request, res: Response) => {
  try {
    const { blockchainId, institutionId, weight, roomCode, metadata } = req.body;

    // 1. Upload metadata to IPFS
    const ipfsHash = await uploadToIPFS({ weight, institutionId, metadata, createdAt: new Date() });

    // 2. Save to MongoDB
    const batch = new Batch({
      blockchainId,
      institutionId,
      weight,
      status: 'Created',
      ipfsHash,
      roomCode,
    });

    await batch.save();

    // 3. Create tracking log
    const log = new TrackingLog({
      batchId: blockchainId,
      status: 'Created',
      message: 'Batch created by institution',
    });
    await log.save();

    res.status(201).json(batch);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getBatch = async (req: Request, res: Response) => {
  try {
    const batch = await Batch.findOne({ blockchainId: parseInt(req.params.id) })
      .populate('institutionId recyclerId ngoId');
    if (!batch) return res.status(404).json({ error: 'Batch not found' });
    res.json(batch);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateBatchStatus = async (req: Request, res: Response) => {
  try {
    const { blockchainId, status, message, actorId, actorRole } = req.body;

    const batch = await Batch.findOne({ blockchainId });
    if (!batch) return res.status(404).json({ error: 'Batch not found' });

    batch.status = status;
    if (actorRole === 'recycler') batch.recyclerId = actorId;
    if (actorRole === 'ngo') batch.ngoId = actorId;

    await batch.save();

    const log = new TrackingLog({
      batchId: blockchainId,
      status,
      message,
    });
    await log.save();

    res.json(batch);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getTracking = async (req: Request, res: Response) => {
  try {
    const logs = await TrackingLog.find({ batchId: parseInt(req.params.batchId) }).sort({ timestamp: 1 });
    res.json(logs);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
