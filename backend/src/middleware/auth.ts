import { NextFunction, Request, Response } from 'express';
import { getFirebaseAdmin } from '../services/firebaseAdmin';
export { verifyToken } from './authMiddleware';
export { authorizeRoles } from './roleMiddleware';

export interface AuthenticatedRequest extends Request {
  user?: {
    uid: string;
    email?: string;
  };
}

export async function firebaseAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const requireAuth = process.env.REQUIRE_FIREBASE_AUTH === 'true';
  const header = req.headers.authorization;

  if (!header?.startsWith('Bearer ')) {
    if (requireAuth) return res.status(401).json({ error: 'Missing Firebase bearer token' });
    return next();
  }

  try {
    const token = header.replace('Bearer ', '');
    const decoded = await getFirebaseAdmin().auth().verifyIdToken(token);
    req.user = { uid: decoded.uid, email: decoded.email };
    next();
  } catch (error) {
    if (requireAuth) return res.status(401).json({ error: 'Invalid Firebase token' });
    next();
  }
}
