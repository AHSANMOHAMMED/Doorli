'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

type FeaturesContextValue = {
  features: Record<string, boolean>;
  vendor: { id: string; businessName: string; erpProvider?: string | null; erpTenantId?: string | null } | null;
  hasFeature: (key: string) => boolean;
  loading: boolean;
};

const FeaturesContext = createContext<FeaturesContextValue | undefined>(undefined);

export function FeaturesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [features, setFeatures] = useState<Record<string, boolean>>({});
  const [vendor, setVendor] = useState<FeaturesContextValue['vendor']>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFeatures() {
      if (!user || user.role !== 'vendor') {
        setFeatures({});
        setVendor(null);
        setLoading(false);
        return;
      }
      
      try {
        const res = await apiFetch('/vendors/me/features');
        const data = (res as any).data || res;
        
        setFeatures(data.features || {});
        setVendor(data.vendor || null);
      } catch (err) {
        console.error('Failed to load features', err);
      } finally {
        setLoading(false);
      }
    }
    
    loadFeatures();
  }, [user]);

  const hasFeature = (key: string) => {
    return !!features[key];
  };

  return (
    <FeaturesContext.Provider value={{ features, vendor, hasFeature, loading }}>
      {children}
    </FeaturesContext.Provider>
  );
}

export function useFeatures() {
  const ctx = useContext(FeaturesContext);
  if (!ctx) throw new Error('useFeatures must be used within FeaturesProvider');
  return ctx;
}
