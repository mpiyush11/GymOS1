import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { query } from '../db';

export interface AuthRequest extends Request {
  user?: any;
}

export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies?.token;
    if (!token) {
      return res.status(401).json({ error: 'Authentication missing' });
    }

    // Verify token integrity parameters
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    if (!decoded || !decoded.userId) {
      return res.status(401).json({ error: 'Malformed authorization credentials' });
    }

    // Direct database validation tracking
    const result = await query('SELECT id, email, role, gym_id FROM users WHERE id = $1', [decoded.userId]);
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ error: 'User link signature not found in core node' });
    }

    // Bind structured payload object to request stream
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      gym_id: user.gym_id
    };

    return next();
  } catch (error: any) {
    console.error('CRITICAL RUNTIME ERROR IN AUTH MIDDLEWARE SYSTEM:', error.message);
    return res.status(401).json({ error: 'Session verification expired or invalidated' });
  }
};