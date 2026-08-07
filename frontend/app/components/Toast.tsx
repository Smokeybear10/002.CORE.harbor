"use client";

import { useEffect } from "react";

export interface ToastItem {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

interface ToastProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

const ICONS: Record<ToastItem["type"], string> = {
  success: "M20 6L9 17l-5-5",
  error: "M18 6L6 18M6 6l12 12",
  info: "M12 16v-4m0-4h.01M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Z",
};

const COLORS: Record<ToastItem["type"], { border: string; icon: string; bg: string }> = {
  success: { border: "border-emerald-500/25", icon: "text-emerald-400", bg: "bg-emerald-500/10" },
  error: { border: "border-red-500/25", icon: "text-red-400", bg: "bg-red-500/10" },
  info: { border: "border-blue-500/25", icon: "text-blue-400", bg: "bg-blue-500/10" },
};

function ToastCard({ toast, onDismiss }: { toast: ToastItem; onDismiss: (id: string) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 3000);
    return () => clearTimeout(timer);
  }, [onDismiss, toast.id]);

  const c = COLORS[toast.type];

  return (
    <div
      className={`pointer-events-auto flex w-72 max-w-[calc(100vw-24px)] items-center gap-2.5 rounded-lg border ${c.border} bg-[#111923] pl-3 pr-1 shadow-lg`}
      style={{ animation: "fade-in-up 0.25s ease-out" }}
    >
      <div className={`shrink-0 mt-0.5 ${c.icon}`}>
        <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d={ICONS[toast.type]} />
        </svg>
      </div>
      <p className="flex-1 py-3 text-[13px] text-slate-200 leading-relaxed">{toast.message}</p>
      <button
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss notification"
        className="flex h-11 w-11 shrink-0 items-center justify-center text-slate-400 transition-colors hover:text-slate-100"
      >
        <svg aria-hidden="true" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

export default function Toast({ toasts, onDismiss }: ToastProps) {
  if (toasts.length === 0) return null;

  return (
    <div role="status" aria-live="polite" className="pointer-events-none absolute bottom-[calc(var(--map-panel-bottom,16px)+12px)] right-3 z-[100] flex flex-col gap-2">
      {toasts.map((t) => (
        <ToastCard key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}
