import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL!);

async function migrate() {
  console.log('Running schema migration...');
  
  try {
    // Add employee_id to users table (if not exists)
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS employee_id text UNIQUE`;
    console.log('✓ Added employee_id column to users');
  } catch (e: any) {
    console.log('→ employee_id column:', e.message);
  }

  try {
    // Create pos_config table (if not exists)
    await sql`
      CREATE TABLE IF NOT EXISTS pos_config (
        id serial PRIMARY KEY NOT NULL,
        key text NOT NULL,
        value text NOT NULL,
        CONSTRAINT pos_config_key_unique UNIQUE(key)
      )
    `;
    console.log('✓ Created pos_config table');
  } catch (e: any) {
    console.log('→ pos_config table:', e.message);
  }

  console.log('Migration complete!');
}

migrate().catch(console.error);
