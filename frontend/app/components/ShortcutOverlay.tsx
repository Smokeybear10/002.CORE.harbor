"use client";

import { useEffect, useRef, useState } from "react";

type Shortcut = { keys: string[]; desc: string };

const GROUPS: { title: string; items: Shortcut[] }[] = [
  {
    title: "Navigation",
    items: [
      { keys: ["⌘ / Ctrl", "K"], desc: "Search vessels and commands" },
      { keys: ["⌘ / Ctrl", "/"], desc: "Keyboard shortcuts" },
      { keys: ["Esc"], desc: "Close active panel" },
    ],
  },
  {
    title: "Panels",
    items: [
      { keys: ["A"], desc: "Toggle analytics panel" },
      { keys: ["?"], desc: "Show shortcut hint" },
    ],
  },
  {
    title: "Map",
    items: [
      { keys: ["Click"], desc: "Select vessel" },
      { keys: ["Scroll"], desc: "Zoom in / out" },
      { keys: ["Drag"], desc: "Pan the map" },
    ],
  },
];

export default function ShortcutOverlay() {
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement;
    closeRef.current?.focus();
    return () => {
      if (previous instanceof HTMLElement && previous.isConnected) previous.focus();
    };
  }, [open]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "/") {
        e.preventDefault();
        setOpen((v) => !v);
        return;
      }
      if (e.key === "Escape" && open) {
        e.preventDefault();
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 p-4"
      onClick={() => setOpen(false)}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="keyboard-shortcuts-title"
        className="w-full max-w-[480px] max-h-[calc(100dvh-32px)] overflow-y-auto rounded border border-[var(--workspace-border)] bg-[var(--workspace-surface)]"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === "Escape" || ((e.metaKey || e.ctrlKey) && e.key === "/")) {
            e.preventDefault();
            setOpen(false);
          }
          if (e.key === "Tab") {
            e.preventDefault();
            closeRef.current?.focus();
          }
        }}
      >
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.08]">
          <h2 id="keyboard-shortcuts-title" className="text-base font-medium text-slate-100">Keyboard shortcuts</h2>
          <button
            ref={closeRef}
            type="button"
            onClick={() => setOpen(false)}
            className="w-11 h-11 flex items-center justify-center rounded text-slate-400 hover:text-slate-100 hover:bg-white/[0.06] transition-colors"
            aria-label="Close shortcuts"
          >
            <svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-5 py-4 space-y-5">
          {GROUPS.map((group) => (
            <div key={group.title}>
              <h3 className="text-xs font-medium text-slate-400 mb-2.5">
                {group.title}
              </h3>
              <div className="space-y-1.5">
                {group.items.map((s) => (
                  <div key={s.desc} className="flex items-center justify-between gap-3 py-1.5">
                    <span className="text-sm text-slate-200">{s.desc}</span>
                    <div className="flex shrink-0 items-center gap-1">
                      {s.keys.map((k) => (
                        <kbd
                          key={k}
                          className="font-mono text-xs px-1.5 py-0.5 rounded-sm bg-white/[0.04] border border-[var(--workspace-border)] text-slate-300 min-w-[24px] text-center"
                        >
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="px-5 py-3 border-t border-[var(--workspace-border)] text-xs text-slate-400">
          Press Esc or click outside to close.
        </div>
      </div>
    </div>
  );
}
