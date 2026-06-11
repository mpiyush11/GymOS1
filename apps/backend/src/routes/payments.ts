import { Router } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { requireRole } from '../middleware/role';
import { query, pool } from '../db';

const router = Router();

function getDaysFromDuration(durationMonths: number): number {
  if (durationMonths === 1) return 30;
  if (durationMonths === 3) return 90;
  if (durationMonths === 6) return 180;
  if (durationMonths === 12) return 365;
  return 30;
}

// POST /api/payments - Record payment with proper transaction
router.post('/', authMiddleware, requireRole('gym_owner'), async (req: AuthRequest, res) => {
  const client = await pool.connect();

  try {
    const { member_id, plan_id, payment_method, custom_amount, custom_joining_fee } = req.body;
    const gymId = req.user.gym_id;

    if (!member_id || !plan_id || !payment_method) {
      return res.status(400).json({ error: 'member_id, plan_id, and payment_method are required' });
    }

    // Fetch plan
    const planResult = await client.query(
      'SELECT id, price, duration_months FROM membership_plans WHERE id = $1 AND gym_id = $2',
      [plan_id, gymId]
    );

    if (planResult.rows.length === 0) {
      return res.status(404).json({ error: 'Plan not found or does not belong to your gym' });
    }

    const plan = planResult.rows[0];
    const amount = custom_amount ?? plan.price;
    const joiningFee = custom_joining_fee ?? (plan.joining_fee || 0);
    const daysToAdd = getDaysFromDuration(plan.duration_months);

    // Fetch member
    const memberResult = await client.query(
      'SELECT id, membership_end_date FROM members WHERE id = $1 AND gym_id = $2 AND is_deleted = false',
      [member_id, gymId]
    );

    if (memberResult.rows.length === 0) {
      return res.status(404).json({ error: 'Member not found' });
    }

    const member = memberResult.rows[0];

    // Fix: Sanitize date from database
    const dbEndDateStr = member.membership_end_date 
      ? new Date(member.membership_end_date).toLocaleDateString('en-CA')
      : null;

    const today = new Date().toISOString().split('T')[0];

    let startDate: string;
    let endDate: string;

    if (dbEndDateStr && dbEndDateStr >= today) {
      startDate = dbEndDateStr;
      const start = new Date(startDate);
      start.setDate(start.getDate() + daysToAdd);
      endDate = start.toISOString().split('T')[0];
    } else {
      startDate = today;
      const start = new Date(today);
      start.setDate(start.getDate() + daysToAdd);
      endDate = start.toISOString().split('T')[0];
    }

    // Begin transaction
    await client.query('BEGIN');

    // Insert payment
    await client.query(
      `INSERT INTO payments (gym_id, member_id, plan_id, amount, joining_fee, payment_method)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [gymId, member_id, plan_id, amount, joiningFee, payment_method]
    );

    // Update member
    await client.query(
      `UPDATE members 
       SET plan_id = $1,
           membership_start_date = $2,
           membership_end_date = $3,
           updated_at = NOW()
       WHERE id = $4 AND gym_id = $5`,
      [plan_id, startDate, endDate, member_id, gymId]
    );

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Payment recorded and membership renewed successfully',
      new_end_date: endDate
    });
  } catch (error: any) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

// GET /api/payments - List payments
router.get('/', authMiddleware, requireRole('gym_owner'), async (req: AuthRequest, res) => {
  try {
    const gymId = req.user.gym_id;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit as string) || 10));
    const offset = (page - 1) * limit;

    const countResult = await query(
      'SELECT COUNT(*) FROM payments WHERE gym_id = $1',
      [gymId]
    );
    const total = parseInt(countResult.rows[0].count);

    const result = await query(
      `SELECT * FROM payments 
       WHERE gym_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [gymId, limit, offset]
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

export default router;