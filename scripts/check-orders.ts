import { db } from '../lib/db';
import { orders } from '../lib/db/schema';
import { sql } from 'drizzle-orm';

async function check() {
  try {
    const minMax = await db.execute(sql`SELECT min(created_at) as min_date, max(created_at) as max_date, count(*) as total FROM orders`);
    console.log("Database Stats:", minMax.rows[0]);
    
    // Check records specifically around the 24th
    const stats24 = await db.execute(sql`
      SELECT count(*) as c, min(created_at), max(created_at) 
      FROM orders 
      WHERE created_at >= '2026-06-24 00:00:00' AND created_at < '2026-06-25 00:00:00'
    `);
    console.log("Stats for June 24th:", stats24.rows[0]);
    
    // Check posConfig dashboard_start_time
    const config = await db.execute(sql`SELECT value FROM pos_config WHERE key = 'dashboard_start_time'`);
    console.log("Current dashboard_start_time:", config.rows[0]);

  } catch (err) {
    console.error(err);
  }
}
check();
