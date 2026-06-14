'use client'

import { useMemo, useState, useTransition } from 'react'
import OrderQueues from './order-queues'
import CartPanel, { type CartItem } from './cart-panel'
import ProductList, { type Product } from './product-list'
import { createOrder } from '@/app/actions/orders'

type Props = {
  products: Product[]
  categories: { id: number; name: string }[]
  recentOrders: any[]
}

export default function MainPos({ products, categories, recentOrders }: Props) {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [orderMessage, setOrderMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const productsById = useMemo(() => {
    return new Map(products.map((product) => [product.id, product]))
  }, [products])

  const handleAddToCart = (product: Product, quantity: number) => {
    if (quantity < 1) return

    setOrderMessage(null)
    setCartItems((currentItems) => {
      const existingItem = currentItems.find((item) => item.productId === product.id)

      if (existingItem) {
        return currentItems.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item,
        )
      }

      return [
        ...currentItems,
        {
          productId: product.id,
          name: product.name,
          price: Number(product.price),
          quantity,
          image: product.imageUrl || '/spicy-shrimp-rice.png',
        },
      ]
    })
  }

  const handleQuantityChange = (productId: number, quantity: number) => {
    setOrderMessage(null)
    setCartItems((currentItems) =>
      currentItems
        .map((item) => (item.productId === productId ? { ...item, quantity } : item))
        .filter((item) => item.quantity > 0),
    )
  }

  const handleCheckout = () => {
    if (cartItems.length === 0 || isPending) return

    const orderItems = cartItems.map((item) => {
      const product = productsById.get(item.productId)

      return {
        productId: item.productId,
        quantity: item.quantity,
        price: product?.price ?? item.price.toFixed(2),
      }
    })

    startTransition(async () => {
      const result = await createOrder(orderItems)

      if (result.error) {
        setOrderMessage(result.error)
        return
      }

      setCartItems([])
      setOrderMessage(`Order #${result.orderId} paid successfully.`)
    })
  }

  return (
    <div className="flex-1 flex gap-6 p-6 overflow-hidden">
      <div className="flex-1 flex flex-col gap-6 overflow-y-auto">
        <OrderQueues orders={recentOrders} />
        <div className="flex-1 flex gap-6 overflow-hidden">
          <div className="flex-1 min-w-0 overflow-y-auto">
            <ProductList
              initialProducts={products}
              categories={categories}
              onAddToCart={handleAddToCart}
            />
          </div>
        </div>
      </div>

      <div className="w-96 shrink-0 h-full">
        <CartPanel
          items={cartItems}
          isSubmitting={isPending}
          orderMessage={orderMessage}
          onQuantityChange={handleQuantityChange}
          onClear={() => {
            setCartItems([])
            setOrderMessage(null)
          }}
          onCheckout={handleCheckout}
        />
      </div>
    </div>
  )
}
