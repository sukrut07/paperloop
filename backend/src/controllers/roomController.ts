import { Request, Response } from 'express';
import { Room } from '../models';

async function generateRoomCode() {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const existing = await Room.exists({ code });
    if (!existing) return code;
  }

  throw new Error('Could not generate unique room code');
}

export const createRoom = async (req: Request, res: Response) => {
  try {
    const { institutionId, name, createdByUid } = req.body;
    if (!institutionId || !name || !createdByUid) {
      return res.status(400).json({ error: 'institutionId, name, and createdByUid are required' });
    }

    const code = await generateRoomCode();
    const room = await Room.create({
      code,
      institutionId,
      name,
      createdByUid,
      members: [createdByUid],
      batches: [],
    });

    return res.status(201).json(room);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const joinRoom = async (req: Request, res: Response) => {
  try {
    const { code, userUid } = req.body;
    if (!code || !userUid) return res.status(400).json({ error: 'code and userUid are required' });

    const room = await Room.findOneAndUpdate(
      { code },
      { $addToSet: { members: userUid } },
      { new: true }
    );

    if (!room) return res.status(404).json({ error: 'Room not found' });
    return res.json(room);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const getRoom = async (req: Request, res: Response) => {
  try {
    const room = await Room.findOne({ code: req.params.code }).populate('institutionId');
    if (!room) return res.status(404).json({ error: 'Room not found' });
    return res.json(room);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};
