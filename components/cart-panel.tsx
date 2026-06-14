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
}: {
  items: CartItem[]
  isSubmitting?: boolean
  orderMessage?: string | null
  onQuantityChange: (productId: number, quantity: number) => void
  onClear: () => void
  onCheckout: () => void
}) {
  const [dineOption, setDineOption] = useState('Dine in')
  const [customerName, setCustomerName] = useState('')
  const [tableLocation, setTableLocation] = useState('')

  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0)
  const discount = subtotal * 0.05
  const tax = (subtotal - discount) * 0.026
  const total = subtotal - discount + tax

  return (
    <div className="bg-white rounded-lg border border-gray-200 flex flex-col h-screen w-full">
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Cart Details</h2>
        <button className="text-gray-500 hover:text-gray-700" aria-label="Preview cart">
          <Eye size={20} />
        </button>
      </div>

      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex gap-2">
          {['Dine in', 'Takeaway', 'Delivery'].map((option) => (
            <button
              key={option}
              onClick={() => setDineOption(option)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
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

      <div className="px-6 py-4 border-b border-gray-200">
        <button className="w-full flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">Customer information</h3>
          <ChevronDown size={18} className="text-gray-500" />
        </button>

        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">Customer name</label>
            <input
              type="text"
              placeholder="Enter name"
              value={customerName}
              onChange={(event) => setCustomerName(event.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">Table location</label>
            <select
              value={tableLocation}
              onChange={(event) => setTableLocation(event.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
            >
              <option value="">Select table</option>
              <option value="Table 1">Table 1</option>
              <option value="Table 2">Table 2</option>
              <option value="Table 3">Table 3</option>
              <option value="Counter">Counter</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-900">Order items</h3>
          <button
            onClick={onClear}
            disabled={items.length === 0}
            className="text-teal-600 hover:text-teal-700 text-xs font-medium disabled:text-gray-400"
          >
            Clear all items
          </button>
        </div>

        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.productId} className="flex gap-3 pb-4 border-b border-gray-200">
              <img
                src={item.image}
                alt={item.name}
                className="w-20 h-20 rounded-lg object-cover"
              />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{item.name}</p>
                <p className="text-sm font-semibold text-gray-900 mt-2">
                  ${item.price.toFixed(2)}
                </p>

                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={() => onQuantityChange(item.productId, item.quantity - 1)}
                    className="p-1 text-gray-500 hover:text-gray-700"
                    aria-label={`Decrease ${item.name}`}
                  >
                    <Minus size={14} />
                  </button>
                  <span className="text-xs font-medium text-gray-900 min-w-6 text-center">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => onQuantityChange(item.productId, item.quantity + 1)}
                    className="p-1 text-gray-500 hover:text-gray-700"
                    aria-label={`Increase ${item.name}`}
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {items.length === 0 && (
            <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
              Add products to start an order.
            </div>
          )}
        </div>
      </div>

      <div className="px-6 py-4 border-b border-gray-200 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Sub total</span>
          <span className="text-sm font-medium text-gray-900">${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Discount (5%)</span>
          <span className="text-sm font-medium text-gray-900">-${discount.toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Tax (2.6%)</span>
          <span className="text-sm font-medium text-gray-900">${tax.toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between pt-3 border-t border-gray-200">
          <span className="text-sm font-semibold text-gray-900">Total amount</span>
          <span className="text-lg font-semibold text-gray-900">${total.toFixed(2)}</span>
        </div>
      </div>

      <div className="px-6 py-4 space-y-3">
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Enter promo code"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
            Apply
          </button>
        </div>

        {orderMessage && (
          <p className="rounded-lg bg-teal-50 px-3 py-2 text-sm font-medium text-teal-700">
            {orderMessage}
          </p>
        )}

        <button
          onClick={onCheckout}
          disabled={items.length === 0 || isSubmitting}
          className="w-full px-4 py-3 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-700 transition-colors disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          {isSubmitting ? 'Processing...' : 'Proceed payment'}
        </button>
      </div>
    </div>
  )
}
