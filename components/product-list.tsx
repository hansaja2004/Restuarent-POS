'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'

export type Product = {
  id: number
  name: string
  price: string
  smallPrice: string | null
  mediumPrice: string | null
  largePrice: string | null
  categoryId: number
  imageUrl: string | null
}

export type ProductSize = 'S' | 'M' | 'L'

const sizePrices: Record<ProductSize, 'smallPrice' | 'mediumPrice' | 'largePrice'> = {
  S: 'smallPrice',
  M: 'mediumPrice',
  L: 'largePrice',
}

function getAvailableSizes(product: Product) {
  const availableSizes = (Object.keys(sizePrices) as ProductSize[]).filter(
    (size) => Boolean(product[sizePrices[size]]),
  )

  return availableSizes.length > 0 ? availableSizes : (['M'] as ProductSize[])
}

function getProductPrice(product: Product, size: ProductSize) {
  return product[sizePrices[size]] || product.price
}

export default function ProductList({
  initialProducts = [],
  categories = [],
  onAddToCart,
}: Readonly<{
  initialProducts?: Product[]
  categories?: { id: number; name: string }[]
  onAddToCart?: (product: Product, quantity: number, size: ProductSize, price: string) => void
}>) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSizes, setSelectedSizes] = useState<Record<number, ProductSize>>({})
  const [activeCategory, setActiveCategory] = useState<number | null>(categories[0]?.id || null)

  const products = initialProducts.filter((product) => {
    const matchesCategory = activeCategory ? product.categoryId === activeCategory : true
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase())

    return matchesCategory && matchesSearch
  })

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
        {products.map((product) => {
          const availableSizes = getAvailableSizes(product)
          const selectedSize = selectedSizes[product.id] || availableSizes[0]
          const selectedPrice = getProductPrice(product, selectedSize)

          return (
            <div
              key={product.id}
              role="button"
              tabIndex={0}
              onClick={() => onAddToCart?.(product, 1, selectedSize, selectedPrice)}
              onKeyDown={(event) => {
                if (event.key !== 'Enter' && event.key !== ' ') return

                event.preventDefault()
                onAddToCart?.(product, 1, selectedSize, selectedPrice)
              }}
              className="bg-white border border-gray-200 rounded-lg overflow-hidden text-left hover:shadow-md focus:outline-none focus:ring-2 focus:ring-teal-500 transition-shadow cursor-pointer"
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
                <p className="text-xs text-gray-500 mt-1">LKR {selectedPrice} / serving</p>
                <div className="mt-3 flex items-center gap-2">
                  {availableSizes.map((size) => {
                    const isSelected = selectedSize === size

                    return (
                      <span
                        key={size}
                        role="button"
                        tabIndex={0}
                        onClick={(event) => {
                          event.stopPropagation()
                          setSelectedSizes((currentSizes) => ({
                            ...currentSizes,
                            [product.id]: size,
                          }))
                        }}
                        onKeyDown={(event) => {
                          if (event.key !== 'Enter' && event.key !== ' ') return

                          event.preventDefault()
                          event.stopPropagation()
                          setSelectedSizes((currentSizes) => ({
                            ...currentSizes,
                            [product.id]: size,
                          }))
                        }}
                        className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold transition-colors ${
                          isSelected
                            ? 'border-teal-600 bg-teal-600 text-white'
                            : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {size}
                      </span>
                    )
                  })}
                </div>
              </div>
            </div>
          )
        })}
        {products.length === 0 && (
          <div className="col-span-full rounded-lg border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
            No items found.
          </div>
        )}
      </div>
    </div>
  )
}
