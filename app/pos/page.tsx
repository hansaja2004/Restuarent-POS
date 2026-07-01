import Sidebar from '@/components/sidebar'
import MainPos from '@/components/main-pos'
import { getCategories, getProducts } from '@/app/actions/products'
import { getOrders } from '@/app/actions/orders'
import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function Page() {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  const [categories, products, globalOrders] = await Promise.all([
    getCategories(),
    getProducts(),
    getOrders(),
  ]);

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar role={session.role} />

      <MainPos products={products} categories={categories} session={session} globalOrders={globalOrders} />
    </div>
  )
}
