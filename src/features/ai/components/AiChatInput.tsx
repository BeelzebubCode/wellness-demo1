// src/features/ai/components/AiChatInput.tsx
"use client";

import { useRef, useEffect, useState } from "react";
import { ArrowUp, RotateCcw, ChevronDown, Bot, Calendar, CheckCircle2, CalendarCheck, XCircle } from "lucide-react";
import type { useAiChat } from "@/features/ai/hooks/useAiChat";
import { cn } from "@/lib/cn";
import styles from "./aiChatTheme.module.css";

export type AiChatMode = "help" | "booking_agent";
export type AiChatController = ReturnType<typeof useAiChat>;

const MODES = [
  { id: "help", name: "AI Help Center", icon: <Bot className="h-4 w-4" /> },
  { id: "booking_agent", name: "Booking Agent", icon: <Calendar className="h-4 w-4" /> },
] as const;

export default function AiChatInput({
  mode = "help",
  chat,
  onModeChange,
}: {
  mode?: AiChatMode;
  chat: AiChatController;
  onModeChange?: (mode: AiChatMode) => void;
}) {
  const { input, setInput, send, reset, isLoading, canSend } = chat;
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const [isModeOpen, setIsModeOpen] = useState(false);
  const selectedMode = MODES.find((m) => m.id === mode) || MODES[0];

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [input]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isModeOpen && !(event.target as Element).closest('.mode-selector')) {
        setIsModeOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isModeOpen]);

  return (
    <div className="w-full pb-6 pt-3">
      {/* Container */}
      <div className="mx-auto max-w-4xl px-6">
        
        {/* ✅ Confirmation Card (Floating above input) */}
        {mode === "booking_agent" && chat.agent?.confirmToken && (
          <div className="mb-4 animate-in slide-in-from-bottom-5 fade-in zoom-in-95">
            <div className="relative overflow-hidden rounded-2xl border border-indigo-100 bg-white p-4 shadow-xl">
              <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-indigo-500 to-purple-500" />
              
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                  <CalendarCheck className="h-6 w-6" />
                </div>
                
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-slate-900">
                    ยืนยันการจองคิว?
                  </h3>
                  <p className="mt-1 text-sm text-slate-600">
                    ระบบได้เตรียมข้อมูลการจองของคุณแล้ว กรุณาตรวจสอบและกดยืนยัน
                  </p>
                  
                  {/* Optional: Show Plan Details if available */}
                  {chat.agent.plan && (
                    <div className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
                      <div className="font-medium text-slate-900 mb-1">รายละเอียด:</div>
                      <pre className="whitespace-pre-wrap font-sans text-xs text-slate-600">
                        {JSON.stringify(chat.agent.plan, null, 2)}
                      </pre>
                    </div>
                  )}

                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => chat.confirmAgentAction()}
                      disabled={isLoading}
                      className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                    >
                      {isLoading ? (
                        <>กำลังยืนยัน...</>
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4" />
                          ยืนยันการจอง
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => chat.reset()} // Or specialized cancel
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-red-600 transition-colors"
                    >
                      ยกเลิก
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {/* Input Box (Top) - Transparent background */}
          <div className="relative flex items-end gap-3 rounded-[28px] bg-transparent border-2 border-slate-200 px-4 py-3 shadow-sm focus-within:border-indigo-400 focus-within:shadow-md transition-all">
            
            {/* Textarea (Flexible) */}
            <div className="flex-1 min-w-0">
              <textarea
                ref={textareaRef}
                value={input}
                placeholder={
                  mode === "booking_agent"
                    ? 'พิมพ์คำขอจอง/ยกเลิก "พรุ่งนี้ 14:00"'
                    : "ถามอะไรก็ได้..."
                }
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                rows={1}
                disabled={isLoading}
                className={cn(
                  styles.inputText,
                  "max-h-[200px] w-full resize-none bg-transparent outline-none border-0 px-2 py-1",
                  "placeholder:text-slate-400 text-slate-900 text-[15px]",
                  "scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent leading-[1.6]"
                )}
                style={{ minHeight: "40px" }}
              />
            </div>

            {/* Send Button (Right) */}
            <div className="pb-0.5">
              <button
                type="button"
                onClick={send}
                disabled={!canSend}
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full transition-all",
                  canSend 
                    ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md hover:shadow-lg" 
                    : "bg-slate-300 text-slate-400 cursor-not-allowed"
                )}
                aria-label="ส่งข้อความ"
              >
                <ArrowUp className="h-5 w-5" strokeWidth={2.5} />
              </button>
            </div>
          </div>

          {/* Controls Row (Bottom) */}
          <div className="flex items-center gap-3 px-2">
            {/* Reset Button */}
            <button
              type="button"
              onClick={reset}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-slate-500 hover:bg-slate-100 hover:text-red-500 transition-colors text-sm"
              title="เริ่มใหม่"
            >
              <RotateCcw className="h-4 w-4" />
              <span>รีเซ็ต</span>
            </button>

            {/* Mode Selector Dropdown */}
            <div className="relative mode-selector">
              <button 
                onClick={() => setIsModeOpen(!isModeOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-200 transition-colors"
              >
                <span className="text-indigo-600">{selectedMode.icon}</span>
                {selectedMode.name}
                <ChevronDown className={cn("h-3.5 w-3.5 text-slate-400 transition-transform", isModeOpen && "rotate-180")} />
              </button>
              
              {/* Custom Dropdown (Drop-up) */}
              {isModeOpen && (
                <div className="absolute bottom-full left-0 mb-2 z-50 min-w-[220px] overflow-hidden rounded-xl border border-slate-100 bg-white p-1.5 shadow-xl animate-in fade-in zoom-in-95 slide-in-from-bottom-2">
                  {MODES.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => {
                        onModeChange?.(m.id as AiChatMode);
                        setIsModeOpen(false);
                      }}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors",
                        mode === m.id && "bg-indigo-50 font-medium text-indigo-700"
                      )}
                    >
                      <span className={mode === m.id ? "text-indigo-600" : "text-slate-400"}>
                        {m.icon}
                      </span>
                      {m.name}
                      {mode === m.id && <CheckCircle2 className="ml-auto h-4 w-4 text-indigo-600" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
}
