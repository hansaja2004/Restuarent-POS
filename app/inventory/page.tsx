import Sidebar from '@/components/sidebar'
import { getTopProducts } from '@/app/actions/reports'

export default async function InventoryPage() {
  const top = await getTopProducts(50);

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 overflow-y-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Inventory Reports</h1>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">Products Sold</h2>
            <p className="text-sm text-gray-500">Quantity sold per product (used as inventory movement metric).</p>
          </div>
          <div className="p-6">
            <table className="w-full text-left text-sm text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th className="px-6 py-3">Product</th>
                  <th className="px-6 py-3">Sold</th>
                </tr>
              </thead>
              <tbody>
                {top.map((p: any) => (
                  <tr key={p.id} className="border-b">
                    <td className="px-6 py-4 font-medium text-gray-900">{p.name}</td>
                    <td className="px-6 py-4">{p.sold}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
