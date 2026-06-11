import { Pool } from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function query(text: string, params?: any[]) {
  return pool.query(text, params);
}

export { pool };

export async function runMigrations() {
  // Ensure migration tracking table exists
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      applied_at TIMESTAMP DEFAULT NOW()
    );
  `);

  const migrationsDir = path.join(__dirname, 'db/migrations');
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const result = await pool.query(
      'SELECT 1 FROM schema_migrations WHERE name = $1',
      [file]
    );

    if (result.rows.length > 0) {
      console.log(`Migration already applied: ${file}`);
      continue;
    }

    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, 'utf8');
    console.log(`Applying migration: ${file}`);
    await pool.query(sql);
    await pool.query(
      'INSERT INTO schema_migrations (name) VALUES ($1)',
      [file]
    );
  }
  console.log('Migrations completed');
}