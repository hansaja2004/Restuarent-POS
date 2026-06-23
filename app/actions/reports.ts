'use server';

import { db } from '@/lib/db';
import { orders, orderItems, products, posConfig } from '@/lib/db/schema';
import { sum, sql, and, gte, lte, eq } from 'drizzle-orm';
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

export async function getPastShifts() {
  const session = await getSession();
  if (!session) return [];

  try {
    const row = await db.query.posConfig.findFirst({
      where: eq(posConfig.key, 'past_shifts'),
    });
    if (row && row.value) {
      return JSON.parse(row.value) as { id: string; start: string; end: string }[];
    }
  } catch (err) {
    console.error('Failed to get past shifts:', err);
  }
  return [];
}

export async function getHistoricalDashboardStats(startTime: Date, endTime: Date) {
  const session = await getSession();
  if (!session) return null;

  try {
    const rawData = await db
      .select({
        order: orders,
        item: orderItems,
        product: products,
      })
      .from(orders)
      .leftJoin(orderItems, eq(orders.id, orderItems.orderId))
      .leftJoin(products, eq(orderItems.productId, products.id))
      .where(and(gte(orders.createdAt, startTime), lte(orders.createdAt, endTime)));

    const orderMap = new Map<number, any>();
    const itemSalesMap = new Map<string, { name: string; quantity: number; revenue: number }>();

    let totalAmount = 0;
    let orderCount = 0;
    const typeBreakdown = { DineIn: 0, Takeaway: 0, Online: 0 };
    const paymentBreakdown: Record<string, number> = {};
    const refunds: any[] = [];
    
    let totalTax = 0;
    let totalSSCL = 0;
    let totalVAT = 0;
    let totalServiceCharge = 0;
    let totalDiscount = 0;

    const { getServerConfig } = await import('@/app/actions/settings');
    const config = await getServerConfig();
    const ssclPct = parseFloat(String(config.ssclPercentage || '0'));

    for (const row of rawData) {
      const o = row.order;
      
      if (!orderMap.has(o.id)) {
        orderMap.set(o.id, true);
        
        const amt = parseFloat(o.totalAmount || '0');
        let finalAmt = amt;

        if (o.status === 'completed' || o.status === 'refunded') {
          const refAmt = parseFloat(o.refundAmount || '0');
          const oTax = parseFloat(o.taxAmount || '0');
          const oServ = parseFloat(o.serviceCharge || '0');
          const oDisc = parseFloat(o.discount || '0');

          if (refAmt < amt) {
              orderCount++;
              totalTax += oTax;
              const sscl = (parseFloat(o.subtotal || '0') + oServ) * (ssclPct / 100);
              totalSSCL += sscl;
              totalVAT += (oTax > 0 ? oTax - sscl : 0);
              totalServiceCharge += oServ;
              totalDiscount += oDisc;
          }

          totalAmount += amt;
          totalAmount -= refAmt;

          if (o.orderType === 'Dine in') typeBreakdown.DineIn++;
          else if (o.orderType === 'Online') typeBreakdown.Online++;
          else typeBreakdown.Takeaway++;

          const pm = o.paymentMethod || 'Unknown';
          if (pm.includes('|') || pm.includes(':')) {
              const parts = pm.split('|');
              for (const part of parts) {
                  const [method, amountStr] = part.split(':');
                  if (method && amountStr) {
                      const splitAmt = parseFloat(amountStr);
                      paymentBreakdown[method] = (paymentBreakdown[method] || 0) + splitAmt;
                  }
              }
          } else {
              paymentBreakdown[pm] = (paymentBreakdown[pm] || 0) + amt;
          }

          if (refAmt > 0) {
              const rMethod = o.refundMethod || pm; 
              paymentBreakdown[rMethod] = (paymentBreakdown[rMethod] || 0) - refAmt;
              refunds.push(o);
          }
        }
      }

      if ((o.status === 'completed' || o.status === 'refunded') && row.item && row.product) {
        const isFullyRefunded = parseFloat(o.refundAmount || '0') >= parseFloat(o.totalAmount || '0');
        if (!isFullyRefunded) {
          const sizeStr = row.item.size ? ` (${row.item.size})` : '';
          const itemName = `${row.product.name}${sizeStr}`;
          const itemRev = parseFloat(row.item.price) * row.item.quantity;
          
          const existing = itemSalesMap.get(itemName) || { name: itemName, quantity: 0, revenue: 0 };
          existing.quantity += row.item.quantity;
          existing.revenue += itemRev;
          itemSalesMap.set(itemName, existing);
        }
      }
    }

    const itemSales = Array.from(itemSalesMap.values()).sort((a, b) => b.quantity - a.quantity);

    // Also get the list of orders to display in the Daily Order List equivalent
    const historyOrders = Array.from(new Map(rawData.map(r => [r.order.id, r.order])).values()).sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());

    return {
      stats: {
        totalAmount,
        orderCount,
        totalTax,
        totalSSCL,
        totalVAT,
        totalServiceCharge,
        totalDiscount,
        typeBreakdown,
        paymentBreakdown,
        refundCount: refunds.length,
        refundAmount: refunds.reduce((sum, r) => sum + parseFloat(r.refundAmount || r.totalAmount || '0'), 0),
        itemSales,
      },
      orders: historyOrders
    };
  } catch (error) {
    console.error(error);
    return null;
  }
}
