import { Request, Response } from 'express';
import { Room } from '../models';

export const createRoom = async (req: Request, res: Response) => {
  try {
    const { institutionId, name } = req.body;
    
    // Generate random 6-digit code
    let code: string;
    let isUnique = false;
    while (!isUnique) {
      code = Math.floor(100000 + Math.random() * 900000).toString();
      const existing = await Room.findOne({ code });
      if (!existing) isUnique = true;
    }

    const room = new Room({
      code: code!,
      institutionId,
      name,
      members: [institutionId],
    });

    await room.save();
    res.status(201).json(room);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const joinRoom = async (req: Request, res: Response) => {
  try {
    const { code, userId } = req.body;
    const room = await Room.findOne({ code });
    if (!room) return res.status(404).json({ error: 'Room not found' });

    if (!room.members.includes(userId)) {
      room.members.push(userId);
      await room.save();
    }

    res.json(room);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
