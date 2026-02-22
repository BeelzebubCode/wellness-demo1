"use client";

import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import { ArrowUp, RotateCcw, ChevronDown, Bot, Calendar, CheckCircle2, CalendarCheck, XCircle, LineChart } from "lucide-react";
import type { useAiChat } from "@/features/ai/hooks/useAiChat";
import { cn } from "@/lib/cn";
import styles from "./aiChatTheme.module.css";
import { useRoleAuth } from "@/features/auth/hooks/useRoleAuth";
import { useNotificationContext } from "@/components/notification/NotificationProvider";

import type { ServiceMode } from "@/shared/types/service";
import type { OnlineChannelCode } from "@/lib/constants/booking-service";
import { ServiceModePicker } from "@/features/booking/components/forms/ServiceMode";
import { ConsentBlock } from "@/features/booking/components/forms/ConsentBlock";
import { SignaturePad } from "@/features/booking/components/forms/SignaturePad";

export type AiChatMode = "help" | "booking_agent" | "analyst";
export type AiChatController = ReturnType<typeof useAiChat>;

const MODES = [
  { id: "help", name: "AI Help Center", icon: <Bot className="h-4 w-4" /> },
  { id: "booking_agent", name: "AI Booking", icon: <Calendar className="h-4 w-4" /> },
  { id: "analyst", name: "AI สรุปผล", icon: <LineChart className="h-4 w-4" /> },
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

  const { user, isAuthenticated, isLoading: authLoading } = useRoleAuth({
    allowedRoles: ["STUDENT", "PERSONNEL", "DEAN", "RECTOR", "MINISTRY", "ADMIN", "SUPER_ADMIN", "CONSULTANT", "HEAD_CONSULTANT"] as const,
    loginToastKey: "ai_login_required",
    guard: false,
    requireTenant: false,
  });
  const { push } = useNotificationContext();

  const [consentChecked, setConsentChecked] = useState(false);
  const [agreementSignature, setAgreementSignature] = useState<string | null>(null);
  const [isCardCollapsed, setIsCardCollapsed] = useState(false);
  const [customReasonMode, setCustomReasonMode] = useState(false);
  const [customReasonText, setCustomReasonText] = useState("");
  // Per-question-index custom input mode for BOOK flow options
  const [qCustomMode, setQCustomMode] = useState<Record<number, boolean>>({});
  const [qCustomText, setQCustomText] = useState<Record<number, string>>({});

  const isCancelIntent = (chat.agent?.plan as any)?.intent === "CANCEL";
  const planServiceMode = (chat.agent?.plan as any)?.serviceMode;
  const planOnlineChannel = (chat.agent?.plan as any)?.onlineChannelCode;

  const needsSignature = planServiceMode === "ONLINE";

  const canConfirmBooking = useMemo(() => {
    if (isCancelIntent) return true;
    if (!consentChecked) return false;
    if (needsSignature && !agreementSignature) return false;
    return true;
  }, [consentChecked, needsSignature, agreementSignature, isCancelIntent]);

  const didForceHelpRef = useRef(false);

  const availableModes = MODES.filter((m) => {
    if (m.id === "booking_agent") return isAuthenticated && user?.role === "STUDENT";
    if (m.id === "analyst") return isAuthenticated && user?.role && !["CONSULTANT", "HEAD_CONSULTANT"].includes(user.role);
    return true;
  });

  useEffect(() => {
    if (authLoading || isAuthenticated || mode !== "booking_agent" || didForceHelpRef.current) return;
    didForceHelpRef.current = true;
    push({
      type: "warning",
      title: "กรุณาเข้าสู่ระบบ",
      message: "ระบบเปลี่ยนเป็นโหมดช่วยเหลือเนื่องจากคุณยังไม่เข้าสู่ระบบ",
    });
    onModeChange?.("help");
  }, [authLoading, isAuthenticated, mode, onModeChange, push]);

  useEffect(() => { didForceHelpRef.current = false; }, [mode]);

  const [isModeOpen, setIsModeOpen] = useState(false);
  const selectedMode = availableModes.find((m) => m.id === mode) || availableModes[0] || MODES[0];

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [input]);

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
    <div className="w-full pb-4">
      <div className="mx-auto max-w-4xl">

        {/* ✅ Confirmation Card — inline, fills chat width */}
        {mode === "booking_agent" && chat.agent?.confirmToken && (
          <div className="mb-3 w-full animate-in slide-in-from-bottom-6 fade-in duration-400">
            <div className="overflow-hidden rounded-2xl border border-indigo-200 bg-white shadow-xl">

              {/* Gradient top strip */}
              <div className="h-1 w-full bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500" />

              {/* ── Header ── */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                  <CalendarCheck className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-bold text-slate-800 leading-tight">
                    {(chat.agent.plan as any)?.intent === "CANCEL" ? "ยืนยันการยกเลิกนัดหมาย" : "ยืนยันการจองคิว"}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {isCardCollapsed ? "กด \"ขยาย\" เพื่อดูรายละเอียดและยืนยัน" : "ตรวจสอบข้อมูลด้านล่างและกดยืนยัน"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCardCollapsed((v) => !v)}
                  className="shrink-0 flex items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-[12px] font-semibold text-indigo-600 hover:bg-indigo-100 transition-colors focus:outline-none"
                >
                  {isCardCollapsed ? "ขยาย" : "ย่อ"}
                  <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-300", isCardCollapsed && "rotate-180")} />
                </button>
              </div>

              {/* ── Accordion body (collapsible) ── */}
              <div className={cn(
                "grid transition-all duration-300 ease-in-out",
                isCardCollapsed ? "grid-rows-[0fr] opacity-0 pointer-events-none" : "grid-rows-[1fr] opacity-100"
              )}>
                <div className="overflow-hidden min-h-0">
                  {/* Scrollable content area */}
                  <div className="overflow-y-auto max-h-[45vh] overscroll-contain">
                    <div className="p-4 flex flex-col gap-4">

                      {/* Plan summary */}
                      {chat.agent.plan && (() => {
                        const labels: Record<string, string> = {
                          intent: "ความต้องการ", date: "วันที่", time: "เวลา",
                          reason: "เหตุผล", topic: "หัวข้อ", service: "บริการ",
                          consultant: "ที่ปรึกษา", action: "การดำเนินการ",
                          timeRange: "ช่วงเวลา", TimeRange: "ช่วงเวลา",
                          problemCategoryCode: "หมวดปัญหา", ProblemCategoryCode: "หมวดปัญหา",
                          detailText: "รายละเอียด", DetailText: "รายละเอียด",
                          serviceMode: "รูปแบบ", onlineChannelCode: "ช่องทาง",
                        };
                        const entries = Object.entries(chat.agent.plan)
                          .filter(([, v]) => !!v)
                          .map(([key, value]) => {
                            let dv = String(value);
                            if (key === "intent") dv = dv === "CANCEL" ? "ยกเลิกนัดหมาย" : "จองคิว";
                            if (key === "serviceMode") dv = dv === "ONLINE" ? "ออนไลน์" : dv === "ONSITE" ? "พบที่ศูนย์" : dv;
                            if (key === "problemCategoryCode") {
                              const c = chat.agent?.categories?.find((c: any) => String(c.code || "").toUpperCase() === dv.toUpperCase());
                              if (c?.name) dv = c.name;
                            }
                            if (key === "onlineChannelCode") {
                              const c = chat.agent?.channels?.find((c: any) => String(c.code || "").toUpperCase() === dv.toUpperCase());
                              if (c?.name) dv = c.name;
                            }
                            return { key, label: labels[key] ?? key, dv, value };
                          });
                        return (
                          <div className="rounded-xl bg-gradient-to-br from-slate-50 to-indigo-50/40 border border-slate-100 p-4">
                            <p className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.15em] mb-3">รายละเอียดนัดหมาย</p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3">
                              {entries.map(({ key, label, dv, value }) => (
                                <div key={key} className="flex flex-col gap-0.5 min-w-0">
                                  <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wide">{label}</span>
                                  <span className="text-[13px] font-semibold text-slate-700 break-words leading-snug">
                                    {typeof value === "object" ? JSON.stringify(value) : dv}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })()}

                      {/* Consent + Signature */}
                      {chat.agent.plan && !isCancelIntent && (
                        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                          <div className="p-3">
                            <ConsentBlock checked={consentChecked} onChange={setConsentChecked} />
                          </div>
                          {needsSignature && consentChecked && (
                            <div className="border-t border-slate-100 animate-in slide-in-from-top-3 fade-in duration-300">
                              <SignaturePad
                                value={agreementSignature}
                                onChange={setAgreementSignature}
                                disabled={isLoading}
                                className="h-[160px]"
                              />
                            </div>
                          )}
                        </div>
                      )}

                    </div>
                  </div>
                </div>
              </div>

              {/* ── Footer — OUTSIDE accordion, always visible ── */}
              {!isCardCollapsed && (
                <div className="border-t border-slate-100 bg-white px-4 py-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const payload = isCancelIntent ? {} : {
                        serviceMode: planServiceMode,
                        onlineChannelCode: planOnlineChannel,
                        consentChecked,
                        agreementSignatureDataUrl: planServiceMode === "ONLINE" ? agreementSignature : null,
                      };
                      chat.confirmAgentAction(payload);
                    }}
                    disabled={isLoading || !canConfirmBooking}
                    className={cn(
                      "flex-1 inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white shadow-lg transition-all active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed",
                      (chat.agent.plan as any)?.intent === "CANCEL"
                        ? "bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 shadow-red-200/50"
                        : "bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 shadow-indigo-300/50"
                    )}
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                        กำลังยืนยัน...
                      </span>
                    ) : (
                      <>
                        {(chat.agent.plan as any)?.intent === "CANCEL"
                          ? <XCircle className="h-4 w-4" />
                          : <CheckCircle2 className="h-4 w-4" />}
                        {(chat.agent.plan as any)?.intent === "CANCEL" ? "ยืนยันการยกเลิก" : "ยืนยันการจอง"}
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => chat.reset()}
                    className="shrink-0 inline-flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all active:scale-[0.97]"
                  >
                    ยกเลิก
                  </button>
                </div>
              )}

            </div>
          </div>
        )}

        {/* ✅ Cancel Reason Pills — shown when CANCEL intent and no confirm token yet */}
        {mode === "booking_agent" && !chat.agent?.confirmToken &&
          chat.agent?.intent === "CANCEL" &&
          chat.agent?.cancelReasons && chat.agent.cancelReasons.length > 0 && (
            <div className="mb-3 animate-in slide-in-from-bottom-5 fade-in zoom-in-95">
              <div className="relative overflow-hidden rounded-2xl border border-rose-100 bg-rose-50/60 p-2 md:p-3 shadow-sm">
                <p className="mb-2 text-[9px] md:text-[10px] font-black text-rose-400 uppercase tracking-widest pl-1">
                  เลือกเหตุผลการยกเลิก:
                </p>

                {/* Custom reason input — shown when user clicked "อื่นๆ" */}
                {customReasonMode ? (
                  <div className="flex items-center gap-2 mt-1 animate-in fade-in slide-in-from-top-2 duration-200">
                    <input
                      type="text"
                      autoFocus
                      value={customReasonText}
                      onChange={(e) => setCustomReasonText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && customReasonText.trim()) {
                          chat.sendMessage(customReasonText.trim());
                          setCustomReasonMode(false);
                          setCustomReasonText("");
                        }
                        if (e.key === "Escape") {
                          setCustomReasonMode(false);
                          setCustomReasonText("");
                        }
                      }}
                      placeholder="ระบุเหตุผลของคุณ..."
                      className="flex-1 rounded-xl border border-rose-200 bg-white px-3 py-1.5 text-[13px] text-slate-700 placeholder:text-slate-400 outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-200 transition-all"
                    />
                    <button
                      type="button"
                      disabled={!customReasonText.trim() || isLoading}
                      onClick={() => {
                        if (!customReasonText.trim()) return;
                        chat.sendMessage(customReasonText.trim());
                        setCustomReasonMode(false);
                        setCustomReasonText("");
                      }}
                      className="shrink-0 inline-flex items-center rounded-xl bg-rose-500 hover:bg-rose-600 px-3 py-1.5 text-[12px] font-semibold text-white transition-colors disabled:opacity-40"
                    >
                      ส่ง
                    </button>
                    <button
                      type="button"
                      onClick={() => { setCustomReasonMode(false); setCustomReasonText(""); }}
                      className="shrink-0 text-[12px] text-rose-400 hover:text-rose-600 px-1"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1 md:gap-1.5">
                    {chat.agent.cancelReasons.map((r: any) => {
                      const isOther = r.code === "OTHER" || (r.name || "").toLowerCase().includes("other") || r.name.includes("อื่น");
                      return (
                        <button
                          key={r.id}
                          type="button"
                          disabled={isLoading}
                          onClick={() => {
                            if (isOther) {
                              setCustomReasonMode(true);
                            } else {
                              chat.sendMessage(r.name);
                            }
                          }}
                          className="inline-flex items-center rounded-full border border-rose-200 bg-white px-2 py-0.5 md:px-3 md:py-1 text-[11px] md:text-[12px] text-rose-600 font-medium shadow-sm hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 transition-all active:scale-95 disabled:opacity-50"
                        >
                          {r.name}
                          {isOther && <span className="ml-1 text-[10px] opacity-60">✏️</span>}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

        {/* ✅ Question Options (BOOK flow — categories, time etc.) */}
        {mode === "booking_agent" && !chat.agent?.confirmToken &&
          chat.agent?.intent !== "CANCEL" &&
          chat.agent?.questions && chat.agent.questions.length > 0 && (
            <div className="mb-4 animate-in slide-in-from-bottom-5 fade-in zoom-in-95 flex flex-col gap-2">
              {chat.agent.questions.map((q: any, idx: number) => (
                q.options && q.options.length > 0 && (
                  <div key={idx} className="relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-2 md:p-2.5 shadow-sm">
                    <p className="mb-1 text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                      {q.text || "เลือกตัวเลือก:"}
                    </p>

                    {qCustomMode[idx] ? (
                      /* Custom text input when user picked "OTHER" */
                      <div className="flex items-center gap-2 mt-1 animate-in fade-in slide-in-from-top-2 duration-200">
                        <input
                          type="text"
                          autoFocus
                          value={qCustomText[idx] ?? ""}
                          onChange={(e) => setQCustomText((prev) => ({ ...prev, [idx]: e.target.value }))}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && (qCustomText[idx] ?? "").trim()) {
                              chat.sendMessage((qCustomText[idx] ?? "").trim());
                              setQCustomMode((prev) => ({ ...prev, [idx]: false }));
                              setQCustomText((prev) => ({ ...prev, [idx]: "" }));
                            }
                            if (e.key === "Escape") {
                              setQCustomMode((prev) => ({ ...prev, [idx]: false }));
                            }
                          }}
                          placeholder="ระบุสั้น ๆ..."
                          className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-[13px] text-slate-700 placeholder:text-slate-400 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100 transition-all"
                        />
                        <button
                          type="button"
                          disabled={!(qCustomText[idx] ?? "").trim() || isLoading}
                          onClick={() => {
                            const val = (qCustomText[idx] ?? "").trim();
                            if (!val) return;
                            chat.sendMessage(val);
                            setQCustomMode((prev) => ({ ...prev, [idx]: false }));
                            setQCustomText((prev) => ({ ...prev, [idx]: "" }));
                          }}
                          className="shrink-0 inline-flex items-center rounded-xl bg-indigo-500 hover:bg-indigo-600 px-3 py-1.5 text-[12px] font-semibold text-white transition-colors disabled:opacity-40"
                        >
                          ส่ง
                        </button>
                        <button
                          type="button"
                          onClick={() => setQCustomMode((prev) => ({ ...prev, [idx]: false }))}
                          className="shrink-0 text-[12px] text-slate-400 hover:text-slate-600 px-1"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-1 md:gap-1.5">
                        {q.options.map((opt: any) => {
                          const valStr = String(opt.value ?? "").toUpperCase();
                          const lblStr = String(opt.label ?? "").toLowerCase();
                          const isOther =
                            opt.code === "OTHER" ||
                            valStr === "OTHER" ||
                            lblStr.includes("other") ||
                            lblStr.includes("อื่น");
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              disabled={isLoading}
                              onClick={() => {
                                if (isOther) {
                                  setQCustomMode((prev) => ({ ...prev, [idx]: true }));
                                } else {
                                  chat.sendMessage(opt.label || opt.value);
                                }
                              }}
                              className="inline-flex items-center rounded-full border border-indigo-50 bg-white px-2 py-0.5 md:px-3 md:py-1 text-[11px] md:text-[12px] text-indigo-600 font-medium shadow-sm hover:bg-indigo-50 hover:text-indigo-700 transition-all active:scale-95 disabled:opacity-50"
                            >
                              {opt.label}
                              {isOther && <span className="ml-1 text-[10px] opacity-60">✏️</span>}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )
              ))}
            </div>
          )}


        <div className="flex flex-col gap-3">
          {/* Input Box */}
          <div className="relative flex items-end gap-2 rounded-2xl bg-transparent border-2 border-slate-200 px-3 py-2 shadow-sm focus-within:border-indigo-400 focus-within:shadow-md transition-all">
            <div className="flex-1 min-w-0">
              <textarea
                ref={textareaRef}
                value={input}
                placeholder={
                  mode === "booking_agent"
                    ? 'พิมพ์คำขอจอง/ยกเลิก "พรุ่งนี้ 14:00"'
                    : mode === "analyst"
                      ? "ถามสถิติ 7 วันล่าสุด, ดูเทรนด์..."
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
                  "max-h-[150px] w-full resize-none bg-transparent outline-none border-0 px-1 py-0.5",
                  "placeholder:text-slate-400 text-slate-900 text-[13px] md:text-[14px]",
                  "scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent leading-[1.5]"
                )}
                style={{ minHeight: "32px" }}
              />
            </div>
            <div className="pb-0.5">
              <button
                type="button"
                onClick={send}
                disabled={!canSend}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full transition-all duration-300",
                  canSend
                    ? "bg-gradient-to-br from-indigo-500 to-primary-600 text-white shadow-[0_4px_12px_rgba(79,70,229,0.3)] hover:shadow-[0_6px_16px_rgba(79,70,229,0.4)] hover:-translate-y-0.5"
                    : "bg-slate-200 text-slate-400 cursor-not-allowed"
                )}
                aria-label="ส่งข้อความ"
              >
                <ArrowUp className={cn("h-4 w-4 transition-transform", canSend && "group-hover:translate-y-[-1px]")} strokeWidth={3} />
              </button>
            </div>
          </div>

          {/* Controls Row */}
          <div className="flex items-center gap-3 px-2">
            <button
              type="button"
              onClick={reset}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-slate-500 hover:bg-slate-100 hover:text-red-500 transition-colors text-[12px]"
              title="เริ่มใหม่"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>รีเซ็ต</span>
            </button>

            <div className="relative mode-selector">
              <button
                onClick={() => setIsModeOpen(!isModeOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-[12px] font-medium text-slate-700 hover:bg-slate-200 transition-colors"
              >
                <span className="text-indigo-600">{selectedMode.icon}</span>
                {selectedMode.name}
                <ChevronDown className={cn("h-3 w-3 text-slate-400 transition-transform", isModeOpen && "rotate-180")} />
              </button>

              {isModeOpen && (
                <div className="absolute bottom-full left-0 mb-2 z-50 min-w-[180px] overflow-hidden rounded-xl border border-slate-100 bg-white p-1 shadow-xl animate-in fade-in zoom-in-95 slide-in-from-bottom-2">
                  {availableModes.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => {
                        if (m.id === "booking_agent" && !isAuthenticated) {
                          push({
                            type: "warning",
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
                        "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] text-slate-700 hover:bg-slate-50 transition-colors",
                        mode === m.id && "bg-indigo-50 font-medium text-indigo-700"
                      )}
                    >
                      <span className={mode === m.id ? "text-indigo-600" : "text-slate-400"}>
                        {m.icon}
                      </span>
                      {m.name}
                      {mode === m.id && <CheckCircle2 className="ml-auto h-3.5 w-3.5 text-indigo-600" />}
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
