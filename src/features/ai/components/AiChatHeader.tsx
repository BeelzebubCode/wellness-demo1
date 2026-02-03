// src/features/ai/components/AiChatHeader.tsx

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Bot, Check, ChevronDown } from "lucide-react";
import { AiChatMode } from "./AiChatCore";
import { cn } from "@/lib/cn";
import styles from "./aiChatTheme.module.css";

type ModeOption = {
  value: AiChatMode;
  title: string;
  desc: string;
};

const MODE_OPTIONS: ModeOption[] = [
  { value: "help", title: "AI Help Center", desc: "ถามตอบ/คู่มือ/อธิบายระบบ" },
  { value: "booking_agent", title: "AI Booking Agent", desc: "จองคิว/ยกเลิก → Plan → Confirm" },
];

export default function AiChatHeader({
  mode,
  onModeChange,
}: {
  mode: AiChatMode;
  onModeChange?: (mode: AiChatMode) => void;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const current = useMemo(
    () => MODE_OPTIONS.find((x) => x.value === mode) ?? MODE_OPTIONS[0],
    [mode],
  );

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    const onMouseDown = (e: MouseEvent) => {
      const t = e.target as Node | null;
      if (!t) return;
      if (wrapRef.current?.contains(t)) return;
      setOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("mousedown", onMouseDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("mousedown", onMouseDown);
    };
  }, [open]);

  const canSwitch = typeof onModeChange === "function";

  return (
    <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl border">
          <Bot className="h-5 w-5 text-slate-700" />
        </div>

        <div className="flex flex-col">
          {/* ✅ คุม font จาก CSS module */}
          <div className={cn("font-semibold text-slate-900", styles.headerTitle)}>
            {current.title}
          </div>
          <div className={cn("text-slate-400", styles.headerDesc)}>{current.desc}</div>
        </div>
      </div>

      {/* ✅ wrapper ref */}
      <div ref={wrapRef} className="relative">
        <button
          type="button"
          disabled={!canSwitch}
          onClick={() => canSwitch && setOpen((s) => !s)}
          className={cn(
            "inline-flex items-center gap-2 rounded-full border px-3 py-1.5",
            styles.headerBtn, // ✅ คุม font ปุ่มจาก css
            canSwitch
              ? "border-slate-200 bg-white hover:bg-slate-50 active:scale-[0.99]"
              : "border-slate-100 bg-slate-50 text-slate-400",
          )}
        >
          <span className="font-medium">{mode === "help" ? "Help" : "Booking"}</span>
          <ChevronDown className={"h-4 w-4 transition " + (open ? "rotate-180" : "")} />
        </button>

        {open && canSwitch && (
          <div
            className="
              absolute right-0 mt-2 w-[320px]
              rounded-2xl border border-slate-200 bg-white
              shadow-[0_12px_30px_rgba(0,0,0,0.10)]
              overflow-hidden
              z-[999]
            "
          >
            <div className={cn("px-4 py-3 font-semibold text-slate-500", styles.dropdownLabel)}>
              โหมดแชท
            </div>

            <div className="p-2">
              {MODE_OPTIONS.map((opt) => {
                const active = opt.value === mode;

                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      if (!active) onModeChange?.(opt.value);
                      setOpen(false);
                    }}
                    className={cn(
                      "w-full text-left rounded-xl px-3 py-2.5 flex items-start gap-3",
                      active ? "bg-slate-50" : "hover:bg-slate-50 active:bg-slate-100",
                    )}
                  >
                    <div
                      className={cn(
                        "mt-0.5 h-5 w-5 rounded-full border flex items-center justify-center",
                        active ? "border-slate-800" : "border-slate-200",
                      )}
                    >
                      {active && <Check className="h-4 w-4" />}
                    </div>

                    <div className="min-w-0">
                      <div className={cn("font-semibold text-slate-900", styles.dropdownTitle)}>
                        {opt.title}
                      </div>
                      <div className={cn("text-slate-500 truncate", styles.dropdownDesc)}>
                        {opt.desc}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
