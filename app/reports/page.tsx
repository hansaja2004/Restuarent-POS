import Sidebar from '@/components/sidebar'
import ReportsClient from '@/components/reports-client'
import { getPastShifts } from '@/app/actions/reports'
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function ReportsPage() {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  const pastShifts = await getPastShifts();

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar role={session.role} />
      <div className="flex-1 overflow-y-auto">
        <ReportsClient pastShifts={pastShifts} />
      </div>
    </div>
  )
}
