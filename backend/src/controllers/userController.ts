import { Request, Response } from 'express';
import { User } from '../models';

export const upsertProfile = async (req: Request, res: Response) => {
  try {
    const { uid, email, role, name, walletAddress, phone, institutionName, location } = req.body;
    if (!uid || !email || !role || !name) {
      return res.status(400).json({ error: 'uid, email, role, and name are required' });
    }

    const profile = await User.findOneAndUpdate(
      { uid },
      {
        uid,
        email,
        role,
        name,
        walletAddress: walletAddress?.toLowerCase(),
        phone,
        institutionName,
        location,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.json(profile);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const getProfile = async (req: Request, res: Response) => {
  try {
    const profile = await User.findOne({ uid: req.params.uid });
    if (!profile) return res.status(404).json({ error: 'Profile not found' });
    return res.json(profile);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};
