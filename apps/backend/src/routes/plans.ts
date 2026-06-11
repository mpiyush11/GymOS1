import { Router } from 'express';
import { randomUUID } from 'crypto';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { requireRole } from '../middleware/role';
import { query } from '../db';

const router = Router();

const VALID_DURATIONS = [1, 3, 6, 12];

// GET /api/plans - Get all plans for the gym owner's gym
router.get('/', authMiddleware, requireRole('gym_owner'), async (req: AuthRequest, res) => {
  try {
    const result = await query(
      'SELECT * FROM membership_plans WHERE gym_id = $1 ORDER BY duration_months ASC',
      [req.user.gym_id]
    );
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/plans - Upsert plan configuration
router.put('/', authMiddleware, requireRole('gym_owner'), async (req: AuthRequest, res) => {
  try {
    const { duration_months, price, joining_fee } = req.body;
    const gymId = req.user.gym_id;

    // Validation
    if (!VALID_DURATIONS.includes(Number(duration_months))) {
      return res.status(400).json({ error: 'duration_months must be one of 1, 3, 6, or 12' });
    }

    const safePrice = Math.max(0, Number(price) || 0);
    const safeJoiningFee = Math.max(0, Number(joining_fee) || 0);

    const result = await query(
      `INSERT INTO membership_plans (id, gym_id, duration_months, price, joining_fee)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (gym_id, duration_months)
       DO UPDATE SET price = EXCLUDED.price, joining_fee = EXCLUDED.joining_fee
       RETURNING *`,
      [randomUUID(), gymId, duration_months, safePrice, safeJoiningFee]
    );

    res.json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;