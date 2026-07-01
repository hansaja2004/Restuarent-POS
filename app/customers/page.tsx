import Sidebar from '@/components/sidebar'
import CustomersClient from '@/components/customers-client'
import { getAllCustomers } from '@/app/actions/customers'
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function CustomersPage() {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  const res = await getAllCustomers();
  const customers = res.data || [];

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar role={session.role} />
      <div className="flex-1 overflow-y-auto">
        <CustomersClient initialCustomers={customers} />
      </div>
    </div>
  )
}
