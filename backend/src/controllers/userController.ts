import { Request, Response } from 'express';
import { User, UserRole } from '../models';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { signJwt } from '../utils/jwt';

const roles: UserRole[] = ['institution', 'recycler', 'ngo', 'admin'];

function authResponse(user: any) {
  const token = signJwt({
    sub: String(user._id),
    uid: user.uid,
    email: user.email,
    role: user.role,
    isVerified: true,
  });

  return {
    token,
    user: {
      id: String(user._id),
      uid: user.uid,
      name: user.name,
      email: user.email,
      role: user.role,
      isVerified: true,
      institutionName: user.institutionName,
      organizationName: user.institutionName,
      phone: user.phone,
      createdAt: user.createdAt,
    },
  };
}

export const upsertProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.authUser) return res.status(401).json({ error: 'Authentication required' });
    const { name, phone, institutionName, location, role } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'name is required' });
    }
    const nextRole = roles.includes(role) && (req.authUser.role === 'admin' || role !== 'admin') ? role : req.authUser.role;

    const profile = await User.findOneAndUpdate(
      { _id: req.authUser._id },
      {
        name,
        phone,
        institutionName,
        location,
        role: nextRole,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.json(authResponse(profile));
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

export const listUsers = async (_req: Request, res: Response) => {
  try {
    const users = await User.find().sort({ createdAt: -1 }).limit(200);
    return res.json(users);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const approveUser = async (req: Request, res: Response) => {
  try {
    const { role } = req.body as { role?: UserRole };
    const update: { isVerified: boolean; role?: UserRole } = { isVerified: true };
    if (role) update.role = role;

    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json(user);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const blockUser = async (req: Request, res: Response) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isBlocked: Boolean(req.body.blocked) }, { new: true });
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json(user);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};
