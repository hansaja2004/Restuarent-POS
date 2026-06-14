import Sidebar from '@/components/sidebar'
import { getSalesSummary, getTopProducts } from '@/app/actions/reports'

export default async function ReportsPage() {
  const summary = await getSalesSummary();
  const top = await getTopProducts(10);

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 overflow-y-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Sales Reports</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Total Revenue</h3>
            <p className="text-3xl font-bold text-gray-900">LKR {Number(summary.totalRevenue).toFixed(2)}</p>
          </div>
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Total Orders</h3>
            <p className="text-3xl font-bold text-gray-900">{summary.totalOrders}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">Top Products</h2>
          </div>
          <div className="p-6">
            <ul className="space-y-3 text-sm text-gray-700">
              {top.map((t: any) => (
                <li key={t.id} className="flex items-center justify-between">
                  <span>{t.name}</span>
                  <span className="font-medium">{t.sold}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
