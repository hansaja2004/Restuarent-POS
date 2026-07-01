'use client'

import Image from 'next/image'

export default function Footer() {
  return (
    <footer className="bg-[#1E3F20] text-[#F7F4EF] py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          {/* Brand Section */}
          <div className="text-center md:text-left">
            <div className="flex items-center gap-2 mb-4">
              <Image
                src="/logo.png"
                alt="Rubber Estate Logo"
                width={40}
                height={40}
                className="object-contain"
              />
              <div>
                <p className="text-sm font-semibold">RUBBER</p>
                <p className="text-xs">ESTATE</p>
              </div>
            </div>
            <p className="text-sm text-[#F7F4EF]/70">
              A culinary retreat in nature
            </p>
          </div>

          {/* Quick Links */}
          <div className="text-center">
            <p className="font-semibold mb-3 text-sm">Location</p>
            <a
              href="https://maps.app.goo.gl/rXAmyw8eZB1jiw3e8"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-[#F7F4EF]/80 hover:text-[#F7F4EF] transition-colors"
            >
              Rubber Estate, Matara
            </a>
          </div>

          {/* Social Links */}
          <div className="text-center md:text-right">
            <p className="font-semibold mb-4 text-sm">Follow Us</p>
            <div className="flex gap-3 justify-center md:justify-end">
              <a
                href="https://www.facebook.com/share/1bmRadN69f/"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-[#F7F4EF]/10 rounded-full hover:bg-[#F7F4EF]/20 transition-colors"
                title="Facebook"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              <a
                href="https://wa.me/94724492222"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-[#F7F4EF]/10 rounded-full hover:bg-[#F7F4EF]/20 transition-colors"
                title="WhatsApp"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.67-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.076 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421-7.403h-.004a9.87 9.87 0 00-4.935 1.18c-3.15 1.886-5.235 5.43-5.235 8.96 0 1.4.232 2.75.697 4.053l-1.099 4.016 4.186-1.098c1.245.656 2.682.989 4.087.989h.004c4.901 0 9-3.993 9.101-8.887.006-2.33-.94-4.51-2.65-6.159-1.71-1.65-3.982-2.56-6.401-2.56z"/>
                </svg>
              </a>
              <a
                href="https://www.google.com/maps/search/rubber+estate+matara"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-[#F7F4EF]/10 rounded-full hover:bg-[#F7F4EF]/20 transition-colors"
                title="Google Maps"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-[#F7F4EF]/20 pt-8">
          <p className="text-center text-sm text-[#F7F4EF]/70">
            © 2026 RUBBER ESTATE. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
