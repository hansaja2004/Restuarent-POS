'use client'

import { MapPin, Clock, Phone, Navigation } from 'lucide-react'

const InfoCard = ({ icon: Icon, title, content }: { icon: any, title: string, content: React.ReactNode }) => (
  <div className="flex flex-col items-center text-center p-8 rounded-3xl bg-white/40 border border-white/60 hover:bg-white/60 transition-colors backdrop-blur-md shadow-sm hover:shadow-md">
    <div className="w-16 h-16 rounded-2xl bg-[#1E3F20]/10 text-[#1E3F20] flex items-center justify-center mb-6 shadow-sm transform -rotate-3 hover:rotate-0 transition-transform">
      <Icon size={28} />
    </div>
    <h3 className="font-cormorant text-2xl font-bold text-[#1E3F20] mb-4 tracking-wide">{title}</h3>
    <div className="text-[#2C302E]/80 font-medium leading-relaxed w-full">{content}</div>
  </div>
)

interface ContactProps {
  hoursList?: { label: string; hours: string }[];
}

export default function Contact({ hoursList }: ContactProps) {
  return (
    <section id="contact" className="pt-24 pb-12 md:pb-24 relative overflow-hidden bg-transparent">
      
      {/* Decorative blobs for the section background to enhance glassmorphism */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[#1E3F20]/5 rounded-full blur-[100px] translate-x-1/3 -translate-y-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-[#A05740]/5 rounded-full blur-[80px] -translate-x-1/3 translate-y-1/3 pointer-events-none" />

      <div className="max-w-[1400px] mx-auto px-4 md:px-8 relative z-10">
        
        {/* Glass Container */}
        <div className="bg-white/30 backdrop-blur-lg border border-white/50 rounded-[3rem] p-6 md:p-16 lg:p-24 relative shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto mb-16 md:mb-20 relative z-10">
            <div className="inline-flex items-center gap-4 mb-6">
              <span className="w-12 h-[1px] bg-[#A05740]"></span>
              <p className="text-[#A05740] font-semibold uppercase tracking-widest text-sm">Let's Connect</p>
              <span className="w-12 h-[1px] bg-[#A05740]"></span>
            </div>
            <h2 className="font-cormorant text-5xl md:text-7xl font-bold text-[#1E3F20] mb-6 leading-tight">
            Your Perfect Visit Awaits
            </h2>
            <p className="text-[#2C302E]/70 text-lg md:text-xl leading-relaxed max-w-2xl mx-auto">
            Have a question, planning a celebration, or need assistance? We're always happy to help and look forward to welcoming you.
            </p>
          </div>

          {/* 3 Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10 max-w-6xl mx-auto">
            
            <InfoCard 
              icon={Phone} 
              title="Direct Contact" 
              content={
                <div className="space-y-4 flex flex-col items-center">
                  <div className="space-y-1">
                    <p className="text-lg hover:text-[#1E3F20] transition-colors cursor-pointer">+94 72 449 2222</p>
                    <p className="hover:text-[#1E3F20] transition-colors cursor-pointer">rubberestate2026@gmail.com</p>
                  </div>
                  <div className="flex gap-4 pt-3 w-full justify-center border-t border-[#1E3F20]/10">
                    <a href="https://www.facebook.com/share/1bmRadN69f/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full border border-[#1E3F20]/20 bg-white/50 backdrop-blur-sm flex items-center justify-center text-[#1E3F20] hover:bg-[#1877F2] hover:text-white hover:border-[#1877F2] transition-all shadow-sm hover:shadow-md hover:-translate-y-1">
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                    </a>
                    <a href="https://wa.me/94724492222" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full border border-[#1E3F20]/20 bg-white/50 backdrop-blur-sm flex items-center justify-center text-[#1E3F20] hover:bg-[#25D366] hover:text-white hover:border-[#25D366] transition-all shadow-sm hover:shadow-md hover:-translate-y-1">
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 448 512">
                        <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 222.4-99.6 222.4-222 0-59.3-23.1-115-65.4-157zM223.9 414.7c-33 0-65.4-8.9-94-25.7l-6.7-4-69.8 18.3L72 334.1l-4.4-7.1c-18.4-29.6-28.1-63.7-28.1-99 0-103.5 84.3-187.8 187.9-187.8 50.1 0 97.3 19.5 132.8 55 35.4 35.4 55 82.6 55 132.7 0 103.5-84.3 187.8-187.9 187.8zm102.7-140.2c-5.6-2.8-33.3-16.4-38.5-18.3-5.2-1.9-8.9-2.8-12.7 2.8-3.8 5.6-14.5 18.3-17.8 22-3.3 3.8-6.6 4.2-12.2 1.4-5.6-2.8-23.7-8.7-45.2-27.9-16.7-14.9-28-33.4-31.3-39-3.3-5.6-.3-8.6 2.5-11.4 2.5-2.5 5.6-6.6 8.4-9.9 2.8-3.3 3.8-5.6 5.6-9.4 1.9-3.8 .9-7.1-.5-9.9-1.4-2.8-12.7-30.5-17.4-41.8-4.6-11.1-9.3-9.6-12.7-9.8-3.3-.2-7.1-.2-10.8-.2-3.8 0-9.9 1.4-15 7.1-5.2 5.6-19.7 19.2-19.7 46.9s20.2 54.4 23 58.2c2.8 3.8 39.7 60.6 96.2 85 13.5 5.8 24 9.3 32.2 11.9 13.5 4.3 25.8 3.7 35.6 2.2 10.9-1.6 33.3-13.6 38-26.7 4.7-13.1 4.7-24.4 3.3-26.7-1.4-2.3-5.2-3.8-10.8-6.6z"/>
                      </svg>
                    </a>
                  </div>
                </div>
              } 
            />

            <InfoCard 
              icon={MapPin} 
              title="Location" 
              content={
                <div className="space-y-4 flex flex-col items-center">
                  <p>
                    No.23, Rathnapura Road,<br />
                    Munagama, Horana,<br />
                    Sri Lanka.
                  </p>
                  <div className="flex gap-4 pt-3 w-full justify-center border-t border-[#1E3F20]/10">
                    <a href="https://maps.app.goo.gl/MjJ8URoN67eyp2hA7" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full border border-[#1E3F20]/20 bg-white/50 backdrop-blur-sm flex items-center justify-center text-[#1E3F20] hover:bg-[#EA4335] hover:text-white hover:border-[#EA4335] transition-all shadow-sm hover:shadow-md hover:-translate-y-1">
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 488 512">
                        <path d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"/>
                      </svg>
                    </a>
                  </div>
                </div>
              } 
            />

            <InfoCard 
              icon={Clock} 
              title="Opening Hours" 
              content={
                <div className="space-y-4 w-full max-w-[250px] mx-auto mt-2">
                  {(hoursList && hoursList.length > 0) ? (
                    hoursList.map((hr, idx) => (
                      <div key={idx} className="flex justify-between items-center border-b border-[#1E3F20]/10 pb-3 last:border-0">
                        <span className="text-[#2C302E]/70 text-base">{hr.label}</span>
                        <span className="text-[#2C302E] font-semibold text-base">{hr.hours}</span>
                      </div>
                    ))
                  ) : (
                    <>
                      <div className="flex justify-between items-center border-b border-[#1E3F20]/10 pb-3">
                        <span className="text-[#2C302E]/70 text-base">Mon - Fri</span>
                        <span className="text-[#2C302E] font-semibold text-base">10 AM - 10 PM</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-[#1E3F20]/10 pb-3">
                        <span className="text-[#2C302E]/70 text-base">Sat - Sun</span>
                        <span className="text-[#2C302E] font-semibold text-base">9 AM - 11 PM</span>
                      </div>
                      <div className="flex justify-between items-center pt-1">
                        <span className="text-[#A05740] font-medium text-base">Public Holidays</span>
                        <span className="text-[#A05740] font-bold text-base">Open</span>
                      </div>
                    </>
                  )}
                </div>
              } 
            />

          </div>
          
        </div>

        {/* Map below the glass container */}
        <div className="max-w-5xl mx-auto mt-8 md:mt-12 relative z-20 px-4 md:px-0">
          <div className="h-[350px] md:h-[500px] w-full rounded-[2.5rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.1)] border-8 border-white group bg-white">
            <iframe 
              src="https://maps.google.com/maps?q=6.7243884,80.0870604&t=&z=15&ie=UTF8&iwloc=&output=embed" 
              width="100%" 
              height="100%" 
              style={{ border: 0 }} 
              allowFullScreen 
              loading="lazy" 
              referrerPolicy="no-referrer-when-downgrade"
              className="w-full h-full grayscale-[10%] hover:grayscale-0 transition-all duration-700"
            ></iframe>
            
            <div className="absolute top-6 left-6 z-10">
              <a 
                href="https://maps.app.goo.gl/ijfcZPTVaYuTxQGA8" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-white/95 backdrop-blur-md px-6 py-3.5 rounded-2xl shadow-lg border border-gray-100 text-[#1E3F20] font-bold text-sm transition-all hover:bg-white hover:shadow-xl hover:scale-105 active:scale-95"
              >
                <Navigation size={18} className="text-[#A05740]" />
                Open in Maps
              </a>
            </div>
          </div>
        </div>

      </div>
    </section>
  )
}
