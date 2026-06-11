import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';

export const tenantGuard = (req: AuthRequest, res: Response, next: NextFunction) => {
  // For gym_owner, ensure they only access their gym (UUID string comparison)
  if (req.user?.role === 'gym_owner' && req.params.gymId && req.params.gymId !== req.user.gym_id) {
    return res.status(403).json({ error: 'Tenant mismatch' });
  }
  next();
};