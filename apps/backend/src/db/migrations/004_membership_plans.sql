BEGIN;

CREATE TABLE IF NOT EXISTS membership_plans (
  id UUID PRIMARY KEY,
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  duration_months INT NOT NULL CHECK (duration_months IN (1, 3, 6, 12)),
  price INT NOT NULL DEFAULT 0,
  joining_fee INT NOT NULL DEFAULT 0,
  UNIQUE(gym_id, duration_months)
);

COMMIT;