'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const defaultActivities = [
  {
    title: 'Lakeside Trails',
    description: 'Scenic walking paths around the pristine lake with stunning water views and natural ecosystems to explore.',
    image: '/activity-lakeside.png',
  },
  {
    title: 'Recreational Areas',
    description: 'Family-friendly spaces with recreational activities, perfect for groups and celebrations in nature.',
    image: '/activity-playground.png',
  },
  {
    title: 'Botanical Gardens',
    description: 'Beautiful gardens showcasing rare plants and horticultural wonders throughout the park.',
    image: '/activity-botanical.png',
  },
]

interface ActivitiesProps {
  activities?: { title: string; description: string; image: string }[];
}

export default function Activities({ activities }: ActivitiesProps) {
  const displayActivities = activities && activities.length > 0 ? activities : defaultActivities;
  
  // Create copies to simulate an infinite loop
  const copies = 12;
  const loopedActivities = Array(copies).fill(displayActivities).flat();
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Start in the middle
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    
    setTimeout(() => {
      const middleStart = container.children[displayActivities.length * 6] as HTMLElement;
      if (middleStart) {
        container.scrollLeft = middleStart.offsetLeft;
      }
    }, 100);
  }, [displayActivities]);

  const scroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (!container) return;

    // Teleport logic to prevent hitting the ends
    const leftThreshold = container.children[displayActivities.length * 2] as HTMLElement;
    const rightThreshold = container.children[displayActivities.length * 10] as HTMLElement;
    const middleStart = container.children[displayActivities.length * 6] as HTMLElement;

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
    }, 3000); // 3 seconds between each slide

    return () => clearInterval(autoScroll);
  }, [isHovered]);

  return (
    <section id="activities" className="py-16 md:py-24 px-4 bg-transparent relative z-10">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10 md:mb-16">
          <h2 className="font-cormorant text-4xl md:text-7xl font-bold text-[#1E3F20] mb-4 md:mb-6 tracking-tight">
            Activities
          </h2>
          <div className="w-16 h-1 bg-[#A05740] mx-auto rounded-full mb-6"></div>
          <p className="text-[#2C302E]/80 text-lg md:text-xl max-w-2xl mx-auto font-light tracking-wide">
          More than a dining destination, Rubber Estate offers outdoor activities, scenic surroundings, and memorable moments for families, friends, and nature lovers.
          </p>
        </div>

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
            className="flex gap-6 overflow-x-auto snap-x snap-mandatory pb-6 hide-scroll"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {loopedActivities.map((activity, index) => (
              <div
                key={index}
                className="snap-center shrink-0 w-full sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] group bg-white/10 backdrop-blur-sm rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 border border-[#1E3F20]/15 hover:border-[#1E3F20]/30 flex flex-col"
              >
                <div className="p-3 md:p-4 pb-0">
                  <div className="relative w-full h-48 sm:h-64 rounded-2xl overflow-hidden">
                    {activity.image && activity.image.startsWith('data:') ? (
                      <img
                        src={activity.image}
                        alt={activity.title}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                    ) : (
                      <Image
                        src={activity.image}
                        alt={activity.title}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                    )}
                    <div className="absolute inset-0 bg-black/10 transition-opacity duration-500 group-hover:opacity-0" />
                  </div>
                </div>
                <div className="p-6 md:p-8 flex flex-col flex-1 text-center">
                  <h3 className="font-cormorant text-2xl md:text-3xl font-bold text-[#1E3F20] mb-3 md:mb-4 tracking-tight">
                    {activity.title}
                  </h3>
                  <p className="text-[#2C302E]/80 leading-relaxed font-light flex-1">
                    {activity.description}
                  </p>
                  
                  <div className="mt-8 pt-6 border-t border-[#1E3F20]/10">
                    <span className="text-xs uppercase tracking-widest font-semibold text-[#A05740] group-hover:text-[#1E3F20] transition-colors duration-300 cursor-pointer">
                      Discover More
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
