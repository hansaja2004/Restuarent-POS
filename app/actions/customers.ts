'use server';

import { db } from '@/lib/db';
import { customers, orders, orderItems, products } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function getCustomerByPhone(phone: string) {
  const session = await getSession();
  if (!session) return { error: 'Unauthorized' };

  try {
    const customer = await db.query.customers.findFirst({
      where: eq(customers.phone, phone),
    });
    return { data: customer || null };
  } catch (err: any) {
    console.error('getCustomerByPhone error:', err);
    return { error: 'Failed to fetch customer' };
  }
}

export async function createCustomer(payload: { name?: string; phone: string; email?: string }) {
  const session = await getSession();
  if (!session) return { error: 'Unauthorized' };

  try {
    const [newCustomer] = await db.insert(customers).values({
      name: payload.name || null,
      phone: payload.phone,
      email: payload.email || null,
    }).returning();
    
    revalidatePath('/customers');
    return { data: newCustomer };
  } catch (err: any) {
    console.error('createCustomer error:', err);
    if (err.message?.includes('duplicate key value') || err.message?.includes('unique constraint')) {
      return { error: 'A customer with this phone or email already exists' };
    }
    return { error: 'Failed to create customer' };
  }
}

export async function getAllCustomers() {
  const session = await getSession();
  if (!session) return { error: 'Unauthorized' };

  try {
    const allCustomers = await db.query.customers.findMany({
      orderBy: [desc(customers.createdAt)],
    });
    return { data: allCustomers };
  } catch (err: any) {
    console.error('getAllCustomers error:', err);
    return { error: 'Failed to fetch customers' };
  }
}

export async function getCustomerOrderHistory(customerId: number) {
  const session = await getSession();
  if (!session) return { error: 'Unauthorized' };

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
      .where(eq(orders.customerId, customerId))
      .orderBy(desc(orders.createdAt));

    const orderMap = new Map<number, any>();

    for (const row of rawData) {
      const o = row.order;
      if (!orderMap.has(o.id)) {
        orderMap.set(o.id, {
          ...o,
          itemsCount: 0,
          _itemDetails: [] as string[],
        });
      }

      const mapItem = orderMap.get(o.id);
      if (row.item && row.product) {
        mapItem.itemsCount += row.item.quantity;
        const sizeStr = row.item.size ? ` (${row.item.size})` : '';
        mapItem._itemDetails.push(`${row.item.quantity}x ${row.product.name}${sizeStr}`);
      }
    }

    const result = Array.from(orderMap.values()).map(o => ({
      ...o,
      itemsDetail: o._itemDetails.join(', '),
    }));

    return { data: result };
  } catch (err: any) {
    console.error('getCustomerOrderHistory error:', err);
    return { error: 'Failed to fetch order history' };
  }
}

export async function searchCustomers(query: string) {
  const session = await getSession();
  if (!session) return { error: 'Unauthorized' };
  
  if (!query || query.trim() === '') return { data: [] };

  try {
    const rawQuery = query.trim().toLowerCase();
    const result = await db.query.customers.findMany({
      where: (customers, { or, ilike }) => or(
        ilike(customers.phone, `%${rawQuery}%`),
        ilike(customers.name, `%${rawQuery}%`)
      ),
      limit: 5,
    });
    return { data: result };
  } catch (err: any) {
    console.error('searchCustomers error:', err);
    return { error: 'Failed to search customers' };
  }
}

export async function updateCustomer(id: number, payload: { name?: string; phone: string; email?: string }) {
  const session = await getSession();
  if (!session) return { error: 'Unauthorized' };

  try {
    const [updated] = await db.update(customers)
      .set({
        name: payload.name || null,
        phone: payload.phone,
        email: payload.email || null,
      })
      .where(eq(customers.id, id))
      .returning();
      
    revalidatePath('/customers');
    return { data: updated };
  } catch (err: any) {
    console.error('updateCustomer error:', err);
    if (err.message?.includes('duplicate key value') || err.message?.includes('unique constraint')) {
      return { error: 'A customer with this phone or email already exists' };
    }
    return { error: 'Failed to update customer' };
  }
}

export async function deleteCustomer(id: number) {
  const session = await getSession();
  if (!session) return { error: 'Unauthorized' };

  try {
    // Un-link orders so financial reports remain accurate
    await db.update(orders)
      .set({ customerId: null })
      .where(eq(orders.customerId, id));

    await db.delete(customers)
      .where(eq(customers.id, id));
      
    revalidatePath('/customers');
    return { success: true };
  } catch (err: any) {
    console.error('deleteCustomer error:', err);
    return { error: 'Failed to delete customer' };
  }
}
