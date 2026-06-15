import Sidebar from '@/components/sidebar'
import { getOrders } from '@/app/actions/orders'

export default async function OrdersPage() {
  const orders = await getOrders();

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 overflow-y-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Orders</h1>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">All Orders</h2>
          </div>
          <div className="overflow-x-auto p-6">
            <table className="w-full text-left text-sm text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th className="px-6 py-3">Order #</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Items</th>
                  <th className="px-6 py-3">Total</th>
                  <th className="px-6 py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o.id} className="border-b">
                    <td className="px-6 py-4 font-medium text-gray-900">#{o.id}</td>
                    <td className="px-6 py-4">{o.status}</td>
                    <td className="px-6 py-4">{o.items}</td>
                    <td className="px-6 py-4">LKR {Number(o.totalAmount).toFixed(2)}</td>
                    <td className="px-6 py-4">
                      {o.createdAt ? new Date(o.createdAt).toLocaleString() : 'Unknown'}
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr><td colSpan={5} className="px-6 py-4 text-center">No orders found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
