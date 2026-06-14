'use client'

import { useState } from 'react'
import { ChevronDown, Eye, Minus, Plus } from 'lucide-react'

export type CartItem = {
  productId: number
  name: string
  price: number
  quantity: number
  image: string
}

export default function CartPanel({
  items,
  isSubmitting = false,
  orderMessage,
  onQuantityChange,
  onClear,
  onCheckout,
}: Readonly<{
  items: CartItem[]
  isSubmitting?: boolean
  orderMessage?: string | null
  onQuantityChange: (productId: number, quantity: number) => void
  onClear: () => void
  onCheckout: () => void
}>) {
  const [dineOption, setDineOption] = useState('Dine in')
  const [customerName, setCustomerName] = useState('')
  const [tableLocation, setTableLocation] = useState('')

  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0)
  const discount = subtotal * 0.05
  const tax = (subtotal - discount) * 0.026
  const total = subtotal - discount + tax

  return (
    <div className="bg-white rounded-lg border border-gray-200 flex flex-col h-screen w-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <h2 className="text-base font-semibold text-gray-900">Cart</h2>
        <button className="text-gray-500 hover:text-gray-700" aria-label="Preview cart">
          <Eye size={18} />
        </button>
      </div>

      <div className="px-4 py-2 border-b border-gray-200">
        <div className="flex gap-1">
          {['Dine in', 'Takeaway', 'Delivery'].map((option) => (
            <button
              key={option}
              onClick={() => setDineOption(option)}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                dineOption === option
                  ? 'bg-teal-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-2 border-b border-gray-200">
        <button className="w-full flex items-center justify-between">
          <h3 className="text-xs font-semibold text-gray-900">Customer info</h3>
          <ChevronDown size={16} className="text-gray-500" />
        </button>

        <div className="mt-2 space-y-2">
          <div>
            <input
              id="customer-name"
              type="text"
              placeholder="Name"
              value={customerName}
              onChange={(event) => setCustomerName(event.target.value)}
              className="w-full px-2 py-1 border border-gray-300 rounded text-xs text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <select
              id="table-location"
              value={tableLocation}
              onChange={(event) => setTableLocation(event.target.value)}
              className="w-full px-2 py-1 border border-gray-300 rounded text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
            >
              <option value="">Table</option>
              <option value="Table 1">Table 1</option>
              <option value="Table 2">Table 2</option>
              <option value="Table 3">Table 3</option>
              <option value="Counter">Counter</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-2 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-semibold text-gray-900">Items</h3>
          <button
            onClick={onClear}
            disabled={items.length === 0}
            className="text-teal-600 hover:text-teal-700 text-xs font-medium disabled:text-gray-400"
          >
            Clear
          </button>
        </div>

        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.productId} className="flex gap-2 pb-2 border-b border-gray-100">
              <img
                src={item.image}
                alt={item.name}
                className="w-12 h-12 rounded object-cover"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-900 truncate">{item.name}</p>
                <p className="text-xs font-semibold text-gray-900 mt-1">
                  LKR {item.price.toFixed(2)}
                </p>

                <div className="flex items-center gap-1 mt-1">
                  <button
                    onClick={() => onQuantityChange(item.productId, item.quantity - 1)}
                    className="p-0 text-gray-500 hover:text-gray-700"
                    aria-label={`Decrease ${item.name}`}
                  >
                    <Minus size={12} />
                  </button>
                  <span className="text-xs font-medium text-gray-900 min-w-5 text-center">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => onQuantityChange(item.productId, item.quantity + 1)}
                    className="p-0 text-gray-500 hover:text-gray-700"
                    aria-label={`Increase ${item.name}`}
                  >
                    <Plus size={12} />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {items.length === 0 && (
            <div className="rounded border border-dashed border-gray-300 p-3 text-center text-xs text-gray-500">
              Add items
            </div>
          )}
        </div>
      </div>

      <div className="px-4 py-2 border-b border-gray-200 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-600">Sub total</span>
          <span className="font-medium text-gray-900">LKR {subtotal.toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-600">Discount (5%)</span>
          <span className="font-medium text-gray-900">-LKR {discount.toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-600">Tax (2.6%)</span>
          <span className="font-medium text-gray-900">LKR {tax.toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-gray-200">
          <span className="text-xs font-semibold text-gray-900">Total</span>
          <span className="text-sm font-semibold text-gray-900">LKR {total.toFixed(2)}</span>
        </div>
      </div>

      <div className="px-4 py-2 space-y-2">
        {orderMessage && (
          <p className="rounded text-xs font-medium bg-teal-50 px-2 py-1 text-teal-700">
            {orderMessage}
          </p>
        )}

        <button
          onClick={onCheckout}
          disabled={items.length === 0 || isSubmitting}
          className="w-full px-3 py-2 bg-teal-600 text-white text-sm rounded font-semibold hover:bg-teal-700 transition-colors disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          {isSubmitting ? 'Processing...' : 'Pay'}
        </button>
      </div>
    </div>
  )
}
