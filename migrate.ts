import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function run() {
  const sql = neon(process.env.DATABASE_URL!);
  try {
    await sql`ALTER TABLE products ADD COLUMN is_available boolean NOT NULL DEFAULT true;`;
    console.log('Successfully added is_available to products');
  } catch (e) {
    if (e.message.includes('already exists')) {
      console.log('is_available already exists');
    } else {
      console.error(e);
    }
  }
}
run();
