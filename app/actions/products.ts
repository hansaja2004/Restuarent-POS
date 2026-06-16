'use server';

import { db } from '@/lib/db';
import { products, categories } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth';

export async function getProducts() {
  return await db.query.products.findMany({
    orderBy: (products, { asc }) => [asc(products.name)],
  });
}

export async function getCategories() {
  return await db.query.categories.findMany({
    orderBy: (categories, { asc }) => [asc(categories.id)],
  });
}

export async function createProduct(formData: FormData) {
  const session = await getSession();
  if (session?.role !== 'admin') return { error: 'Unauthorized' };

  const name = formData.get('name') as string;
  const pricingType = formData.get('pricingType') as string;
  const categoryId = Number.parseInt(formData.get('categoryId') as string, 10);
  const imageUrl = formData.get('imageUrl') as string;

  let priceStr: string | null = null;
  let smallPrice: string | null = null;
  let mediumPrice: string | null = null;
  let largePrice: string | null = null;

  if (pricingType === 'single') {
    priceStr = formData.get('price') as string;
  } else {
    smallPrice = formData.get('smallPrice') as string;
    mediumPrice = formData.get('mediumPrice') as string;
    largePrice = formData.get('largePrice') as string;
    priceStr = mediumPrice || smallPrice || largePrice;
  }

  if (!name || !priceStr || !categoryId) return { error: 'Missing required fields' };

  try {
    await db.insert(products).values({
      name,
      price: priceStr,
      smallPrice: smallPrice || null,
      mediumPrice: mediumPrice || null,
      largePrice: largePrice || null,
      categoryId,
      imageUrl: imageUrl || '/spicy-shrimp-rice.png', // Default image
    });
    revalidatePath('/');
    revalidatePath('/admin/products');
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: 'Failed to create product' };
  }
}

export async function deleteProduct(id: number) {
  const session = await getSession();
  if (session?.role !== 'admin') return { error: 'Unauthorized' };

  try {
    await db.delete(products).where(eq(products.id, id));
    revalidatePath('/');
    revalidatePath('/admin/products');
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: 'Failed to delete product' };
  }
}

export async function createCategory(formData: FormData) {
  const session = await getSession();
  if (session?.role !== 'admin') return { error: 'Unauthorized' };

  const name = formData.get('name') as string;
  if (!name) return { error: 'Name is required' };

  try {
    await db.insert(categories).values({ name });
    revalidatePath('/');
    revalidatePath('/admin/products');
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: 'Failed to create category' };
  }
}

export async function deleteCategory(id: number) {
  const session = await getSession();
  if (session?.role !== 'admin') return { error: 'Unauthorized' };

  try {
    await db.delete(categories).where(eq(categories.id, id));
    revalidatePath('/');
    revalidatePath('/admin/products');
    revalidatePath('/menu');
    revalidatePath('/settings');
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: 'Failed to delete category' };
  }
}

export async function updateProduct(id: number, formData: FormData) {
  const session = await getSession();
  if (session?.role !== 'admin') return { error: 'Unauthorized' };

  const name = formData.get('name') as string;
  const pricingType = formData.get('pricingType') as string;
  const categoryId = Number.parseInt(formData.get('categoryId') as string, 10);
  const imageUrl = formData.get('imageUrl') as string;

  let priceStr: string | null = null;
  let smallPrice: string | null = null;
  let mediumPrice: string | null = null;
  let largePrice: string | null = null;

  if (pricingType === 'single') {
    priceStr = formData.get('price') as string;
  } else {
    smallPrice = formData.get('smallPrice') as string;
    mediumPrice = formData.get('mediumPrice') as string;
    largePrice = formData.get('largePrice') as string;
    priceStr = mediumPrice || smallPrice || largePrice;
  }

  if (!name || !priceStr || !categoryId) return { error: 'Missing required fields' };

  try {
    await db
      .update(products)
      .set({ 
        name, 
        price: priceStr, 
        smallPrice: smallPrice || null,
        mediumPrice: mediumPrice || null,
        largePrice: largePrice || null,
        categoryId, 
        imageUrl: imageUrl || undefined 
      })
      .where(eq(products.id, id));
    revalidatePath('/');
    revalidatePath('/settings');
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: 'Failed to update product' };
  }
}

export async function toggleProductAvailability(id: number, isAvailable: boolean) {
  const session = await getSession();
  if (!session || !['admin', 'manager', 'director', 'cashier'].includes(session.role)) {
    return { error: 'Unauthorized' };
  }

  try {
    await db
      .update(products)
      .set({ isAvailable })
      .where(eq(products.id, id));
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: 'Failed to update availability' };
  }
}

