'use client'

import Image from 'next/image'

export default function Hero() {
  return (
    <section id="home" className="relative w-full h-[600px] overflow-hidden">
      <Image
        src="/hero-split.png"
        alt="Beautiful plated dish and park scenery"
        fill
        className="object-cover"
        priority
      />
      
      {/* Overlay gradient for text readability */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-black/20"></div>
      
      {/* Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center px-4">
        <h1 className="font-cormorant text-6xl md:text-7xl font-bold text-white text-center mb-2 text-balance">
          Rubber Estate
        </h1>
        <p className="text-xl md:text-2xl text-white/90 text-center mb-8 text-balance">
          Fine Dining in Nature
        </p>
        <p className="text-base md:text-lg text-white/80 text-center mb-12 max-w-md">
          Experience culinary excellence surrounded by natural beauty and tranquility
        </p>
        
        <div className="flex gap-4 flex-wrap justify-center">
          <button className="px-8 py-3 bg-[#1E3F20] text-[#F7F4EF] rounded-md font-semibold hover:bg-[#162f1a] transition-colors">
            View Menu
          </button>
          <button className="px-8 py-3 text-white font-semibold hover:underline transition-colors">
            Explore the Park →
          </button>
        </div>
      </div>
    </section>
  )
}
