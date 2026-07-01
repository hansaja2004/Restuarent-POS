'use client'

import { useState } from 'react'
import Image from 'next/image'

export default function Menu({
  initialCategories,
  initialProducts,
}: {
  initialCategories: any[];
  initialProducts: any[];
}) {
  const [activeCategoryId, setActiveCategoryId] = useState(
    initialCategories.length > 0 ? initialCategories[0].id : null
  );

  const activeCategoryProducts = initialProducts.filter(
    (p) => p.categoryId === activeCategoryId && p.isAvailable
  );

  return (
    <section id="menu" className="py-16 md:py-24 px-4 bg-transparent relative z-10">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10 md:mb-16">
          <h2 className="font-cormorant text-4xl md:text-7xl font-bold text-[#1E3F20] mb-4 md:mb-6 tracking-tight">
            Our Menu
          </h2>
        </div>

        {/* Modern Category Tabs */}
        <div className="flex justify-center gap-y-3 gap-x-2 sm:gap-6 mb-10 md:mb-16 flex-wrap">
          {initialCategories.map((category) => {
            const isActive = activeCategoryId === category.id;
            return (
              <button
                key={category.id}
                onClick={() => setActiveCategoryId(category.id)}
                className={`relative px-6 py-2 text-sm sm:text-base font-semibold tracking-widest uppercase transition-colors duration-300 ${
                  isActive ? 'text-[#1E3F20]' : 'text-[#8A8D8B] hover:text-[#1E3F20]'
                }`}
              >
                {category.name}
                {isActive && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-[#A05740] rounded-full transition-all duration-300" />
                )}
              </button>
            )
          })}
        </div>

        {/* Premium Menu Items Grid */}
        <div className="grid lg:grid-cols-2 gap-x-12 gap-y-6 md:gap-y-10">
          {activeCategoryProducts.map((item, index) => (
            <div 
              key={item.id} 
              className="group flex flex-row items-center sm:items-start gap-4 sm:gap-6 p-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-[#1E3F20]/15 hover:border-[#1E3F20]/30 hover:shadow-xl transition-all duration-500"
            >
              {/* Item Image */}
              <div className="relative w-20 h-20 sm:w-32 sm:h-32 rounded-xl overflow-hidden flex-shrink-0 bg-[#F4F1EB] border-2 border-[#E0DDD8]">
                {item.imageUrl ? (
                  <Image
                    src={item.imageUrl}
                    alt={item.name}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="font-cormorant text-2xl text-[#1E3F20]/20 italic">RE</span>
                  </div>
                )}
              </div>

              {/* Item Details */}
              <div className="flex-1 flex flex-col justify-center w-full">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-2 sm:gap-4 mb-2 sm:mb-3">
                  <h3 className="font-cormorant text-xl sm:text-2xl md:text-3xl font-bold text-[#1E3F20] leading-tight">
                    {item.name}
                  </h3>
                  
                  {/* Prices for single price items */}
                  {!(item.smallPrice || item.mediumPrice || item.largePrice) && (
                    <span className="font-semibold text-[#A05740] text-lg whitespace-nowrap">
                      Rs. {item.price}
                    </span>
                  )}
                </div>

                <div className="w-full border-t border-dashed border-[#1E3F20]/20 my-2"></div>

                {/* Prices for multi-size items */}
                <div className="mt-2 text-[#2C302E]/80 text-sm font-medium flex flex-wrap gap-x-6 gap-y-2">
                  {item.smallPrice || item.mediumPrice || item.largePrice ? (
                    <>
                      {item.smallPrice && (
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-[#1E3F20]/10 flex items-center justify-center text-xs text-[#1E3F20]">S</span>
                          <span>Rs. {item.smallPrice}</span>
                        </div>
                      )}
                      {item.mediumPrice && (
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-[#1E3F20]/10 flex items-center justify-center text-xs text-[#1E3F20]">M</span>
                          <span>Rs. {item.mediumPrice}</span>
                        </div>
                      )}
                      {item.largePrice && (
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-[#1E3F20]/10 flex items-center justify-center text-xs text-[#1E3F20]">L</span>
                          <span>Rs. {item.largePrice}</span>
                        </div>
                      )}
                    </>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
          {activeCategoryProducts.length === 0 && (
            <div className="col-span-1 lg:col-span-2 flex flex-col items-center justify-center py-20 text-[#8A8D8B]">
              <div className="w-16 h-16 mb-4 rounded-full bg-[#F4F1EB] flex items-center justify-center">
                <span className="font-cormorant text-2xl italic">RE</span>
              </div>
              <p className="text-lg">New culinary experiences coming soon to this category.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
