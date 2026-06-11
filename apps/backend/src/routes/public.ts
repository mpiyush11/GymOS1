import { Router } from 'express';
import { query } from '../db';

const router = Router();

// GET /api/public/site/:public_slug - Public website data
router.get('/site/:public_slug', async (req, res) => {
  try {
    const { public_slug } = req.params;

    // 1. Fetch website settings by public_slug
    const settingsResult = await query(
      'SELECT * FROM website_settings WHERE public_slug = $1',
      [public_slug]
    );

    if (settingsResult.rows.length === 0) {
      return res.status(404).json({ error: 'Website not found' });
    }

    const settings = settingsResult.rows[0];
    const gymId = settings.gym_id;

    // 2. Fetch gym name
    const gymResult = await query(
      'SELECT name FROM gyms WHERE id = $1',
      [gymId]
    );

    const gymName = gymResult.rows.length > 0 ? gymResult.rows[0].name : 'Unknown Gym';

    // 3. Fetch active membership plans
    const plansResult = await query(
      'SELECT * FROM membership_plans WHERE gym_id = $1 ORDER BY duration_months ASC',
      [gymId]
    );

    // Return unified response
    res.json({
      gym_name: gymName,
      settings: settings,
      plans: plansResult.rows
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/public/leads - Public lead capture (no auth)
router.post('/leads', async (req, res) => {
  try {
    const { public_slug, name, phone, email } = req.body;

    // Validation
    if (!public_slug || typeof public_slug !== 'string' ||
        !name || typeof name !== 'string' ||
        !phone || typeof phone !== 'string') {
      return res.status(400).json({ error: 'public_slug, name, and phone are required' });
    }

    // Resolve gym_id from public_slug
    const settingsResult = await query(
      'SELECT gym_id FROM website_settings WHERE public_slug = $1',
      [public_slug]
    );

    if (settingsResult.rows.length === 0) {
      return res.status(404).json({ error: 'Website not found' });
    }

    const gymId = settingsResult.rows[0].gym_id;

    // Insert lead with status 'new'
    const result = await query(
      `INSERT INTO leads (gym_id, name, phone, email, status)
       VALUES ($1, $2, $3, $4, 'new')
       RETURNING *`,
      [gymId, name, phone, email || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;