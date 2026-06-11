import { Router } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { requireRole } from '../middleware/role';
import { query } from '../db';

const router = Router();

// POST /api/members - Create member (with plan support)
router.post('/', authMiddleware, requireRole('gym_owner'), async (req: AuthRequest, res) => {
  try {
    const { name, phone, gender, dob, address, emergency_contact, plan_id, membership_start_date } = req.body;
    const gymId = req.user.gym_id;

    if (!name || !phone) {
      return res.status(400).json({ error: 'name and phone are required' });
    }

    let membership_end_date = null;
    let startDate = membership_start_date || new Date().toISOString().split('T')[0];

    if (plan_id) {
      // Fetch plan duration
      const planResult = await query(
        'SELECT duration_months FROM membership_plans WHERE id = $1 AND gym_id = $2',
        [plan_id, gymId]
      );

      if (planResult.rows.length > 0) {
        const duration = planResult.rows[0].duration_months;
        const daysToAdd = duration === 1 ? 30 : duration === 3 ? 90 : duration === 6 ? 180 : 365;

        const start = new Date(startDate);
        start.setDate(start.getDate() + daysToAdd);
        membership_end_date = start.toISOString().split('T')[0];
      }
    }

    const result = await query(
      `INSERT INTO members 
       (gym_id, name, phone, gender, dob, address, emergency_contact, plan_id, membership_start_date, membership_end_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [gymId, name, phone, gender, dob, address, emergency_contact, plan_id, startDate, membership_end_date]
    );

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Member with this phone already exists in your gym' });
    }
    res.status(500).json({ error: error.message });
  }
});

// GET /api/members - List members with pagination, search, and membership status filter
router.get('/', authMiddleware, requireRole('gym_owner'), async (req: AuthRequest, res) => {
  try {
    const gymId = req.user.gym_id;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit as string) || 10));
    const search = req.query.search as string || '';
    const status = req.query.membership_status as string || '';
    const offset = (page - 1) * limit;

    let whereClause = `WHERE gym_id = $1 AND is_deleted = false`;
    const params: any[] = [gymId];

    if (search) {
      whereClause += ` AND (name ILIKE $${params.length + 1} OR phone ILIKE $${params.length + 1})`;
      params.push(`%${search}%`);
    }

    // Membership status filter
    if (status === 'active') {
      whereClause += ` AND membership_end_date >= CURRENT_DATE + INTERVAL '8 days'`;
    } else if (status === 'expiring') {
      whereClause += ` AND membership_end_date >= CURRENT_DATE AND membership_end_date <= CURRENT_DATE + INTERVAL '7 days'`;
    } else if (status === 'expired') {
      whereClause += ` AND membership_end_date < CURRENT_DATE`;
    }

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) FROM members ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    // Get paginated data
    const result = await query(
      `SELECT * FROM members ${whereClause} 
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

// GET /api/members/:id - Get single member
router.get('/:id', authMiddleware, requireRole('gym_owner'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const gymId = req.user.gym_id;

    const result = await query(
      `SELECT * FROM members WHERE id = $1 AND gym_id = $2 AND is_deleted = false`,
      [id, gymId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Member not found' });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/members/:id - Update member
router.put('/:id', authMiddleware, requireRole('gym_owner'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const gymId = req.user.gym_id;
    const { 
      name, phone, gender, dob, address, emergency_contact, status,
      membership_start_date, membership_end_date 
    } = req.body;

    const result = await query(
      `UPDATE members 
       SET name = COALESCE($1, name),
           phone = COALESCE($2, phone),
           gender = COALESCE($3, gender),
           dob = COALESCE($4, dob),
           address = COALESCE($5, address),
           emergency_contact = COALESCE($6, emergency_contact),
           status = COALESCE($7, status),
           membership_start_date = COALESCE($8, membership_start_date),
           membership_end_date = COALESCE($9, membership_end_date),
           updated_at = NOW()
       WHERE id = $10 AND gym_id = $11 AND is_deleted = false
       RETURNING *`,
      [
        name ?? null,
        phone ?? null,
        gender ?? null,
        dob ?? null,
        address ?? null,
        emergency_contact ?? null,
        status ?? null,
        membership_start_date ?? null,
        membership_end_date ?? null,
        id,
        gymId
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Member not found' });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Phone number already exists for another member in this gym' });
    }
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/members/:id - Soft delete
router.delete('/:id', authMiddleware, requireRole('gym_owner'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const gymId = req.user.gym_id;

    const result = await query(
      `UPDATE members 
       SET is_deleted = true, updated_at = NOW()
       WHERE id = $1 AND gym_id = $2 AND is_deleted = false
       RETURNING id`,
      [id, gymId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Member not found' });
    }

    res.json({ message: 'Member soft deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/members/:id/freeze - Toggle freeze/unfreeze status (Layer 4)
router.patch('/:id/freeze', authMiddleware, requireRole('gym_owner'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const gymId = req.user.gym_id;

    // Get current status
    const current = await query(
      `SELECT status FROM members WHERE id = $1 AND gym_id = $2 AND is_deleted = false`,
      [id, gymId]
    );

    if (current.rows.length === 0) {
      return res.status(404).json({ error: 'Member not found' });
    }

    const newStatus = current.rows[0].status === 'Frozen' ? 'Active' : 'Frozen';

    const result = await query(
      `UPDATE members 
       SET status = $1, updated_at = NOW()
       WHERE id = $2 AND gym_id = $3
       RETURNING *`,
      [newStatus, id, gymId]
    );

    res.json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;