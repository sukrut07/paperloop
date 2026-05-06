import crypto from 'crypto';
import { Request, Response } from 'express';
import { getFirebaseAdmin } from '../services/firebaseAdmin';
import { User, UserRole } from '../models';
import { hashPassword, verifyPassword } from '../utils/password';
import { signJwt } from '../utils/jwt';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

const roles: UserRole[] = ['institution', 'recycler', 'ngo', 'admin'];

function normalizeRole(role: string): UserRole | undefined {
  const aliases: Record<string, UserRole> = {
    institution_admin: 'institution',
    teacher: 'institution',
    ngo_admin: 'ngo',
  };
  const normalized = aliases[role] || role;
  return roles.includes(normalized as UserRole) ? (normalized as UserRole) : undefined;
}

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

export const signup = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role, institutionName } = req.body;
    const normalizedRole = normalizeRole(role);
    if (!name || !email || !password || !normalizedRole) {
      return res.status(400).json({ error: 'name, email, password, and a valid role are required' });
    }

    const existing = await User.findOne({ email: String(email).toLowerCase() });
    if (existing) return res.status(409).json({ error: 'A Paperloop user already exists for this email' });

    const user = await User.create({
      uid: `local-${crypto.randomUUID()}`,
      name,
      email,
      password: hashPassword(password),
      role: normalizedRole,
      institutionName,
      isVerified: true,
    });

    return res.status(201).json(authResponse(user));
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email and password are required' });

    const user = await User.findOne({ email: String(email).toLowerCase() }).select('+password');
    if (!user || !verifyPassword(password, user.password)) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    if (user.isBlocked) return res.status(403).json({ error: 'User account is blocked' });

    return res.json(authResponse(user));
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const firebaseLogin = async (req: Request, res: Response) => {
  try {
    const { idToken, role, name, institutionName } = req.body;
    if (!idToken) return res.status(400).json({ error: 'idToken is required' });

    const decoded = await getFirebaseAdmin().auth().verifyIdToken(idToken);
    const email = decoded.email;
    if (!email) return res.status(400).json({ error: 'Firebase account has no email' });

    const normalizedEmail = String(email).toLowerCase();
    const existing = await User.findOne({
      $or: [{ uid: decoded.uid }, { email: normalizedEmail }],
    });
    const normalizedRole = normalizeRole(role || existing?.role || 'institution');
    const updates = {
      uid: decoded.uid,
      email: normalizedEmail,
      name: name || decoded.name || existing?.name || email.split('@')[0],
      role: normalizedRole || 'institution',
      institutionName: institutionName || existing?.institutionName,
      isVerified: true,
    };
    const user = existing
      ? await User.findByIdAndUpdate(existing._id, updates, { new: true })
      : await User.create(updates);

    if (!user) return res.status(401).json({ error: 'Firebase authentication failed' });

    if (user.isBlocked) return res.status(403).json({ error: 'User account is blocked' });
    return res.json(authResponse(user));
  } catch (error: any) {
    return res.status(401).json({ error: error.message || 'Firebase authentication failed' });
  }
};

export const me = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.authUser) return res.status(401).json({ error: 'Authentication required' });
  return res.json(authResponse(req.authUser));
};

export const markEmailVerified = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.authUser) return res.status(401).json({ error: 'Authentication required' });
    req.authUser.isVerified = true;
    await req.authUser.save();
    return res.json(authResponse(req.authUser));
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};
