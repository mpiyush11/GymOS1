import { Router } from 'express';
import { randomUUID } from 'crypto';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { requireRole } from '../middleware/role';
import { query } from '../db';

const router = Router();

router.get('/', authMiddleware, requireRole('superadmin'), async (req: AuthRequest, res) => {
  try {
    const result = await query('SELECT * FROM gyms ORDER BY created_at DESC');
    res.json({ data: result.rows });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', authMiddleware, requireRole('superadmin'), async (req: AuthRequest, res) => {
  try {
    const { name } = req.body;
    const id = randomUUID();
    const result = await query('INSERT INTO gyms (id, name) VALUES ($1, $2) RETURNING *', [id, name]);
    res.json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/me', authMiddleware, requireRole('gym_owner'), async (req: AuthRequest, res) => {
  try {
    const result = await query('SELECT * FROM gyms WHERE id = $1', [req.user.gym_id]);
    res.json(result.rows[0] || {});
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Layer 2: Gym Setup
router.put('/my-setup', authMiddleware, requireRole('gym_owner'), async (req: AuthRequest, res) => {
  try {
    const { phone, whatsapp, email, address, maps_url, business_hours, theme_id } = req.body;
    const gymId = req.user.gym_id;

    const updates: any = {};
    if (phone !== undefined) updates.phone = String(phone).trim();
    if (whatsapp !== undefined) updates.whatsapp = String(whatsapp).trim();
    if (email !== undefined) updates.email = String(email).trim();
    if (address !== undefined) updates.address = String(address).trim();
    if (maps_url !== undefined) updates.maps_url = String(maps_url).trim();
    if (business_hours !== undefined) updates.business_hours = String(business_hours).trim();
    if (theme_id !== undefined) updates.theme_id = String(theme_id).trim() || 'theme_1';

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    const setClauses = Object.keys(updates).map((key, i) => `${key} = $${i + 1}`).join(', ');
    const values = Object.values(updates);

    const result = await query(
      `UPDATE gyms SET ${setClauses} WHERE id = $${values.length + 1} RETURNING *`,
      [...values, gymId]
    );

    res.json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;