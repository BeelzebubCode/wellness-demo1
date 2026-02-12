"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { ArrowUp, RotateCcw, ChevronDown, Bot, Calendar, CheckCircle2, CalendarCheck, XCircle } from "lucide-react";
import type { useAiChat } from "@/features/ai/hooks/useAiChat";
import { cn } from "@/lib/cn";
import styles from "./aiChatTheme.module.css";
import { useRoleAuth } from "@/features/auth/hooks/useRoleAuth";
import { useNotificationContext } from "@/components/notification/NotificationProvider";

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

  // ✅ Auth Check (requireTenant: false — AI Chat ไม่ต้องเช็ค tenant)
  const { isAuthenticated, isLoading: authLoading } = useRoleAuth({
    allowedRoles: ["STUDENT", "PERSONNEL", "RECTOR", "ADMIN", "SUPER_ADMIN", "CONSULTANT", "HEAD_CONSULTANT"],
    loginToastKey: "ai_login_required",
    guard: false,
    requireTenant: false,
  });
  const { push } = useNotificationContext();

  // ✅ Force Help Mode if not Auth (ใช้ authLoading ไม่ใช่ chat.isLoading!)
  const didForceHelpRef = useRef(false);
  useEffect(() => {
    // รอ AUTH load เสร็จก่อน + ต้องเป็น booking_agent + ยังไม่เคย force
    if (authLoading || isAuthenticated || mode !== "booking_agent" || didForceHelpRef.current) return;
    didForceHelpRef.current = true;
    push({
      type: "warning",
      title: "กรุณาเข้าสู่ระบบ",
      message: "ระบบเปลี่ยนเป็นโหมดช่วยเหลือเนื่องจากคุณยังไม่เข้าสู่ระบบ",
    });
    onModeChange?.("help");
  }, [authLoading, isAuthenticated, mode, onModeChange, push]);
  // Reset ref เมื่อ mode เปลี่ยน
  useEffect(() => { didForceHelpRef.current = false; }, [mode]);

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
                    {(chat.agent.plan as any)?.intent === "CANCEL"
                      ? "ยืนยันการยกเลิกนัดหมาย?"
                      : "ยืนยันการจองคิว?"}
                  </h3>
                  <p className="mt-1 text-sm text-slate-600">
                    ระบบได้เตรียมข้อมูลการจองของคุณแล้ว กรุณาตรวจสอบและกดยืนยัน
                  </p>

                  {/* Optional: Show Plan Details if available */}
                  {chat.agent.plan && (
                    <div className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
                      <div className="font-medium text-slate-900 mb-2">รายละเอียด:</div>
                      <div className="space-y-1">
                        {Object.entries(chat.agent.plan).map(([key, value]) => {
                          const labels: Record<string, string> = {
                            intent: "ความต้องการ",
                            date: "วันที่",
                            time: "เวลา",
                            reason: "เหตุผล",
                            topic: "หัวข้อ", // or "บริการ"
                            service: "บริการ",
                            consultant: "ผู้ให้คำปรึกษา",
                            action: "การดำเนินการ",

                            // Booking specific (CamelCase & PascalCase support)
                            timeRange: "ช่วงเวลา",
                            TimeRange: "ช่วงเวลา",
                            problemCategoryCode: "หมวดปัญหา",
                            ProblemCategoryCode: "หมวดปัญหา",
                            detailText: "รายละเอียดเพิ่มเติม",
                            DetailText: "รายละเอียดเพิ่มเติม",
                          };


                          // Skip internal/empty keys if necessary
                          if (!value) return null;

                          // Normalize key for display
                          const label = labels[key] ?? key;

                          // Map intent/value values
                          let displayValue = String(value);

                          if (key === "intent" && value === "CANCEL") displayValue = "ยกเลิกนัดหมาย";
                          if (key === "intent" && value === "BOOK") displayValue = "จองคิว";

                          // ✅ Dynamic Map using categories list from server
                          if (key.toLowerCase().includes("category")) {
                            const codeStr = String(displayValue).trim().toUpperCase();
                            const catObj = chat.agent?.categories?.find((c: any) =>
                              String(c.code || "").trim().toUpperCase() === codeStr
                            );
                            if (catObj?.name) {
                              displayValue = catObj.name;
                            }
                          }

                          return (
                            <div key={key} className="flex flex-col sm:flex-row sm:gap-2">
                              {/* Label */}
                              <span className="font-medium text-slate-500 min-w-[60px] capitalize">
                                {label}:
                              </span>
                              {/* Value */}
                              <span className="text-slate-800 break-words font-medium">
                                {typeof value === "object"
                                  ? JSON.stringify(value)
                                  : displayValue}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => chat.confirmAgentAction()}
                      disabled={isLoading}
                      className={cn(
                        "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white shadow-sm disabled:opacity-50 transition-colors",
                        (chat.agent.plan as any)?.intent === "CANCEL"
                          ? "bg-red-600 hover:bg-red-700"
                          : "bg-indigo-600 hover:bg-indigo-700"
                      )}
                    >
                      {isLoading ? (
                        <>กำลังยืนยัน...</>
                      ) : (
                        <>
                          {(chat.agent.plan as any)?.intent === "CANCEL" ? (
                            <XCircle className="h-4 w-4" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4" />
                          )}
                          {(chat.agent.plan as any)?.intent === "CANCEL"
                            ? "ยืนยันการยกเลิก"
                            : "ยืนยันการจอง"}
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

        {/* ✅ Question Options (NEW) */}
        {mode === "booking_agent" && !chat.agent?.confirmToken && chat.agent?.questions && chat.agent.questions.length > 0 && (
          <div className="mb-4 animate-in slide-in-from-bottom-5 fade-in zoom-in-95">
            {chat.agent.questions.map((q, idx) => (
              q.options && q.options.length > 0 && (
                <div key={idx} className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/50 p-4 shadow-sm">
                  <p className="mb-3 text-sm font-medium text-slate-700">
                    {q.text || "เลือกตัวเลือก:"}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {q.options.map((opt: any) => (
                      <button
                        key={opt.value}
                        type="button"
                        disabled={isLoading}
                        onClick={() => {
                          // Send the label as text
                          const val = opt.label || opt.value;
                          chat.sendMessage(val);
                        }}
                        className="inline-flex items-center rounded-full border border-indigo-200 bg-white px-3 py-1.5 text-sm text-indigo-700 shadow-sm hover:bg-indigo-50 hover:border-indigo-300 transition-colors"
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )
            ))}
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
                        // ✅ Auth Check
                        if (m.id === "booking_agent" && !isAuthenticated) {
                          push({
                            type: "warning", // Or 'error'
                            title: "กรุณาเข้าสู่ระบบ",
                            message: "ฟีเจอร์จองคิวเปิดให้ใช้งานเฉพาะผู้ที่เข้าสู่ระบบแล้วเท่านั้น",
                          });
                          setIsModeOpen(false);
                          return;
                        }

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
