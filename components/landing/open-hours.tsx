'use client';

import { Clock, Store } from 'lucide-react';
import { useEffect, useState } from 'react';

interface OpenHoursProps {
  storeStatusOverride?: 'auto' | 'open' | 'closed';
  bannerText?: string;
  autoOpenTime?: string;
  autoCloseTime?: string;
}

export default function OpenHours({ storeStatusOverride = 'auto', bannerText, autoOpenTime = '10:00', autoCloseTime = '22:00' }: OpenHoursProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const checkOpenStatus = () => {
      if (storeStatusOverride === 'open') {
        setIsOpen(true);
        return;
      }
      if (storeStatusOverride === 'closed') {
        setIsOpen(false);
        return;
      }

      // Auto mode
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();

      const parseTime = (timeStr: string) => {
        const [h, m] = timeStr.split(':').map(Number);
        return (h || 0) * 60 + (m || 0);
      };

      const openMinutes = parseTime(autoOpenTime);
      const closeMinutes = parseTime(autoCloseTime);

      setIsOpen(currentMinutes >= openMinutes && currentMinutes < closeMinutes);
    };

    checkOpenStatus();
    // Re-check every minute
    const interval = setInterval(checkOpenStatus, 60000);
    return () => clearInterval(interval);
  }, [storeStatusOverride, autoOpenTime, autoCloseTime]);

  return (
    <section className="py-8 bg-[#1E3F20] text-[#F7F4EF] border-y border-[#122A14]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-center md:justify-between gap-6">
          <div className="flex items-center gap-4 text-center md:text-left">
            <div className="p-3 bg-[#2C5730] rounded-full">
              <Clock className="w-6 h-6 text-[#F7F4EF]" />
            </div>
            <div>
              <h3 className="font-cormorant text-2xl md:text-3xl font-bold mb-1">
                Open Hours
              </h3>
              <p className="text-[#F7F4EF]/80 text-sm md:text-base font-medium tracking-wide">
                {bannerText || 'All days 10.a.m to 10 p.m'}
              </p>
            </div>
          </div>

          <div className="flex items-center w-full md:w-auto justify-center mt-2 md:mt-0">
            <div
              suppressHydrationWarning
              className={`flex items-center justify-center w-full sm:w-auto gap-3 px-6 py-3 rounded-full border-2 shadow-lg transition-all ${
                isOpen
                  ? 'bg-[#2E5C32] border-[#438A49] text-white shadow-[#438A49]/20'
                  : 'bg-[#5C2E2E] border-[#8A4343] text-white shadow-[#8A4343]/20'
              }`}
            >
              <Store className="w-5 h-5 flex-shrink-0" />
              <span suppressHydrationWarning className="font-semibold tracking-wide text-lg whitespace-nowrap">
                {isOpen ? 'We are Open' : 'We are Closed'}
              </span>
              <span className="relative flex h-3 w-3 ml-1 flex-shrink-0">
                <span
                  suppressHydrationWarning
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    isOpen ? 'bg-[#7EE086]' : 'bg-[#E07E7E]'
                  }`}
                ></span>
                <span
                  suppressHydrationWarning
                  className={`relative inline-flex rounded-full h-3 w-3 ${
                    isOpen ? 'bg-[#5AE366]' : 'bg-[#E35A5A]'
                  }`}
                ></span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
