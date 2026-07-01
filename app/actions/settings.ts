'use server';

import { db } from '@/lib/db';
import net from 'net';
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

// Fetches non-sensitive / server-only config for the public landing page (does not require session)
export async function getPublicLandingConfig(): Promise<Partial<TaxConfig>> {
  try {
    const row = await db.query.posConfig.findFirst({
      where: eq(posConfig.key, CONFIG_KEY),
    });
    if (row) {
      const fullConfig = JSON.parse(row.value) as Partial<TaxConfig>;
      return {
        storeStatusOverride: fullConfig.storeStatusOverride,
        autoOpenTime: fullConfig.autoOpenTime,
        autoCloseTime: fullConfig.autoCloseTime,
        googlePlacesApiKey: fullConfig.googlePlacesApiKey,
        googlePlaceId: fullConfig.googlePlaceId,
        landingActivities: fullConfig.landingActivities,
        landingGallery: fullConfig.landingGallery,
        landingHoursList: fullConfig.landingHoursList,
        landingHoursBanner: fullConfig.landingHoursBanner,
        landingHeroImage: fullConfig.landingHeroImage,
      };
    }
  } catch (err) {
    console.error('Failed to fetch public landing config:', err);
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

    revalidatePath('/');
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
    const newTime = new Date().toISOString();
    const existing = await db.query.posConfig.findFirst({
      where: eq(posConfig.key, key),
    });

    // Record the past shift if there was an active one
    if (existing && existing.value) {
      const shiftStart = existing.value;
      const shiftEnd = newTime;
      
      const shiftsKey = 'past_shifts';
      const shiftsRow = await db.query.posConfig.findFirst({
        where: eq(posConfig.key, shiftsKey),
      });

      const pastShifts = shiftsRow ? JSON.parse(shiftsRow.value) : [];
      pastShifts.unshift({
        id: Date.now().toString(),
        start: shiftStart,
        end: shiftEnd,
      }); // unshift to keep newest first

      const shiftsValue = JSON.stringify(pastShifts);
      if (shiftsRow) {
        await db.update(posConfig).set({ value: shiftsValue }).where(eq(posConfig.key, shiftsKey));
      } else {
        await db.insert(posConfig).values({ key: shiftsKey, value: shiftsValue });
      }
    }

    if (existing) {
      await db.update(posConfig).set({ value: newTime }).where(eq(posConfig.key, key));
    } else {
      await db.insert(posConfig).values({ key, value: newTime });
    }

    revalidatePath('/dashboard');
    revalidatePath('/reports');
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

export async function printToNetworkPrinter(ip: string, port: number, bytes: number[]) {
  return new Promise<{ success?: boolean; error?: string }>((resolve) => {
    const client = new net.Socket();
    client.setTimeout(5000);

    client.connect(port, ip, () => {
      client.write(Buffer.from(bytes), () => {
        client.destroy();
        resolve({ success: true });
      });
    });

    client.on('error', (err) => {
      client.destroy();
      resolve({ error: err.message });
    });

    client.on('timeout', () => {
      client.destroy();
      resolve({ error: 'Connection timed out' });
    });
  });
}
