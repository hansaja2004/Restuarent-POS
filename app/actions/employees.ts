'use server';

import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { getSession } from '@/lib/auth';
import * as bcrypt from 'bcryptjs';

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
  const employeeId = (formData.get('employeeId') as string) || null;

  if (!username || !password) return { error: 'Missing fields' };

  try {
    const hashed = await bcrypt.hash(password, 10);
    await db.insert(users).values({ username, password: hashed, role, employeeId });
    revalidatePath('/employees');
    revalidatePath('/settings');
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: 'Failed to create user. Username or Employee ID may already exist.' };
  }
}

export async function updateUser(id: number, formData: FormData) {
  const session = await getSession();
  if (session?.role !== 'admin') return { error: 'Unauthorized' };

  const username = formData.get('username') as string;
  const role = formData.get('role') as string;
  const employeeId = (formData.get('employeeId') as string) || null;

  if (!username || !role) return { error: 'Missing fields' };

  try {
    await db
      .update(users)
      .set({ username, role, employeeId })
      .where(eq(users.id, id));
    revalidatePath('/employees');
    revalidatePath('/settings');
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: 'Failed to update user. Username or Employee ID may be taken.' };
  }
}

export async function changeUserPassword(id: number, newPassword: string) {
  const session = await getSession();
  // Admin can change anyone; users can change their own
  if (!session || (session.role !== 'admin' && session.userId !== id)) {
    return { error: 'Unauthorized' };
  }

  if (!newPassword || newPassword.length < 4) {
    return { error: 'Password must be at least 4 characters' };
  }

  try {
    const hashed = await bcrypt.hash(newPassword, 10);
    await db.update(users).set({ password: hashed }).where(eq(users.id, id));
    revalidatePath('/settings');
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: 'Failed to change password' };
  }
}

export async function deleteUser(id: number) {
  const session = await getSession();
  if (session?.role !== 'admin') return { error: 'Unauthorized' };

  // Prevent deleting yourself
  if (session.userId === id) return { error: 'Cannot delete your own account' };

  try {
    await db.delete(users).where(eq(users.id, id));
    revalidatePath('/employees');
    revalidatePath('/settings');
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: 'Failed to delete user' };
  }
}
