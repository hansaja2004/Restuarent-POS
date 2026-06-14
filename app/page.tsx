import Sidebar from '@/components/sidebar'
import MainPos from '@/components/main-pos'
import { getCategories, getProducts } from './actions/products'
import { getRecentOrders } from './actions/orders'
import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function Page() {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  const categories = await getCategories();
  const products = await getProducts();
  const recentOrders = await getRecentOrders();

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar />

      <MainPos products={products} categories={categories} recentOrders={recentOrders} />
    </div>
  )
}
