'use client'

import Image from 'next/image'
import { Phone, Mail } from 'lucide-react'

export default function Catering() {
  return (
    <section id="catering" className="py-20 px-4 bg-[#F7F4EF]">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left - Image */}
          <div className="relative h-96 rounded-lg overflow-hidden shadow-lg order-2 md:order-1">
            <Image
              src="/event-table.png"
              alt="Outdoor event setup"
              fill
              className="object-cover"
            />
          </div>

          {/* Right - Content */}
          <div className="order-1 md:order-2">
            <h2 className="font-cormorant text-5xl md:text-6xl font-bold text-[#1E3F20] mb-4">
              For Events, Contact Us
            </h2>
            
            <p className="text-lg text-[#2C302E]/80 mb-8 leading-relaxed">
              We cater foods for events and provide our premises for special occasions such as birthday parties, weddings, and gatherings. Let us help you create an unforgettable celebration in our beautiful park setting.
            </p>

            {/* Contact Details */}
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <Phone size={24} className="text-[#1E3F20] flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold text-[#1E3F20] mb-1">Phone</p>
                  <a href="tel:+94724492222" className="text-[#2C302E] hover:text-[#1E3F20] transition-colors">
                    +94 724 492 222
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <Mail size={24} className="text-[#1E3F20] flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold text-[#1E3F20] mb-1">Email</p>
                  <a href="mailto:rubberestate2026@gmail.com" className="text-[#2C302E] hover:text-[#1E3F20] transition-colors break-all">
                    rubberestate2026@gmail.com
                  </a>
                </div>
              </div>
            </div>

            <p className="text-sm text-[#2C302E]/60 mt-8">
              Get in touch with us to discuss your event requirements and catering options.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
