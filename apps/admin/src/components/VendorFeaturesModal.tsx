"use client";

import { useEffect, useState } from "react";
import { X, Loader2, ToggleLeft } from "lucide-react";
import { adminFetch } from "@/lib/api";

type FeatureFlag = {
  id: string;
  key: string;
  name: string;
  isGlobal: boolean;
};

type VendorFeature = {
  featureId: string;
  isEnabled: boolean;
};

type Props = {
  vendorId: string;
  vendorName: string;
  onClose: () => void;
};

export default function VendorFeaturesModal({ vendorId, vendorName, onClose }: Props) {
  const [features, setFeatures] = useState<FeatureFlag[]>([]);
  const [vendorFeatures, setVendorFeatures] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await adminFetch<{ allFeatures: FeatureFlag[], vendorFeatures: VendorFeature[] }>(`/admin/vendors/${vendorId}/features`);
        
        // Handle wrapper correctly depending on how adminFetch unwraps
        const data = (res as { data?: typeof res } | typeof res).data || res;
        
        setFeatures(data.allFeatures || []);
        
        const vfMap: Record<string, boolean> = {};
        (data.vendorFeatures || []).forEach((vf: VendorFeature) => {
          vfMap[vf.featureId] = vf.isEnabled;
        });
        setVendorFeatures(vfMap);
      } catch (err) {
        console.error("Failed to load features", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [vendorId]);

  const toggleFeature = async (featureId: string, currentStatus: boolean, _isGlobal: boolean) => {
    // If it's a global feature and hasn't been explicitly set for this vendor, its default is true.
    const newStatus = !currentStatus;
    setSavingId(featureId);
    try {
      await adminFetch(`/admin/vendors/${vendorId}/features`, {
        method: 'PUT',
        body: JSON.stringify({ featureId, isEnabled: newStatus })
      });
      setVendorFeatures(prev => ({ ...prev, [featureId]: newStatus }));
    } catch (err) {
      console.error("Failed to toggle feature", err);
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative doorli-glass-card rounded-3xl w-full max-w-lg p-0 overflow-hidden animate-scale-up border border-white/10 shadow-2xl flex flex-col max-h-[85vh]">
        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div>
            <h2 className="text-xl font-display font-bold text-white flex items-center gap-2">
              <ToggleLeft className="w-5 h-5 text-doorli-mint" />
              Manage Features
            </h2>
            <p className="text-sm text-doorli-dim mt-1">Configuring features for <span className="text-white font-medium">{vendorName}</span></p>
          </div>
          <button onClick={onClose} className="p-2 text-doorli-dim hover:text-white hover:bg-white/10 rounded-xl transition">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1">
          {loading ? (
            <div className="py-12 flex justify-center text-white/50">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : features.length === 0 ? (
            <div className="py-8 text-center text-doorli-dim">
              No feature flags created in the system yet.
            </div>
          ) : (
            <div className="space-y-3">
              {features.map((feature) => {
                const isExplicitlySet = vendorFeatures[feature.id] !== undefined;
                const isEnabled = isExplicitlySet ? vendorFeatures[feature.id] : feature.isGlobal;
                const isSaving = savingId === feature.id;
                
                return (
                  <div key={feature.id} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/[0.08] transition-colors">
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-medium text-white">{feature.name}</div>
                        {feature.isGlobal && !isExplicitlySet && (
                          <span className="text-[9px] uppercase tracking-widest bg-white/10 text-doorli-dim px-1.5 py-0.5 rounded">Default: On</span>
                        )}
                        {!feature.isGlobal && !isExplicitlySet && (
                          <span className="text-[9px] uppercase tracking-widest bg-white/10 text-doorli-dim px-1.5 py-0.5 rounded">Default: Off</span>
                        )}
                      </div>
                      <div className="text-xs font-mono text-doorli-mint/70 mt-1">{feature.key}</div>
                    </div>
                    <button
                      disabled={isSaving}
                      onClick={() => toggleFeature(feature.id, isEnabled, feature.isGlobal)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isEnabled ? 'bg-doorli-mint' : 'bg-white/10'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                      {isSaving && (
                        <span className="absolute inset-0 flex items-center justify-center">
                          <Loader2 className="w-3 h-3 text-white animate-spin mix-blend-difference" />
                        </span>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
