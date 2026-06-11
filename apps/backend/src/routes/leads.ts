import { Router } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { requireRole } from '../middleware/role';
import { query } from '../db';

const router = Router();

// POST /api/leads - Create lead
router.post('/', authMiddleware, requireRole('gym_owner'), async (req: AuthRequest, res) => {
  try {
    const { name, phone, email } = req.body;
    const gymId = req.user.gym_id;

    if (!name || !phone) {
      return res.status(400).json({ error: 'name and phone are required' });
    }

    const result = await query(
      `INSERT INTO leads (gym_id, name, phone, email)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [gymId, name, phone, email]
    );

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/leads - List leads with pagination and status filter
router.get('/', authMiddleware, requireRole('gym_owner'), async (req: AuthRequest, res) => {
  try {
    const gymId = req.user.gym_id;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit as string) || 10));
    const status = req.query.status as string || '';
    const offset = (page - 1) * limit;

    let whereClause = `WHERE gym_id = $1`;
    const params: any[] = [gymId];

    if (status) {
      whereClause += ` AND status = $${params.length + 1}`;
      params.push(status);
    }

    const countResult = await query(
      `SELECT COUNT(*) FROM leads ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    const result = await query(
      `SELECT * FROM leads ${whereClause} 
       ORDER BY created_at DESC 
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    res.json({
      data: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/leads/:id - Get single lead
router.get('/:id', authMiddleware, requireRole('gym_owner'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const gymId = req.user.gym_id;

    const result = await query(
      `SELECT * FROM leads WHERE id = $1 AND gym_id = $2`,
      [id, gymId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/leads/:id - Update lead (including status)
router.put('/:id', authMiddleware, requireRole('gym_owner'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const gymId = req.user.gym_id;
    const { name, phone, email, status } = req.body;

    const result = await query(
      `UPDATE leads 
       SET name = COALESCE($1, name),
           phone = COALESCE($2, phone),
           email = COALESCE($3, email),
           status = COALESCE($4, status)
       WHERE id = $5 AND gym_id = $6
       RETURNING *`,
      [name ?? null, phone ?? null, email ?? null, status ?? null, id, gymId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;