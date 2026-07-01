'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { TaxConfig } from '@/lib/escpos';

interface ConfigContextType {
  config: TaxConfig;
  updateConfig: (newConfig: TaxConfig) => void;
}

export const defaultConfig: TaxConfig = {
  ssclPercentage: 2.5,
  vatPercentage: 18.0,
  counterServiceCharge: 0.0,
  waiterServiceCharge: 10.0,
  refundPin: '0000',
  printerType: 'mock',
  networkIp: '192.168.1.100',
  networkPort: 9100,
  paperWidth: '80mm',
  autoPrintReceipt: true,
  autoKickDrawer: true,
  drawerPin: 0,
  receiptLogoUrl: '',
  receiptName: 'RUBBER ESTATE',
  receiptSubtitle: 'Premium Restaurant & POS',
  receiptAddress: 'Colombo, Sri Lanka',
  receiptPhone: '+94 11 234 5678',
  receiptFooter: 'THANK YOU FOR YOUR PATRONAGE! Please come again.',
  receiptTaxRegNo: 'LKE-8492048',
  enableServiceCharge_Takeaway: false,
  enableServiceCharge_DineIn: false,
  enableServiceCharge_Online: false,
  enableSSCL_Takeaway: false,
  enableSSCL_DineIn: false,
  enableSSCL_Online: false,
  enableVAT_Takeaway: false,
  enableVAT_DineIn: false,
  enableVAT_Online: false,
  landingActivities: [
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
  ],
  landingGallery: [
    { src: '/gallery-cocktail.png', alt: 'Elegant cocktail', size: 'large' },
    { src: '/gallery-park.png', alt: 'Park landscape', size: 'medium' },
    { src: '/gallery-people.png', alt: 'People dining', size: 'medium' },
    { src: '/gallery-sunset.png', alt: 'Sunset over park', size: 'large' },
    { src: '/featured-dish.png', alt: 'Gourmet dish', size: 'medium' },
    { src: '/hero-split.png', alt: 'Park bistro scene', size: 'medium' },
  ],
  landingHoursList: [
    { label: 'Monday - Sunday', hours: '10:00 AM - 10:00 PM' }
  ],
  landingHoursBanner: 'All days 10.a.m to 10 p.m',
  autoOpenTime: '10:00',
  autoCloseTime: '22:00',
};

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export function ConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<TaxConfig>(defaultConfig);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('pos_tax_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        setConfig({ ...defaultConfig, ...parsed });
      }
    } catch {
      // ignore parse errors, use defaults
    }
  }, []);

  const updateConfig = (newConfig: TaxConfig) => {
    setConfig(newConfig);
    try {
      localStorage.setItem('pos_tax_config', JSON.stringify(newConfig));
    } catch {
      // ignore storage errors
    }
  };

  return <ConfigContext.Provider value={{ config, updateConfig }}>{children}</ConfigContext.Provider>;
}

export function useConfig() {
  const ctx = useContext(ConfigContext);
  if (!ctx) throw new Error('useConfig must be used within a ConfigProvider');
  return ctx;
}
