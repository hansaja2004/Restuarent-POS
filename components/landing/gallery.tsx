'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const defaultGalleryImages = [
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

interface GalleryProps {
  images?: { src: string; alt: string; size: 'large' | 'medium' }[];
}

export default function Gallery({ images }: GalleryProps) {
  const displayImages = images && images.length > 0 ? images : defaultGalleryImages;
  
  // Create copies to simulate an infinite loop
  const copies = 12;
  const loopedImages = Array(copies).fill(displayImages).flat();
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Start in the middle
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    
    setTimeout(() => {
      const middleStart = container.children[displayImages.length * 6] as HTMLElement;
      if (middleStart) {
        container.scrollLeft = middleStart.offsetLeft;
      }
    }, 100);
  }, [displayImages]);

  const scroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (!container) return;

    // Teleport logic to prevent hitting the ends
    const leftThreshold = container.children[displayImages.length * 2] as HTMLElement;
    const rightThreshold = container.children[displayImages.length * 10] as HTMLElement;
    const middleStart = container.children[displayImages.length * 6] as HTMLElement;

    if (direction === 'left' && container.scrollLeft <= leftThreshold.offsetLeft) {
      container.scrollLeft = middleStart.offsetLeft - (leftThreshold.offsetLeft - container.scrollLeft);
    } else if (direction === 'right' && container.scrollLeft >= rightThreshold.offsetLeft) {
      container.scrollLeft = middleStart.offsetLeft + (container.scrollLeft - rightThreshold.offsetLeft);
    }

    // After instant teleport, do the smooth scroll by exactly ONE item
    setTimeout(() => {
      const first = container.children[0] as HTMLElement;
      const second = container.children[1] as HTMLElement;
      const scrollAmount = second ? second.offsetLeft - first.offsetLeft : container.clientWidth;
      
      container.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }, 20);
  };

  useEffect(() => {
    if (isHovered) return;
    
    const autoScroll = setInterval(() => {
      scroll('right');
    }, 3000);

    return () => clearInterval(autoScroll);
  }, [isHovered]);

  return (
    <section id="gallery" className="py-16 md:py-20 px-4 bg-transparent relative z-10">
      <div className="max-w-7xl mx-auto">
        <h2 className="font-cormorant text-4xl md:text-6xl font-bold text-[#1E3F20] text-center mb-4">
          Gallery
        </h2>
        <p className="text-center text-[#2C302E] mb-8 md:mb-12 max-w-2xl mx-auto">
          Moments captured. Memories made. Experience the beauty of our place.
        </p>

        {/* Carousel Layout */}
        <div 
          className="relative px-10 md:px-16"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onTouchStart={() => setIsHovered(true)}
          onTouchEnd={() => setIsHovered(false)}
          onTouchCancel={() => setIsHovered(false)}
        >
          {/* Navigation Arrows */}
          <button 
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-8 h-8 md:w-12 md:h-12 flex items-center justify-center bg-[#C4C4C4] hover:bg-[#A0A0A0] text-white rounded-full transition-colors shadow-md"
            aria-label="Previous"
          >
            <ChevronLeft size={24} />
          </button>

          <button 
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-8 h-8 md:w-12 md:h-12 flex items-center justify-center bg-[#C4C4C4] hover:bg-[#A0A0A0] text-white rounded-full transition-colors shadow-md"
            aria-label="Next"
          >
            <ChevronRight size={24} />
          </button>

          <style dangerouslySetInnerHTML={{__html: `
            .hide-scroll::-webkit-scrollbar { display: none; }
          `}} />
          
          <div 
            ref={scrollContainerRef}
            className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-6 hide-scroll"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {loopedImages.map((image, index) => {
              // Dynamic widths to recreate the creative grid feeling horizontally
              let widthClass = 'w-[85vw] sm:w-[calc(50%-8px)] lg:w-[calc(33.333%-10px)]';
              
              if (image.size === 'large') {
                widthClass = 'w-[85vw] sm:w-[calc(66.666%-10px)] lg:w-[calc(50%-8px)]';
              }
              
              return (
                <div
                  key={index}
                  className={`${widthClass} snap-center shrink-0 relative overflow-hidden rounded-lg shadow-sm hover:shadow-md transition-shadow border border-[#E0DDD8] group cursor-pointer h-[300px] md:h-[400px]`}
                >
                  <div className="relative w-full h-full">
                    {image.src && image.src.startsWith('data:') ? (
                      <img
                        src={image.src}
                        alt={image.alt}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                      />
                    ) : (
                      <Image
                        src={image.src}
                        alt={image.alt}
                        fill
                        className="object-cover transition-transform duration-700 hover:scale-105"
                      />
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
