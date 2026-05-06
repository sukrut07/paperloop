import { NextFunction, Response } from 'express';
import { UserRole } from '../models';
import { AuthenticatedRequest } from './authMiddleware';

export function authorizeRoles(...roles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.authUser) return res.status(401).json({ error: 'Authentication required' });
    if (!roles.includes(req.authUser.role)) {
      return res.status(403).json({ error: 'You are not authorized for this Paperloop workflow' });
    }
    return next();
  };
}
