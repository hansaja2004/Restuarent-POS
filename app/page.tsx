import LandingPageClient from '@/components/landing-page-client';
import { getCategories, getProducts } from '@/app/actions/products';

export const dynamic = 'force-dynamic'; // Ensure we get fresh menu data

export default async function LandingPage() {
  const [categories, products] = await Promise.all([
    getCategories(),
    getProducts(),
  ]);

  return <LandingPageClient initialCategories={categories} initialProducts={products} />;
}
