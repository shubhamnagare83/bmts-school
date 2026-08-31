import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.js';
import { UserRole } from '../types/enums.js';

export const authorize = (...roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    if (!roles.includes(req.user.role as UserRole)) {
      return res.status(403).json({ success: false, error: 'Forbidden: Insufficient role' });
    }

    next();
  };
};
