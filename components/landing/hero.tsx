'use client'

import Image from 'next/image'

interface HeroProps {
  heroImage?: string;
}

export default function Hero({ heroImage }: HeroProps) {
  return (
    <section id="home" className="relative w-full h-[100svh] min-h-[650px] md:min-h-[700px] overflow-hidden">
      {heroImage && heroImage.startsWith('data:') ? (
        <img
          src={heroImage}
          alt="Rubber Estate Hero"
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <Image
          src={heroImage || "/event-table.png"}
          alt="Rubber Estate Hero"
          fill
          className="object-cover"
          priority
        />
      )}
      
      {/* Overlay for text readability */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-[#152C16]/80"></div>
      
      {/* Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center px-6 pt-36 sm:pt-40 md:pt-24 pb-12 md:pb-0">
        <h1 className="font-cormorant text-5xl sm:text-6xl md:text-7xl lg:text-[7.5rem] font-medium text-[#FDFBF7] text-center mb-4 md:mb-6 tracking-[0.05em] md:tracking-[0.15em] drop-shadow-2xl text-balance leading-none">
          RUBBER ESTATE
        </h1>
        <p className="text-sm md:text-lg lg:text-xl text-[#FDFBF7]/90 text-center mb-6 md:mb-10 font-medium tracking-[0.15em] md:tracking-[0.3em] uppercase drop-shadow-md">
          Experience Nature, Feel Alive
        </p>
        <div className="w-12 md:w-16 h-[2px] bg-[#A05740] mb-6 md:mb-10"></div>
        <p className="text-sm sm:text-base md:text-xl text-[#FDFBF7]/80 text-center mb-8 md:mb-14 max-w-[280px] sm:max-w-md md:max-w-2xl leading-relaxed font-light drop-shadow-md">
          Surrounded by nature, Rubber Estate offers flavorful dining, family-friendly activities, and a tranquil setting for unforgettable moments.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 w-full max-w-md sm:max-w-none justify-center">
          <a 
            href="#menu" 
            className="w-full sm:w-auto text-center px-8 sm:px-10 py-4 bg-[#1E3F20] text-[#F7F4EF] rounded-sm font-semibold tracking-wider uppercase hover:bg-[#A05740] transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
          >
            View Menu
          </a>
          <a 
            href="#activities" 
            className="w-full sm:w-auto text-center px-8 sm:px-10 py-4 border-2 border-white text-white rounded-sm font-semibold tracking-wider uppercase hover:bg-white hover:text-[#1E3F20] transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
          >
            Explore the Park
          </a>
        </div>
      </div>
    </section>
  )
}
