'use client'

import Image from 'next/image'
import { Phone, Mail } from 'lucide-react'

export default function Catering() {
  return (
    <section id="catering" className="py-16 md:py-24 px-4 bg-transparent relative z-10">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white/30 backdrop-blur-lg rounded-[3rem] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50">
          <div className="grid md:grid-cols-2 items-stretch">
            {/* Left - Image */}
            <div className="relative h-64 md:h-auto min-h-[300px] md:min-h-[400px] order-2 md:order-1">
              <Image
                src="/event-table.png"
                alt="Outdoor event setup"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/20"></div>
            </div>

            {/* Right - Content */}
            <div className="p-6 md:p-14 flex flex-col justify-center order-1 md:order-2">
              <h2 className="font-cormorant text-4xl md:text-6xl font-bold text-[#1E3F20] mb-4 md:mb-6 tracking-tight leading-tight">
                Host Your Special Event With Us
              </h2>
              
              <div className="w-16 h-1 bg-[#A05740] rounded-full mb-6 md:mb-8"></div>
              
              <p className="text-base md:text-lg text-[#2C302E]/90 mb-8 md:mb-10 leading-relaxed font-light">
                Create unforgettable memories with us. We provide delicious catering services and a beautiful venue for birthdays, corporate events, family gatherings, and other special occasions. Let us make your celebration truly memorable. We're just a call or message away. Contact us today.
              </p>

              {/* Contact Details Grid */}
              <div className="grid sm:grid-cols-2 gap-8 mb-8">
                <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/40 border border-white/60 hover:bg-white/60 transition-colors">
                  <div className="w-12 h-12 rounded-full bg-[#1E3F20]/10 flex items-center justify-center flex-shrink-0">
                    <Phone size={20} className="text-[#1E3F20]" />
                  </div>
                  <div>
                    <p className="font-semibold text-[#1E3F20] text-sm uppercase tracking-wider mb-1">Phone</p>
                    <a href="tel:+94724492222" className="text-[#2C302E] hover:text-[#A05740] font-medium transition-colors">
                      +94 724 492 222
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/40 border border-white/60 hover:bg-white/60 transition-colors">
                  <div className="w-12 h-12 rounded-full bg-[#1E3F20]/10 flex items-center justify-center flex-shrink-0">
                    <Mail size={20} className="text-[#1E3F20]" />
                  </div>
                  <div>
                    <p className="font-semibold text-[#1E3F20] text-sm uppercase tracking-wider mb-1">Email</p>
                    <a href="mailto:rubberestate2026@gmail.com" className="text-[#2C302E] hover:text-[#A05740] font-medium transition-colors break-all">
                      rubberestate2026@gmail.com
                    </a>
                  </div>
                </div>
              </div>

              <p className="text-sm text-[#2C302E]/60 italic font-light">
                * Get in touch with us to discuss your event requirements and catering options.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
