CREATE TABLE gyms (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('superadmin', 'gym_owner', 'staff')),
  gym_id UUID REFERENCES gyms(id),
  created_at TIMESTAMP DEFAULT NOW()
);