'use client'

import { useState } from 'react'
import { Minus, Plus, Search } from 'lucide-react'

export type Product = {
  id: number
  name: string
  price: string
  categoryId: number
  imageUrl: string | null
}

export default function ProductList({
  initialProducts = [],
  categories = [],
  onAddToCart,
}: Readonly<{
  initialProducts?: Product[]
  categories?: { id: number; name: string }[]
  onAddToCart?: (product: Product, quantity: number) => void
}>) {
  const [quantities, setQuantities] = useState<{ [key: number]: number }>({})
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<number | null>(categories[0]?.id || null)

  const products = initialProducts.filter((product) => {
    const matchesCategory = activeCategory ? product.categoryId === activeCategory : true
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase())

    return matchesCategory && matchesSearch
  })

  const handleQuantityChange = (id: number, delta: number) => {
    const newQuantity = Math.max(0, (quantities[id] || 0) + delta)
    setQuantities((prev) => ({
      ...prev,
      [id]: newQuantity,
    }))
    
    // Auto-add to cart when quantity becomes > 0
    if (newQuantity > 0 && ((quantities[id] || 0) === 0)) {
      const product = initialProducts.find(p => p.id === id)
      if (product) {
        onAddToCart?.(product, newQuantity)
        setQuantities((prev) => ({ ...prev, [id]: 0 }))
      }
    }
  }

  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200">
      <div className="flex items-center justify-between gap-4 mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Lists</h2>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setActiveCategory(null)}
            className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            All items
          </button>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 border border-gray-300">
            <Search size={18} className="text-gray-500" />
            <input
              type="text"
              placeholder="Search for food"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="bg-transparent outline-none text-sm text-gray-700 w-48 placeholder:text-gray-500"
            />
          </div>
        </div>
      </div>

      <div className="flex gap-4 mb-6 overflow-x-auto pb-2">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              activeCategory === cat.id
                ? 'bg-teal-50 text-teal-700 border border-teal-200'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 lg:grid-cols-2 gap-6">
        {products.map((product) => (
          <div
            key={product.id}
            className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
          >
            <div className="aspect-square bg-gray-200 overflow-hidden">
              <img
                src={product.imageUrl || '/spicy-shrimp-rice.png'}
                alt={product.name}
                className="w-full h-full object-cover hover:scale-105 transition-transform"
              />
            </div>

            <div className="p-4">
              <p className="text-sm font-semibold text-gray-900">{product.name}</p>
              <p className="text-xs text-gray-500 mt-1">LKR {product.price} / serving</p>

            <div className="mt-4 flex items-center gap-2">
                <div className="flex items-center border border-gray-300 rounded-lg flex-1 justify-center">
                  <button
                    onClick={() => handleQuantityChange(product.id, -1)}
                    className="p-1 text-gray-500 hover:text-gray-700"
                    aria-label={`Decrease ${product.name}`}
                  >
                    <Minus size={16} />
                  </button>
                  <span className="px-3 py-1 text-sm font-medium text-gray-900 min-w-8 text-center">
                    {quantities[product.id] || 0}
                  </span>
                  <button
                    onClick={() => handleQuantityChange(product.id, 1)}
                    className="p-1 text-gray-500 hover:text-gray-700"
                    aria-label={`Increase ${product.name}`}
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
        {products.length === 0 && (
          <div className="col-span-full rounded-lg border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
            No items found.
          </div>
        )}
      </div>
    </div>
  )
}
