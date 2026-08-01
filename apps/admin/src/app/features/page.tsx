"use client";

import { useEffect, useState } from "react";
import { Plus, ToggleLeft, Loader2, RefreshCw } from "lucide-react";
import { adminFetch } from "@/lib/api";

type FeatureFlag = {
  id: string;
  key: string;
  name: string;
  description: string;
  isGlobal: boolean;
  createdAt: string;
};

export default function FeaturesPage() {
  const [features, setFeatures] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({ key: "", name: "", description: "", isGlobal: false });
  const [submitting, setSubmitting] = useState(false);

  const loadFeatures = async () => {
    setLoading(true);
    try {
      const res = await adminFetch("/admin/features");
      const data = Array.isArray(res) ? res : res.items || [];
      // Handle wrapped API responses
      const actualData = (res as { data?: unknown[] }).data || data;
      setFeatures(Array.isArray(actualData) ? actualData : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeatures();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await adminFetch("/admin/features", {
        method: "POST",
        body: JSON.stringify(formData),
      });
      setShowModal(false);
      setFormData({ key: "", name: "", description: "", isGlobal: false });
      loadFeatures();
    } catch (err) {
      console.error(err);
      alert("Failed to create feature");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-white tracking-tight flex items-center gap-3">
            <ToggleLeft className="w-8 h-8 text-doorli-mint" />
            Feature Flags
          </h1>
          <p className="text-doorli-muted mt-2 text-sm max-w-xl">
            Control platform capabilities globally or per-vendor without redeploying code.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadFeatures}
            className="flex items-center justify-center p-2.5 rounded-xl border border-white/10 bg-white/[0.02] text-white hover:bg-white/[0.05] transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-doorli-blue to-doorli-mint text-white px-5 py-2.5 rounded-xl font-medium shadow-lg hover:shadow-doorli-mint/20 hover:scale-105 transition-all"
          >
            <Plus className="w-4 h-4" />
            New Feature
          </button>
        </div>
      </div>

      <div className="doorli-glass rounded-3xl border border-white/[0.08] overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-doorli-blue/5 to-transparent pointer-events-none" />
        
        {loading ? (
          <div className="p-10 flex justify-center text-white/50">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : features.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
              <ToggleLeft className="w-8 h-8 text-white/30" />
            </div>
            <h3 className="text-lg font-medium text-white mb-1">No feature flags</h3>
            <p className="text-sm text-doorli-dim mb-6 max-w-sm mx-auto">Create flags to control which vendors get access to specific platform capabilities.</p>
            <button onClick={() => setShowModal(true)} className="text-sm font-medium text-doorli-mint hover:text-white transition">
              Create your first flag
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto relative">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="text-doorli-dim uppercase tracking-wider font-semibold border-b border-white/[0.08] bg-white/[0.02]">
                <tr>
                  <th className="px-6 py-4">Key</th>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Description</th>
                  <th className="px-6 py-4">Scope</th>
                  <th className="px-6 py-4 text-right">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {features.map((feature) => (
                  <tr key={feature.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-4 font-mono text-xs font-semibold text-doorli-mint">
                      {feature.key}
                    </td>
                    <td className="px-6 py-4 text-white font-medium">
                      {feature.name}
                    </td>
                    <td className="px-6 py-4 text-doorli-dim max-w-xs truncate">
                      {feature.description || "-"}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                        feature.isGlobal ? "bg-purple-500/20 text-purple-300 border border-purple-500/30" : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                      }`}>
                        {feature.isGlobal ? "Global" : "Vendor Specific"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-doorli-dim">
                      {new Date(feature.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative doorli-glass-card rounded-3xl w-full max-w-md p-6 sm:p-8 animate-scale-up border border-white/10 shadow-2xl">
            <h2 className="text-xl font-display font-bold text-white mb-6">Create Feature Flag</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-doorli-dim mb-2">Key</label>
                <input 
                  type="text" required
                  placeholder="e.g. ai_reviews"
                  className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-doorli-mint"
                  value={formData.key} onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-doorli-dim mb-2">Display Name</label>
                <input 
                  type="text" required
                  placeholder="e.g. AI Review Sentiment"
                  className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-doorli-mint"
                  value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-doorli-dim mb-2">Description</label>
                <textarea 
                  placeholder="Optional details..."
                  className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-doorli-mint h-24 resize-none"
                  value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                <div>
                  <div className="text-sm font-medium text-white">Global Feature</div>
                  <div className="text-xs text-doorli-dim mt-0.5">Enabled for all vendors automatically</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={formData.isGlobal} onChange={(e) => setFormData({ ...formData, isGlobal: e.target.checked })} />
                  <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-doorli-mint"></div>
                </label>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-3 text-sm font-medium text-white bg-white/5 hover:bg-white/10 rounded-xl transition">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="flex-1 px-4 py-3 text-sm font-medium text-white bg-doorli-mint hover:bg-doorli-mint/80 rounded-xl transition flex justify-center items-center">
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create Flag"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
