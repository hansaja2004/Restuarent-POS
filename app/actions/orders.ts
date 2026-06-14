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

export async function createOrder(items: { productId: number; quantity: number; price: string }[]) {
  const session = await getSession();
  if (!session) return { error: 'Unauthorized' };

  if (!items || items.length === 0) return { error: 'No items in order' };

  try {
    const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);
    const discount = subtotal * 0.05;
    const tax = (subtotal - discount) * 0.026;
    const totalAmount = subtotal - discount + tax;

    // Create the order
    const [newOrder] = await db.insert(orders).values({
      totalAmount: totalAmount.toFixed(2),
      status: 'completed',
    }).returning();

    // Insert order items
    const itemsToInsert = items.map(item => ({
      orderId: newOrder.id,
      productId: item.productId,
      quantity: item.quantity,
      price: item.price,
    }));

    await db.insert(orderItems).values(itemsToInsert);

    revalidatePath('/');
    return { success: true, orderId: newOrder.id };
  } catch (error) {
    console.error(error);
    return { error: 'Failed to create order' };
  }
}
