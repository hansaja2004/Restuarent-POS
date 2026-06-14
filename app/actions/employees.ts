'use server';

import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { getSession } from '@/lib/auth';

export async function getUsers() {
  const session = await getSession();
  if (!session) return [];

  return await db.query.users.findMany({
    orderBy: (u, { asc }) => [asc(u.username)],
  });
}

export async function createUser(formData: FormData) {
  const session = await getSession();
  if (session?.role !== 'admin') return { error: 'Unauthorized' };

  const username = formData.get('username') as string;
  const password = formData.get('password') as string;
  const role = (formData.get('role') as string) || 'cashier';

  if (!username || !password) return { error: 'Missing fields' };

  try {
    await db.insert(users).values({ username, password, role });
    revalidatePath('/employees');
    revalidatePath('/admin/employees');
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: 'Failed to create user' };
  }
}

export async function deleteUser(id: number) {
  const session = await getSession();
  if (session?.role !== 'admin') return { error: 'Unauthorized' };

  try {
    await db.delete(users).where(eq(users.id, id));
    revalidatePath('/employees');
    revalidatePath('/admin/employees');
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: 'Failed to delete user' };
  }
}
