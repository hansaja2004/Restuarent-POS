'use client'

import { useState } from 'react'
import Image from 'next/image'

const menuData = {
  'Main Meals': [
    { name: 'Grilled Fish Curry', prices: { S: 650, M: 750, L: 950 }, image: '/featured-dish.png' },
    { name: 'Butter Chicken', prices: { S: 600, M: 700, L: 900 }, image: '/featured-dish.png' },
    { name: 'Mutton Curry', prices: { S: 700, M: 800, L: 1000 }, image: '/featured-dish.png' },
    { name: 'Vegetable Stir Fry', prices: { S: 400, M: 500, L: 650 }, image: '/featured-dish.png' },
  ],
  'Noodles': [
    { name: 'Fried Noodles Egg', prices: { S: 500, M: 600, L: 800 }, image: '/featured-dish.png' },
    { name: 'Noodles Chicken', prices: { S: 850, M: 950, L: 1050 }, image: '/featured-dish.png' },
    { name: 'Vegetable Noodles', prices: { S: 450, M: 550, L: 700 }, image: '/featured-dish.png' },
    { name: 'Spicy Noodles', prices: { S: 550, M: 650, L: 850 }, image: '/featured-dish.png' },
  ],
  'Short Eats': [
    { name: 'Spring Rolls', prices: { S: 250, M: 350, L: 450 }, image: '/featured-dish.png' },
    { name: 'Fried Prawns', prices: { S: 400, M: 550, L: 700 }, image: '/featured-dish.png' },
    { name: 'Vegetable Cutlets', prices: { S: 200, M: 300, L: 400 }, image: '/featured-dish.png' },
    { name: 'Fish Cutlets', prices: { S: 300, M: 400, L: 550 }, image: '/featured-dish.png' },
  ],
}

export default function Menu() {
  const [activeCategory, setActiveCategory] = useState('Main Meals')

  const currentMenu = menuData[activeCategory as keyof typeof menuData]

  return (
    <section id="menu" className="py-20 px-4 bg-[#F7F4EF]">
      <div className="max-w-7xl mx-auto">
        <h2 className="font-cormorant text-5xl md:text-6xl font-bold text-[#1E3F20] text-center mb-4">
          Our Menu
        </h2>
        <p className="text-center text-[#2C302E] mb-12 max-w-2xl mx-auto">
          Delicious flavors crafted with fresh ingredients
        </p>

        {/* Category Tabs */}
        <div className="flex justify-center gap-3 mb-12 flex-wrap">
          {Object.keys(menuData).map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-8 py-3 rounded-full font-medium transition-all ${
                activeCategory === category
                  ? 'bg-[#1E8F6E] text-[#F7F4EF]'
                  : 'border-2 border-[#E0DDD8] text-[#2C302E] hover:border-[#1E3F20] bg-white'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Menu Items Grid */}
        <div className="grid md:grid-cols-2 gap-8">
          {currentMenu.map((item, index) => (
            <div key={index} className="bg-white rounded-lg p-6 border border-[#E0DDD8] hover:shadow-md transition-shadow flex gap-6">
              {/* Left - Item Details */}
              <div className="flex-1">
                <h3 className="font-semibold text-[#1E8F6E] text-lg mb-2">
                  {item.name}
                </h3>
                <div className="text-[#2C302E] text-sm space-y-1">
                  <p>S: Rs. {item.prices.S.toFixed(2)}</p>
                  <p>M: Rs. {item.prices.M.toFixed(2)}</p>
                  <p>L: Rs. {item.prices.L.toFixed(2)}</p>
                </div>
              </div>

              {/* Right - Item Image */}
              <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 shadow-sm">
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
