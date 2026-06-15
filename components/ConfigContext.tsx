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
  paperWidth: '80mm',
  autoPrintReceipt: true,
  autoKickDrawer: true,
  drawerPin: 0,
  receiptName: 'RUBBER ESTATE',
  receiptSubtitle: 'Premium Restaurant & POS',
  receiptAddress: 'Colombo, Sri Lanka',
  receiptPhone: '+94 11 234 5678',
  receiptFooter: 'THANK YOU FOR YOUR PATRONAGE! Please come again.',
  receiptTaxRegNo: 'LKE-8492048',
  enableServiceCharge: false,
  enableSSCL: false,
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
