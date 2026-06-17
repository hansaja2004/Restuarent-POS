'use server';

import { db } from '@/lib/db';
import { posConfig, orders, orderItems } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import type { TaxConfig } from '@/lib/escpos';

const CONFIG_KEY = 'pos_main_config';

export async function getServerConfig(): Promise<Partial<TaxConfig>> {
  const session = await getSession();
  if (!session) return {};

  try {
    const row = await db.query.posConfig.findFirst({
      where: eq(posConfig.key, CONFIG_KEY),
    });
    if (row) {
      return JSON.parse(row.value) as Partial<TaxConfig>;
    }
  } catch (err) {
    console.error('Failed to fetch server config:', err);
  }
  return {};
}

export async function saveServerConfig(data: TaxConfig) {
  const session = await getSession();
  if (!session || (session.role !== 'admin' && session.role !== 'manager')) {
    return { error: 'Unauthorized' };
  }

  try {
    const existing = await db.query.posConfig.findFirst({
      where: eq(posConfig.key, CONFIG_KEY),
    });

    const value = JSON.stringify(data);

    if (existing) {
      await db.update(posConfig).set({ value }).where(eq(posConfig.key, CONFIG_KEY));
    } else {
      await db.insert(posConfig).values({ key: CONFIG_KEY, value });
    }

    return { success: true };
  } catch (err) {
    console.error('Failed to save server config:', err);
    return { error: 'Failed to save configuration' };
  }
}

export async function resetDashboardTime() {
  const session = await getSession();
  if (!session || (session.role !== 'admin' && session.role !== 'manager')) {
    return { error: 'Unauthorized' };
  }

  try {
    const key = 'dashboard_start_time';
    const value = new Date().toISOString();
    const existing = await db.query.posConfig.findFirst({
      where: eq(posConfig.key, key),
    });

    if (existing) {
      await db.update(posConfig).set({ value }).where(eq(posConfig.key, key));
    } else {
      await db.insert(posConfig).values({ key, value });
    }

    revalidatePath('/dashboard');
    return { success: true };
  } catch (err) {
    console.error('Failed to reset dashboard time:', err);
    return { error: 'Failed to reset dashboard' };
  }
}

export async function wipeAllTransactions() {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return { error: 'Unauthorized. Only admins can wipe transactions.' };
  }

  try {
    // Delete all order items first to satisfy foreign key constraints
    await db.delete(orderItems);
    // Then delete all orders
    await db.delete(orders);
    
    // Also reset the dashboard time so it starts fresh
    const key = 'dashboard_start_time';
    const existing = await db.query.posConfig.findFirst({
      where: eq(posConfig.key, key),
    });
    if (existing) {
      await db.update(posConfig).set({ value: new Date().toISOString() }).where(eq(posConfig.key, key));
    }

    revalidatePath('/dashboard');
    revalidatePath('/orders');
    revalidatePath('/reports');
    return { success: true };
  } catch (err) {
    console.error('Failed to wipe transactions:', err);
    return { error: 'Failed to wipe transactions' };
  }
}
