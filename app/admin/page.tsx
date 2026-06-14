import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

type OrderStats = {
  total_orders: string | number | null;
  total_revenue: string | number | null;
}

type ProductStats = {
  total_products: string | number | null;
}

export default async function AdminDashboard() {
  // Fetch some stats
  const { rows: [orderStats] } = await db.execute(sql`SELECT count(*) as total_orders, sum(total_amount) as total_revenue FROM orders`);
  const { rows: [productStats] } = await db.execute(sql`SELECT count(*) as total_products FROM products`);
  const typedOrderStats = orderStats as OrderStats | undefined;
  const typedProductStats = productStats as ProductStats | undefined;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Total Revenue</h3>
          <p className="text-3xl font-bold text-gray-900">LKR {typedOrderStats?.total_revenue || '0.00'}</p>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Total Orders</h3>
          <p className="text-3xl font-bold text-gray-900">{typedOrderStats?.total_orders || 0}</p>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Total Products</h3>
          <p className="text-3xl font-bold text-gray-900">{typedProductStats?.total_products || 0}</p>
        </div>
      </div>
    </div>
  );
}
