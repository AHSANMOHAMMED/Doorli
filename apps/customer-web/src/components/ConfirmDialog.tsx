"use client";

import React from "react";
import { Loader2 } from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "neutral";
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "neutral",
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  const variantStyles = {
    danger: {
      border: "border-red-500/40",
      iconBg: "bg-red-500/20",
      iconColor: "text-red-400",
      confirmBg: "bg-red-600 hover:bg-red-700",
    },
    warning: {
      border: "border-amber-500/40",
      iconBg: "bg-amber-500/20",
      iconColor: "text-amber-400",
      confirmBg: "bg-amber-600 hover:bg-amber-700",
    },
    neutral: {
      border: "border-white/20",
      iconBg: "bg-white/10",
      iconColor: "text-white/70",
      confirmBg: "bg-white/20 hover:bg-white/30",
    },
  };

  const s = variantStyles[variant];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div
        className={`doorli-glass-card rounded-2xl p-6 max-w-sm w-full mx-4 border ${s.border} animate-bounce-in`}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-10 h-10 rounded-full ${s.iconBg} flex items-center justify-center`}>
            <Loader2 className={`w-5 h-5 ${s.iconColor}`} />
          </div>
          <h3 className="font-display text-lg font-bold text-white">{title}</h3>
        </div>
        <p className="text-sm text-white/60 mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white/70 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 rounded-xl text-sm font-semibold text-white transition-colors ${s.confirmBg} ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
