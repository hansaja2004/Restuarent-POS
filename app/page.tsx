import Sidebar from '@/components/sidebar'
import OrderQueues from '@/components/order-queues'
import PosShell from '@/components/pos-shell'
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

      {/* Main Content */}
      <div className="flex-1 flex gap-6 p-6 overflow-hidden">
        {/* Center Panel */}
        <div className="flex-1 flex flex-col gap-6 overflow-y-auto">
          <OrderQueues orders={recentOrders} />
          <div className="flex gap-6">
            <PosShell products={products} categories={categories} />
          </div>
        </div>
      </div>
    </div>
  )
}
