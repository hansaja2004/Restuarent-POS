'use client'

import { ClipboardList, Eye, Package } from 'lucide-react'

type OrderQueueItem = {
  id: number
  status: string
  totalAmount: string
  createdAt: Date | null
  items: number
}

const statusStyles: Record<string, string> = {
  completed: 'bg-green-100 text-green-700',
  cooking: 'bg-orange-100 text-orange-700',
  cancelled: 'bg-pink-100 text-pink-700',
}

export default function OrderQueues({ orders = [] }: { orders?: OrderQueueItem[] }) {
  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Order queues</h2>
        <div className="flex items-center gap-2">
          <button className="text-gray-500 hover:text-gray-700" aria-label="Preview orders">
            <Eye size={20} />
          </button>
          <button className="text-teal-600 hover:text-teal-700 text-sm font-medium">View All</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {orders.map((order) => {
          const status = order.status || 'completed'
          const createdAt = order.createdAt
            ? new Intl.DateTimeFormat('en-US', {
                dateStyle: 'medium',
                timeStyle: 'short',
              }).format(new Date(order.createdAt))
            : 'Just now'

          return (
            <div
              key={order.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-3 mb-4">
                <span className="text-sm font-semibold text-gray-900">#{order.id}</span>
                <span
                  className={`px-2 py-1 rounded text-xs font-semibold capitalize ${
                    statusStyles[status] || 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {status}
                </span>
              </div>

              <p className="text-sm font-medium text-gray-900 mb-2">
                ${Number(order.totalAmount).toFixed(2)}
              </p>
              <p className="text-xs text-gray-500 mb-4">{createdAt}</p>

              <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
                <div className="flex items-center gap-1 text-gray-600">
                  <Package size={16} />
                  <span className="text-xs">{order.items} Items</span>
                </div>
                <div className="flex items-center gap-1 text-gray-600">
                  <ClipboardList size={16} />
                  <span className="text-xs">POS</span>
                </div>
              </div>
            </div>
          )
        })}
        {orders.length === 0 && (
          <div className="col-span-full rounded-lg border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
            No orders yet.
          </div>
        )}
      </div>
    </div>
  )
}
