'use client'

import { MapPin, Clock, Phone, Mail, Star } from 'lucide-react'

export default function Contact() {
  return (
    <section id="contact" className="py-20 px-4 bg-[#F7F4EF]">
      <div className="max-w-7xl mx-auto">
        <h2 className="font-cormorant text-5xl md:text-6xl font-bold text-[#1E3F20] text-center mb-4">
          Get In Touch
        </h2>
        <p className="text-center text-[#2C302E] mb-12 max-w-2xl mx-auto">
          Connect with us through your preferred channel
        </p>

        <div className="grid md:grid-cols-2 gap-12">
          {/* Left - Contact Information */}
          <div className="space-y-8">
            {/* Phone */}
            <div>
              <h3 className="font-semibold text-[#1E3F20] text-lg mb-3 flex items-center gap-2">
                <Phone size={24} />
                Phone
              </h3>
              <a href="tel:+94724492222" className="text-[#2C302E] hover:text-[#1E3F20] transition-colors text-lg ml-10">
                +94 724 492 222
              </a>
            </div>

            {/* Email */}
            <div>
              <h3 className="font-semibold text-[#1E3F20] text-lg mb-3 flex items-center gap-2">
                <Mail size={24} />
                Email
              </h3>
              <a href="mailto:rubberestate2026@gmail.com" className="text-[#2C302E] hover:text-[#1E3F20] transition-colors break-all ml-10">
                rubberestate2026@gmail.com
              </a>
            </div>

            {/* Social Media */}
            <div>
              <h3 className="font-semibold text-[#1E3F20] text-lg mb-4">Follow Us</h3>
              <div className="flex gap-4 ml-10">
                <a
                  href="https://www.facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 bg-white rounded-full border border-[#E0DDD8] hover:bg-[#1E3F20] hover:text-white transition-colors"
                  title="Facebook"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
                <a
                  href="https://wa.me/94724492222"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 bg-white rounded-full border border-[#E0DDD8] hover:bg-[#1E3F20] hover:text-white transition-colors"
                  title="WhatsApp"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.67-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.076 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421-7.403h-.004a9.87 9.87 0 00-4.935 1.18c-3.15 1.886-5.235 5.43-5.235 8.96 0 1.4.232 2.75.697 4.053l-1.099 4.016 4.186-1.098c1.245.656 2.682.989 4.087.989h.004c4.901 0 9-3.993 9.101-8.887.006-2.33-.94-4.51-2.65-6.159-1.71-1.65-3.982-2.56-6.401-2.56z"/>
                  </svg>
                </a>
                <a
                  href="https://www.google.com/maps/search/rubber+estate"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 bg-white rounded-full border border-[#E0DDD8] hover:bg-[#1E3F20] hover:text-white transition-colors"
                  title="Google Reviews"
                >
                  <Star className="w-6 h-6" />
                </a>
              </div>
            </div>
          </div>

          {/* Right - Hours & Location */}
          <div className="space-y-8">
            {/* Address */}
            <div>
              <h3 className="font-semibold text-[#1E3F20] text-lg mb-3 flex items-center gap-2">
                <MapPin size={24} />
                Location
              </h3>
              <p className="text-[#2C302E]/80 ml-10 leading-relaxed">
                Rubber Estate<br />
                Matara, Sri Lanka
              </p>
            </div>

            {/* Hours */}
            <div>
              <h3 className="font-semibold text-[#1E3F20] text-lg mb-3 flex items-center gap-2">
                <Clock size={24} />
                Hours
              </h3>
              <div className="ml-10 space-y-2 text-[#2C302E]/80 text-sm">
                <div>
                  <p className="font-medium">Monday - Friday</p>
                  <p>10:00 AM - 10:00 PM</p>
                </div>
                <div>
                  <p className="font-medium">Saturday - Sunday</p>
                  <p>9:00 AM - 11:00 PM</p>
                </div>
              </div>
            </div>

            {/* Google Reviews */}
            <div className="bg-white rounded-lg p-6 border border-[#E0DDD8]">
              <a
                href="https://www.google.com/maps/search/rubber+estate+matara"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between hover:text-[#1E3F20] transition-colors"
              >
                <div>
                  <p className="font-semibold text-[#1E3F20]">Google Reviews</p>
                  <p className="text-sm text-[#2C302E]/70">Check our ratings and reviews</p>
                </div>
                <Star className="w-6 h-6 text-[#C86D51] flex-shrink-0" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
