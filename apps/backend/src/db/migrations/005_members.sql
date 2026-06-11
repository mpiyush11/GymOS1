BEGIN;

CREATE TABLE IF NOT EXISTS members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  gender TEXT CHECK (gender IN ('Male', 'Female', 'Other')),
  dob DATE,
  address TEXT,
  emergency_contact TEXT,
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Frozen')),
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unique constraint per gym + phone
ALTER TABLE members 
ADD CONSTRAINT unique_gym_member_phone UNIQUE (gym_id, phone);

-- Index for performance
CREATE INDEX idx_members_gym_id ON members(gym_id);
CREATE INDEX idx_members_is_deleted ON members(is_deleted);

COMMIT;