BEGIN;

ALTER TABLE members
ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES membership_plans(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS membership_start_date DATE,
ADD COLUMN IF NOT EXISTS membership_end_date DATE;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_members_plan_id ON members(plan_id);
CREATE INDEX IF NOT EXISTS idx_members_end_date ON members(membership_end_date);

COMMIT;