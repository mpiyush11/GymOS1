import { pool } from '../src/db';

async function forcePatch() {
  try {
    await pool.query(`
      ALTER TABLE payments 
      ADD COLUMN IF NOT EXISTS joining_fee INT NOT NULL DEFAULT 0;
    `);
    console.log('✓ Force Patch Migration Applied Successfully to Cloud Database');
    process.exit(0);
  } catch (error: any) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  }
}

forcePatch();