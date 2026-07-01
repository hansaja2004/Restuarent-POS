'use client'

import Image from 'next/image'
import { MapPin, Phone, Mail, Clock } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-[#152C16] text-[#F7F4EF] py-6 md:py-8 px-4 border-t-4 border-[#A05740]">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-y-8 gap-x-4 sm:gap-6 mb-8 md:mb-6 items-start">
          
          {/* Quick Links */}
          <div className="order-2 lg:order-1">
            <h4 className="text-base font-cormorant font-bold mb-3 text-white border-b border-white/10 pb-1.5 inline-block">Quick Links</h4>
            <ul className="space-y-1.5 md:space-y-2">
              <li><a href="#home" className="text-[#F7F4EF]/80 hover:text-[#A05740] transition-colors text-sm flex items-center gap-2"><span className="text-xs">▸</span> Home</a></li>
              <li><a href="#menu" className="text-[#F7F4EF]/80 hover:text-[#A05740] transition-colors text-sm flex items-center gap-2"><span className="text-xs">▸</span> Our Menu</a></li>
              <li><a href="#activities" className="text-[#F7F4EF]/80 hover:text-[#A05740] transition-colors text-sm flex items-center gap-2"><span className="text-xs">▸</span> Park Activities</a></li>
              <li><a href="#gallery" className="text-[#F7F4EF]/80 hover:text-[#A05740] transition-colors text-sm flex items-center gap-2"><span className="text-xs">▸</span> Gallery</a></li>
            </ul>
          </div>

          {/* Why Visit Us */}
          <div className="order-3 lg:order-2">
            <h4 className="text-base font-cormorant font-bold mb-3 text-white border-b border-white/10 pb-1.5 inline-block">Why Visit Us</h4>
            <ul className="space-y-1.5 md:space-y-2">
              <li className="text-[#F7F4EF]/80 text-sm flex items-center gap-2"><span className="text-xs text-[#A05740]">▸</span> Peaceful Nature Setting</li>
              <li className="text-[#F7F4EF]/80 text-sm flex items-center gap-2"><span className="text-xs text-[#A05740]">▸</span> Freshly Prepared Meals</li>
              <li className="text-[#F7F4EF]/80 text-sm flex items-center gap-2"><span className="text-xs text-[#A05740]">▸</span> Outdoor Activities</li>
              <li className="text-[#F7F4EF]/80 text-sm flex items-center gap-2"><span className="text-xs text-[#A05740]">▸</span> Family Friendly</li>
            </ul>
          </div>

          {/* Brand Section (Centered) */}
          <div className="flex flex-col items-center text-center justify-start order-1 lg:order-3 col-span-2 lg:col-span-1 mb-2 lg:mb-0">
            <div className="-mt-6 mb-1">
              <Image
                src="/logo.png"
                alt="Rubber Estate Logo"
                width={130}
                height={130}
                className="object-contain drop-shadow-lg"
              />
            </div>
            <p className="text-[#F7F4EF]/80 text-sm leading-relaxed max-w-[280px]">
              A tranquil retreat for dining, relaxation, and memorable moments.
            </p>
          </div>

          {/* Contact Info */}
          <div className="order-4 lg:order-4 lg:justify-self-end">
            <h4 className="text-base font-cormorant font-bold mb-3 text-white border-b border-white/10 pb-1.5 inline-block">Contact Us</h4>
            <ul className="space-y-2 md:space-y-2.5">
              <li className="flex items-start gap-3 text-sm text-[#F7F4EF]/80">
                <MapPin size={18} className="text-[#A05740] flex-shrink-0 mt-0.5" />
                <span>No.23, Rathnapura Road,<br/>Munagama, Horana.</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-[#F7F4EF]/80">
                <Phone size={18} className="text-[#A05740] flex-shrink-0" />
                <span><a href="tel:+94724492222" className="hover:text-white transition-colors">+94 72 449 2222</a></span>
              </li>
            </ul>
          </div>

          {/* Social Links */}
          <div className="order-5 lg:order-5 lg:justify-self-end">
            <h4 className="text-base font-cormorant font-bold mb-3 text-white border-b border-white/10 pb-1.5 inline-block">Connect</h4>
            <ul className="space-y-2 md:space-y-2.5">
              <li>
                <a
                  href="https://www.facebook.com/share/1bmRadN69f/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-3 text-sm text-[#F7F4EF]/80 hover:text-white transition-colors"
                >
                  <span className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-[#1877F2] group-hover:border-[#1877F2] transition-colors">
                    <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </span>
                  Facebook
                </a>
              </li>
              <li>
                <a
                  href="https://wa.me/94724492222"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-3 text-sm text-[#F7F4EF]/80 hover:text-white transition-colors"
                >
                  <span className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-[#25D366] group-hover:border-[#25D366] transition-colors">
                    <svg className="w-3 h-3 fill-current" viewBox="0 0 448 512">
                      <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 222.4-99.6 222.4-222 0-59.3-23.1-115-65.4-157zM223.9 414.7c-33 0-65.4-8.9-94-25.7l-6.7-4-69.8 18.3L72 334.1l-4.4-7.1c-18.4-29.6-28.1-63.7-28.1-99 0-103.5 84.3-187.8 187.9-187.8 50.1 0 97.3 19.5 132.8 55 35.4 35.4 55 82.6 55 132.7 0 103.5-84.3 187.8-187.9 187.8zm102.7-140.2c-5.6-2.8-33.3-16.4-38.5-18.3-5.2-1.9-8.9-2.8-12.7 2.8-3.8 5.6-14.5 18.3-17.8 22-3.3 3.8-6.6 4.2-12.2 1.4-5.6-2.8-23.7-8.7-45.2-27.9-16.7-14.9-28-33.4-31.3-39-3.3-5.6-.3-8.6 2.5-11.4 2.5-2.5 5.6-6.6 8.4-9.9 2.8-3.3 3.8-5.6 5.6-9.4 1.9-3.8 .9-7.1-.5-9.9-1.4-2.8-12.7-30.5-17.4-41.8-4.6-11.1-9.3-9.6-12.7-9.8-3.3-.2-7.1-.2-10.8-.2-3.8 0-9.9 1.4-15 7.1-5.2 5.6-19.7 19.2-19.7 46.9s20.2 54.4 23 58.2c2.8 3.8 39.7 60.6 96.2 85 13.5 5.8 24 9.3 32.2 11.9 13.5 4.3 25.8 3.7 35.6 2.2 10.9-1.6 33.3-13.6 38-26.7 4.7-13.1 4.7-24.4 3.3-26.7-1.4-2.3-5.2-3.8-10.8-6.6z"/>
                    </svg>
                  </span>
                  WhatsApp
                </a>
              </li>
              <li>
                <a
                  href="https://maps.app.goo.gl/vRNuTdbEphXno66t6"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-3 text-sm text-[#F7F4EF]/80 hover:text-white transition-colors"
                >
                  <span className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-[#EA4335] group-hover:border-[#EA4335] transition-colors">
                    <svg className="w-3 h-3 fill-current" viewBox="0 0 488 512">
                      <path d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"/>
                    </svg>
                  </span>
                  Google Maps
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider & Copyright */}
        <div className="border-t border-white/10 pt-4 mt-2 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-[#F7F4EF]/60">
            © {new Date().getFullYear()} Rubber Estate. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-[#F7F4EF]/60">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
