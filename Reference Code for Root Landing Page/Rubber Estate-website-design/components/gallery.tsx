'use client'

import Image from 'next/image'

const galleryImages = [
  {
    src: '/gallery-cocktail.png',
    alt: 'Elegant cocktail',
    size: 'large',
  },
  {
    src: '/gallery-park.png',
    alt: 'Park landscape',
    size: 'medium',
  },
  {
    src: '/gallery-people.png',
    alt: 'People dining',
    size: 'medium',
  },
  {
    src: '/gallery-sunset.png',
    alt: 'Sunset over park',
    size: 'large',
  },
  {
    src: '/featured-dish.png',
    alt: 'Gourmet dish',
    size: 'medium',
  },
  {
    src: '/hero-split.png',
    alt: 'Park bistro scene',
    size: 'medium',
  },
]

export default function Gallery() {
  return (
    <section id="gallery" className="py-20 px-4 bg-[#F7F4EF]">
      <div className="max-w-7xl mx-auto">
        <h2 className="font-cormorant text-5xl md:text-6xl font-bold text-[#1E3F20] text-center mb-4">
          Gallery
        </h2>
        <p className="text-center text-[#2C302E] mb-12 max-w-2xl mx-auto">
          Moments captured. Memories made. Experience the beauty of our place.
        </p>

        {/* Creative Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {galleryImages.map((image, index) => {
            let colSpan = 'md:col-span-2'
            
            if (image.size === 'large') {
              colSpan = 'md:col-span-2 md:row-span-2'
            }
            
            return (
              <div
                key={index}
                className={`${colSpan} relative overflow-hidden rounded-lg shadow-sm hover:shadow-md transition-shadow border border-[#E0DDD8] group cursor-pointer`}
                style={{ height: image.size === 'large' ? '400px' : '200px' }}
              >
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-300"
                />
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
