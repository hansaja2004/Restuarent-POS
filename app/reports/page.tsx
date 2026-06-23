import Sidebar from '@/components/sidebar'
import ReportsClient from '@/components/reports-client'
import { getPastShifts } from '@/app/actions/reports'

export default async function ReportsPage() {
  const pastShifts = await getPastShifts();

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 overflow-y-auto">
        <ReportsClient pastShifts={pastShifts} />
      </div>
    </div>
  )
}
