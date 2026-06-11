INSERT INTO users (id, email, password_hash, role, gym_id)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'admin@gymos.dev',
  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  'superadmin',
  NULL
)
ON CONFLICT (email) DO NOTHING;