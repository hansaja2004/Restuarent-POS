import { db } from '../lib/db';
import { sql } from 'drizzle-orm';

async function check() {
  try {
    const config = await db.execute(sql`SELECT value FROM pos_config WHERE key = 'past_shifts'`);
    console.log("Past Shifts:");
    console.dir(config.rows[0] ? JSON.parse(config.rows[0].value as string) : null, { depth: null });
  } catch (err) {
    console.error(err);
  }
}
check();
