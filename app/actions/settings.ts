'use server';

import { db } from '@/lib/db';
import { posConfig } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getSession } from '@/lib/auth';
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
