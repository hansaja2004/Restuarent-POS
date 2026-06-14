'use server';

import { db } from '@/lib/db';
import { orders, orderItems, products } from '@/lib/db/schema';
import { sum, sql } from 'drizzle-orm';
import { getSession } from '@/lib/auth';

export async function getSalesSummary() {
  const session = await getSession();
  if (!session) return { totalRevenue: '0.00', totalOrders: 0 };

  const result = await db.execute(sql`SELECT sum(total_amount) as revenue, count(*) as orders_count FROM orders`);
  const row = result.rows[0] || {};
  return { totalRevenue: row.revenue || '0.00', totalOrders: Number(row.orders_count || 0) };
}

export async function getTopProducts(limit = 10) {
  const session = await getSession();
  if (!session) return [];

  // Sum quantities by product
  return await db.execute(sql`
    SELECT p.id, p.name, COALESCE(SUM(oi.quantity),0) as sold
    FROM products p
    LEFT JOIN order_items oi ON p.id = oi.product_id
    GROUP BY p.id, p.name
    ORDER BY sold DESC
    LIMIT ${limit}
  `).then(res => res.rows || []);
}
