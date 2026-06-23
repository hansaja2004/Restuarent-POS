import Sidebar from '@/components/sidebar';
import MenuClient from '@/components/menu-client';
import { getSession } from '@/lib/auth';
import { getProducts, getCategories } from '@/app/actions/products';
import { redirect } from 'next/navigation';

export default async function MenuPage() {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  const [products, categories] = await Promise.all([
    getProducts(),
    getCategories(),
  ]);

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar role={session.role} />
      <div className="flex-1 overflow-y-auto">
        <MenuClient
          session={session}
          initialProducts={products}
          initialCategories={categories}
        />
      </div>
    </div>
  );
}
