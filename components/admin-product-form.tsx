'use client'

import { useState } from 'react'
import { createProduct } from '@/app/actions/products'

type Category = {
  id: number
  name: string
}

type SizeField = {
  key: 'small' | 'medium' | 'large'
  label: 'S' | 'M' | 'L'
  name: 'smallPrice' | 'mediumPrice' | 'largePrice'
  placeholder: string
}

const sizeFields: SizeField[] = [
  { key: 'small', label: 'S', name: 'smallPrice', placeholder: 'Small price' },
  { key: 'medium', label: 'M', name: 'mediumPrice', placeholder: 'Medium price' },
  { key: 'large', label: 'L', name: 'largePrice', placeholder: 'Large price' },
]

export default function AdminProductForm({ categories }: { categories: Category[] }) {
  const [availableSizes, setAvailableSizes] = useState({
    small: false,
    medium: true,
    large: false,
  })

  const hasAvailableSize = Object.values(availableSizes).some(Boolean)

  return (
    <form
      action={createProduct}
      className="space-y-4"
    >
      <div>
        <label htmlFor="admin-product-name" className="block text-sm font-medium text-gray-700 mb-1">Name</label>
        <input id="admin-product-name" name="name" type="text" required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none" />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Available sizes</label>
        <div className="space-y-3">
          {sizeFields.map((size) => {
            const isAvailable = availableSizes[size.key]
            const checkboxId = `admin-product-${size.key}-available`
            const inputId = `admin-product-${size.key}-price`

            return (
              <div key={size.key} className="flex items-center gap-3 rounded-lg border border-gray-200 p-3">
                <input
                  id={checkboxId}
                  type="checkbox"
                  checked={isAvailable}
                  onChange={(event) =>
                    setAvailableSizes((currentSizes) => ({
                      ...currentSizes,
                      [size.key]: event.target.checked,
                    }))
                  }
                  className="h-4 w-4 accent-teal-600"
                />
                <label
                  htmlFor={checkboxId}
                  className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold ${
                    isAvailable
                      ? 'border-teal-600 bg-teal-600 text-white'
                      : 'border-gray-300 text-gray-500'
                  }`}
                >
                  {size.label}
                </label>
                <input
                  id={inputId}
                  name={size.name}
                  type="number"
                  step="0.01"
                  min="0"
                  required={isAvailable}
                  disabled={!isAvailable}
                  placeholder={size.placeholder}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none disabled:bg-gray-100 disabled:text-gray-400"
                />
              </div>
            )
          })}
        </div>
        {!hasAvailableSize && (
          <p className="mt-2 text-xs font-medium text-red-600">Select at least one size.</p>
        )}
      </div>

      <div>
        <label htmlFor="admin-product-category" className="block text-sm font-medium text-gray-700 mb-1">Category</label>
        <select id="admin-product-category" name="categoryId" required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none">
          <option value="">Select a category</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="admin-product-image" className="block text-sm font-medium text-gray-700 mb-1">Image URL (optional)</label>
        <input id="admin-product-image" name="imageUrl" type="text" placeholder="/spicy-shrimp-rice.png" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none" />
      </div>

      <button
        type="submit"
        disabled={!hasAvailableSize}
        className="w-full bg-teal-600 text-white py-2 rounded-lg font-medium hover:bg-teal-700 transition-colors disabled:cursor-not-allowed disabled:bg-gray-300"
      >
        Add Product
      </button>
    </form>
  )
}
