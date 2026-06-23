import Sidebar from '@/components/sidebar';
import DashboardClient from '@/components/dashboard-client';
import { getSession } from '@/lib/auth';
import { getOrders, getDashboardStats } from '@/app/actions/orders';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  const [orders, stats] = await Promise.all([
    getOrders(),
    getDashboardStats(),
  ]);

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar role={session.role} />
      <div className="flex-1 overflow-y-auto">
        <DashboardClient
          session={session}
          orders={orders}
          stats={stats}
        />
      </div>
    </div>
  );
}
