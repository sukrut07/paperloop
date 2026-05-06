import { NextFunction, Request, Response } from 'express';
import { IUser, User } from '../models';
import { verifyJwt } from '../utils/jwt';

export interface AuthenticatedRequest extends Request {
  authUser?: IUser;
}

export async function verifyToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing bearer token' });
  }

  try {
    const payload = verifyJwt(header.replace('Bearer ', ''));
    const user = await User.findById(payload.sub);
    if (!user) return res.status(401).json({ error: 'User no longer exists' });
    if (user.isBlocked) return res.status(403).json({ error: 'User account is blocked' });

    req.authUser = user;
    return next();
  } catch (error: any) {
    return res.status(401).json({ error: error.message || 'Invalid bearer token' });
  }
}
