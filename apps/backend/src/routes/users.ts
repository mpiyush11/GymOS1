import { Router } from 'express';
import bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { authMiddleware } from '../middleware/auth';
import { requireRole } from '../middleware/role';
import { query } from '../db';

const router = Router();

router.post('/', authMiddleware, requireRole('superadmin'), async (req, res) => {
  try {
    const { email, password, gym_id } = req.body;
    const hash = await bcrypt.hash(password, 10);
    const id = randomUUID();
    const result = await query(
      'INSERT INTO users (id, email, password_hash, role, gym_id) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, role, gym_id',
      [id, email, hash, 'gym_owner', gym_id]
    );
    res.json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;