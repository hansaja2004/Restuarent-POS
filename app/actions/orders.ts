'use server';

import { db } from '@/lib/db';
import { orders, orderItems } from '@/lib/db/schema';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { count, desc, eq } from 'drizzle-orm';

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
    .orderBy(desc(orders.createdAt));
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
  items: { productId: number; quantity: number; price: string; size?: string }[];
  totalAmount: number;
  status: 'completed' | 'unpaid';
  paymentMethod?: string;
  notes?: string;
}) {
  const session = await getSession();
  if (!session) return { error: 'Unauthorized' };

  if (!payload.items || payload.items.length === 0) return { error: 'No items in order' };

  try {
    const [newOrder] = await db.insert(orders).values({
      totalAmount: payload.totalAmount.toFixed(2),
      status: payload.status,
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
    return { success: true, orderId: newOrder.id };
  } catch (error) {
    console.error(error);
    return { error: 'Failed to create order' };
  }
}
