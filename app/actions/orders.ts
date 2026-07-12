'use server';

import { db } from '@/lib/db';
import { orders, orderItems, products, posConfig, customers } from '@/lib/db/schema';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { count, desc, eq, and, gte } from 'drizzle-orm';

// Helper to get the start time for the dashboard.
// We return the actual manual dashboard start time so that a session continues until manually ended.
// This prevents past orders from becoming orphaned if the user forgets to click "End Session" at night.
async function getDashboardStartTime() {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  try {
    const row = await db.query.posConfig.findFirst({
      where: eq(posConfig.key, 'dashboard_start_time'),
    });
    if (row && row.value) {
      return new Date(row.value);
    }
  } catch (err) {
    console.error('Failed to get dashboard_start_time:', err);
  }
  return startOfToday;
}

export async function getRecentOrders() {
  const session = await getSession();
  if (!session) return [];

  return await db
    .select({
      id: orders.id,
      status: orders.status,
      totalAmount: orders.totalAmount,
      createdAt: orders.createdAt,
      items: count(orderItems.id),
    })
    .from(orders)
    .leftJoin(orderItems, eq(orders.id, orderItems.orderId))
    .groupBy(orders.id)
    .orderBy(desc(orders.createdAt))
    .limit(3);
}

export async function getOrders() {
  const session = await getSession();
  if (!session) return [];

  const startTime = await getDashboardStartTime();

  const rawData = await db
    .select({
      order: orders,
      item: orderItems,
      product: products,
      customer: customers,
    })
    .from(orders)
    .leftJoin(orderItems, eq(orders.id, orderItems.orderId))
    .leftJoin(products, eq(orderItems.productId, products.id))
    .leftJoin(customers, eq(orders.customerId, customers.id))
    .where(gte(orders.createdAt, startTime))
    .orderBy(desc(orders.createdAt));

  // Group by order in memory
  const orderMap = new Map<number, any>();

  for (const row of rawData) {
    const o = row.order;
    if (!orderMap.has(o.id)) {
      orderMap.set(o.id, {
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        orderType: o.orderType,
        paymentMethod: o.paymentMethod,
        subtotal: o.subtotal,
        taxAmount: o.taxAmount,
        serviceCharge: o.serviceCharge,
        discount: o.discount,
        refundAmount: o.refundAmount,
        refundMethod: o.refundMethod,
        totalAmount: o.totalAmount,
        createdAt: o.createdAt,
        customerName: row.customer ? (row.customer.name || row.customer.phone) : null,
        itemsCount: 0,
        _itemDetails: [] as string[],
        cartItems: [] as any[],
      });
    }

    const mapItem = orderMap.get(o.id);
    if (row.item && row.product) {
      mapItem.itemsCount += row.item.quantity;
      const sizeStr = row.item.size ? ` (${row.item.size})` : '';
      mapItem._itemDetails.push(`${row.item.quantity}x ${row.product.name}${sizeStr}`);
      mapItem.cartItems.push({
        id: `${row.item.productId}-${row.item.size || 'reg'}`,
        productId: row.item.productId,
        name: row.product.name,
        price: parseFloat(row.item.price),
        quantity: row.item.quantity,
        size: row.item.size,
      });
    }
  }

  // Convert map to array and format itemsDetail string
  return Array.from(orderMap.values()).map(o => ({
    ...o,
    items: o.itemsCount,
    itemsDetail: o._itemDetails.join(', '),
  }));
}

/**
 * Legacy simple checkout — used by the original cart-panel flow.
 * Kept for backward-compat with admin pages.
 */
export async function createOrder(items: { productId: number; quantity: number; price: string; size?: string }[]) {
  const session = await getSession();
  if (!session) return { error: 'Unauthorized' };

  if (!items || items.length === 0) return { error: 'No items in order' };

  try {
    const subtotal = items.reduce((sum, item) => sum + (Number.parseFloat(item.price) * item.quantity), 0);
    const totalAmount = subtotal;

    const [newOrder] = await db.insert(orders).values({
      totalAmount: totalAmount.toFixed(2),
      status: 'completed',
    }).returning();

    const itemsToInsert = items.map(item => ({
      orderId: newOrder.id,
      productId: item.productId,
      size: item.size,
      quantity: item.quantity,
      price: item.price,
    }));

    await db.insert(orderItems).values(itemsToInsert);

    revalidatePath('/');
    revalidatePath('/orders');
    revalidatePath('/reports');
    return { success: true, orderId: newOrder.id };
  } catch (error) {
    console.error(error);
    return { error: 'Failed to create order' };
  }
}

/**
 * Full POS checkout — called by the new POS client with complete order data.
 */
export async function createFullOrder(payload: {
  orderNumber?: string;
  items: { productId: number; quantity: number; price: string; size?: string }[];
  subtotal?: number;
  taxAmount?: number;
  serviceCharge?: number;
  discount?: number;
  totalAmount: number;
  status: 'completed' | 'unpaid';
  orderType?: string;
  paymentMethod?: string;
  notes?: string;
  customerId?: number;
}) {
  const session = await getSession();
  if (!session) return { error: 'Unauthorized' };

  if (!payload.items || payload.items.length === 0) return { error: 'No items in order' };

  try {
    const [newOrder] = await db.insert(orders).values({
      orderNumber: payload.orderNumber,
      subtotal: payload.subtotal ? payload.subtotal.toFixed(2) : undefined,
      taxAmount: payload.taxAmount ? payload.taxAmount.toFixed(2) : undefined,
      serviceCharge: payload.serviceCharge ? payload.serviceCharge.toFixed(2) : undefined,
      discount: payload.discount ? payload.discount.toFixed(2) : undefined,
      totalAmount: payload.totalAmount.toFixed(2),
      status: payload.status,
      orderType: payload.orderType || 'Takeaway',
      paymentMethod: payload.paymentMethod || 'Cash',
      customerId: payload.customerId,
    }).returning();

    const itemsToInsert = payload.items.map(item => ({
      orderId: newOrder.id,
      productId: item.productId,
      size: item.size ?? null,
      quantity: item.quantity,
      price: item.price,
    }));

    await db.insert(orderItems).values(itemsToInsert);

    revalidatePath('/');
    revalidatePath('/orders');
    revalidatePath('/reports');
    revalidatePath('/dashboard');
    return { success: true, orderId: newOrder.id };
  } catch (error) {
    console.error(error);
    return { error: 'Failed to create order' };
  }
}

/**
 * Marks an order as refunded (partially or fully) in the database
 */
export async function refundOrder(orderId: number, refundAmount: number, refundMethod: string) {
  const session = await getSession();
  if (!session) return { error: 'Unauthorized' };

  try {
    await db.update(orders)
      .set({ 
        status: 'refunded',
        refundAmount: refundAmount.toFixed(2),
        refundMethod: refundMethod 
      })
      .where(eq(orders.id, orderId));
      
    revalidatePath('/');
    revalidatePath('/orders');
    revalidatePath('/reports');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: 'Failed to refund order' };
  }
}

/**
 * Aggregates order data for the Dashboard view
 */
export async function getDashboardStats() {
  const session = await getSession();
  if (!session) return null;

  try {
    const startTime = await getDashboardStartTime();
    
    const rawData = await db
      .select({
        order: orders,
        item: orderItems,
        product: products,
      })
      .from(orders)
      .leftJoin(orderItems, eq(orders.id, orderItems.orderId))
      .leftJoin(products, eq(orderItems.productId, products.id))
      .where(gte(orders.createdAt, startTime));

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
      
      // Process each order only once
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
              const calculatedSscl = oTax > 0 ? (parseFloat(o.subtotal || '0') + oServ) * (ssclPct / 100) : 0;
              const sscl = Math.min(calculatedSscl, oTax); // Cannot exceed total tax collected
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

      // Process items for item sales
      if ((o.status === 'completed' || o.status === 'refunded') && row.item && row.product) {
        // If the order is fully refunded, we might not count the items, but let's count all items sold.
        // Or we can subtract refunded items. For now, we will just count all completed/refunded order items.
        // Wait, if an order is refunded, we shouldn't count its items as "sales".
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

    return {
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
    };
  } catch (error) {
    console.error(error);
    return null;
  }
}

export async function deleteOrder(orderId: number) {
  const session = await getSession();
  if (!session) return { error: 'Unauthorized' };

  if (!['admin', 'manager', 'director'].includes(session.role)) {
    return { error: 'Forbidden' };
  }

  try {
    await db.delete(orderItems).where(eq(orderItems.orderId, orderId));
    await db.delete(orders).where(eq(orders.id, orderId));

    revalidatePath('/');
    revalidatePath('/orders');
    revalidatePath('/reports');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete order:', error);
    return { error: 'Failed to delete order' };
  }
}
