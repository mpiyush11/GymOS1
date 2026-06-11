import { Router } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { requireRole } from '../middleware/role';
import { query } from '../db';

const router = Router();

// GET /api/dashboard/stats
router.get('/stats', authMiddleware, requireRole('gym_owner'), async (req: AuthRequest, res) => {
  try {
    const gymId = req.user.gym_id;
    const { startDate, endDate } = req.query;

    let revenueWhere = 'WHERE gym_id = $1';
    const revenueParams: any[] = [gymId];

    if (startDate) {
      revenueWhere += ` AND created_at >= $${revenueParams.length + 1}`;
      revenueParams.push(startDate);
    }
    if (endDate) {
      revenueWhere += ` AND created_at <= $${revenueParams.length + 1}`;
      revenueParams.push(endDate);
    }

    const statsResult = await query(
      `SELECT 
        COUNT(*) FILTER (WHERE membership_end_date >= CURRENT_DATE + INTERVAL '8 days') AS "activeCount",
        COUNT(*) FILTER (WHERE membership_end_date >= CURRENT_DATE AND membership_end_date <= CURRENT_DATE + INTERVAL '7 days') AS "expiringCount",
        COUNT(*) FILTER (WHERE membership_end_date < CURRENT_DATE) AS "expiredCount"
       FROM members 
       WHERE gym_id = $1 AND is_deleted = false`,
      [gymId]
    );

    const revenueResult = await query(
      `SELECT COALESCE(SUM(amount), 0) AS "totalRevenue" FROM payments ${revenueWhere}`,
      revenueParams
    );

    res.json({
      ...statsResult.rows[0],
      totalRevenue: parseInt(revenueResult.rows[0].totalRevenue)
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;