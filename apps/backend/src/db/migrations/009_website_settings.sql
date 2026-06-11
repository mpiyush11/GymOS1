BEGIN;

CREATE TABLE IF NOT EXISTS website_settings (
  gym_id UUID PRIMARY KEY REFERENCES gyms(id) ON DELETE CASCADE,
  public_slug TEXT NOT NULL UNIQUE,
  phone TEXT,
  whatsapp TEXT,
  email TEXT,
  address TEXT,
  maps_url TEXT,
  business_hours TEXT,
  hero_headline TEXT,
  hero_subheadline TEXT,
  cta_text TEXT,
  social_links JSONB DEFAULT '{}'::jsonb,
  trainers JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_website_settings_gym_id ON website_settings(gym_id);
CREATE INDEX IF NOT EXISTS idx_website_settings_public_slug ON website_settings(public_slug);

COMMIT;