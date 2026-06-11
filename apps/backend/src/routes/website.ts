import { Router } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { requireRole } from '../middleware/role';
import { query } from '../db';

const router = Router();

// Default settings structure
const defaultSettings = {
  public_slug: '',
  phone: '',
  whatsapp: '',
  email: '',
  address: '',
  maps_url: '',
  business_hours: '',
  hero_headline: '',
  hero_subheadline: '',
  cta_text: '',
  social_links: {},
  trainers: []
};

// Slug validation regex (lowercase alphanumeric + hyphens only)
const SLUG_REGEX = /^[a-z0-9-]+$/;

// GET /api/website-settings - Fetch settings for the gym
router.get('/', authMiddleware, requireRole('gym_owner'), async (req: AuthRequest, res) => {
  try {
    const gymId = req.user.gym_id;

    const result = await query(
      'SELECT * FROM website_settings WHERE gym_id = $1',
      [gymId]
    );

    if (result.rows.length === 0) {
      return res.json({
        ...defaultSettings,
        gym_id: gymId
      });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/website-settings - Upsert settings with slug validation
router.put('/', authMiddleware, requireRole('gym_owner'), async (req: AuthRequest, res) => {
  try {
    const gymId = req.user.gym_id;
    const {
      public_slug,
      phone,
      whatsapp,
      email,
      address,
      maps_url,
      business_hours,
      hero_headline,
      hero_subheadline,
      cta_text,
      social_links,
      trainers
    } = req.body;

    // Strict slug validation
    if (!public_slug || typeof public_slug !== 'string') {
      return res.status(400).json({ error: 'public_slug is required' });
    }

    if (!SLUG_REGEX.test(public_slug)) {
      return res.status(400).json({ 
        error: 'public_slug must contain only lowercase letters, numbers, and hyphens (no spaces or uppercase)' 
      });
    }

    const result = await query(
      `INSERT INTO website_settings 
       (gym_id, public_slug, phone, whatsapp, email, address, maps_url, business_hours, 
        hero_headline, hero_subheadline, cta_text, social_links, trainers)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       ON CONFLICT (gym_id) 
       DO UPDATE SET 
         public_slug = EXCLUDED.public_slug,
         phone = EXCLUDED.phone,
         whatsapp = EXCLUDED.whatsapp,
         email = EXCLUDED.email,
         address = EXCLUDED.address,
         maps_url = EXCLUDED.maps_url,
         business_hours = EXCLUDED.business_hours,
         hero_headline = EXCLUDED.hero_headline,
         hero_subheadline = EXCLUDED.hero_subheadline,
         cta_text = EXCLUDED.cta_text,
         social_links = EXCLUDED.social_links,
         trainers = EXCLUDED.trainers,
         updated_at = NOW()
       RETURNING *`,
      [
        gymId,
        public_slug,
        phone || '',
        whatsapp || '',
        email || '',
        address || '',
        maps_url || '',
        business_hours || '',
        hero_headline || '',
        hero_subheadline || '',
        cta_text || '',
        JSON.stringify(social_links || {}),
        JSON.stringify(trainers || [])
      ]
    );

    res.json(result.rows[0]);
  } catch (error: any) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'public_slug is already in use' });
    }
    res.status(500).json({ error: error.message });
  }
});

export default router;