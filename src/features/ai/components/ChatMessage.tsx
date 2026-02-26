// src/features/ai/components/ChatMessage.tsx
"use client";

import React, { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Bot, User, Flag, Check, X, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/cn";
import styles from "./aiChatTheme.module.css";

type ReportState = "idle" | "confirming" | "loading" | "done";

const REPORT_REASONS = [
  { id: "wrong_answer", label: "คำตอบไม่ถูกต้อง / ไม่ตรงประเด็น" },
  { id: "outdated", label: "ข้อมูลล้าสมัยหรือไม่เป็นปัจจุบัน" },
  { id: "harmful", label: "เนื้อหาไม่เหมาะสมหรืออาจก่อให้เกิดอันตราย" },
  { id: "other", label: "อื่นๆ" },
];

export default function ChatMessage({
  role,
  content,
  userQuestion,
}: {
  role: "user" | "assistant";
  content: string;
  /** The user question that prompted this AI answer — needed for reporting */
  userQuestion?: string;
}) {
  const isUser = role === "user";
  const [reportState, setReportState] = useState<ReportState>("idle");
  const [selectedReason, setSelectedReason] = useState<string>("wrong_answer");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Hide the technical fast-track approval query from the user visually
  if (isUser && content.includes("[APPROVED_SQL]")) {
    return null;
  }

  const mdComponents = useMemo(
    () => ({
      p: ({ children }: any) => <p>{children}</p>,
      ul: ({ children }: any) => <ul>{children}</ul>,
      ol: ({ children }: any) => <ol>{children}</ol>,
      li: ({ children }: any) => <li>{children}</li>,
      strong: ({ children }: any) => <strong>{children}</strong>,
      code: ({ children }: any) => <code>{children}</code>,
      pre: ({ children }: any) => <pre>{children}</pre>,
      a: ({ children, ...props }: any) => (
        <a {...props} target="_blank" rel="noreferrer">
          {children}
        </a>
      ),
      // Table renderers for beautiful Thai-friendly tables
      table: ({ children }: any) => (
        <div className={styles.tableWrap}>
          <table className={styles.table}>{children}</table>
        </div>
      ),
      thead: ({ children }: any) => <thead className={styles.thead}>{children}</thead>,
      tbody: ({ children }: any) => <tbody>{children}</tbody>,
      tr: ({ children }: any) => <tr className={styles.tr}>{children}</tr>,
      th: ({ children }: any) => <th className={styles.th}>{children}</th>,
      td: ({ children }: any) => <td className={styles.td}>{children}</td>,
    }),
    [],
  );

  const submitReport = async () => {
    setIsSubmitting(true);
    try {
      await fetch("/api/v2/agent/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: userQuestion || "(ไม่ทราบคำถาม)",
          answer: content.slice(0, 500),
          reason: selectedReason,
        }),
      });
      setReportState("done");
    } catch {
      setReportState("confirming");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={cn(
        styles.slideIn,
        styles.msgContainer,
        isUser ? styles.userContainer : styles.aiContainer
      )}
    >
      {/* AI Avatar (Left) */}
      {!isUser && (
        <div className={cn(styles.avatar, styles.aiAvatar)}>
          <Bot size={24} />
        </div>
      )}

      {/* Message Bubble + report button */}
      <div className="flex flex-col gap-1 max-w-full">
        <div
          className={cn(
            styles.msg,
            isUser ? styles.userMsg : styles.aiMsg
          )}
        >
          {isUser ? (
            <span className="block whitespace-pre-wrap">{content}</span>
          ) : (
            <div className={styles.md}>
              {content.includes("[SQL_APPROVAL_REQUEST]") ? (
                <>
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
                    {String(
                      content
                        .replace("[SQL_APPROVAL_REQUEST]", "")
                        .replace(/\`\`\`(?:sql)?\s*([\s\S]*?)\`\`\`/i, "⚠️ **ต้องการเข้าถึงฐานข้อมูลระดับลึก (Database SQL)**\n\nAI จำเป็นต้องดึงข้อมูลเชิงลึกเพิ่มเติมจากระบบเพื่อตอบคำถามนี้ให้แม่นยำที่สุด")
                        .trim() || ""
                    )}
                  </ReactMarkdown>
                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={() => {
                        const sqlMatch = content.match(/\`\`\`(?:sql)?\s*([\s\S]*?)\`\`\`/i);
                        if (sqlMatch && sqlMatch[1]) {
                          const query = typeof window !== "undefined" ? sqlMatch[1].trim() : "";
                          window.dispatchEvent(new CustomEvent("ai:approve_sql", { detail: { query } }));
                        }
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-600 transition-colors"
                    >
                      <Check size={14} /> อนุญาตให้ดึงข้อมูล (Approve)
                    </button>
                  </div>
                </>
              ) : (
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
                  {String(content || "")}
                </ReactMarkdown>
              )}
            </div>
          )}
        </div>

        {/* Report button — only for AI messages */}
        {!isUser && (
          <div className="flex justify-start pl-1">
            {reportState === "done" ? (
              <span className="flex items-center gap-1 text-[11px] text-emerald-600">
                <Check size={11} />
                รายงานแล้ว ขอบคุณ
              </span>
            ) : (
              <button
                onClick={() => setReportState("confirming")}
                disabled={reportState === "loading" || reportState === "confirming"}
                title="รายงานว่า AI ตอบไม่ดี"
                className="flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40"
              >
                <Flag size={11} />
                รายงาน
              </button>
            )}
          </div>
        )}

        {/* ── Confirmation Modal (inline below the message) ── */}
        {reportState === "confirming" && (
          <div className="mt-1 animate-in fade-in slide-in-from-top-2 duration-200 rounded-xl border border-orange-200 bg-orange-50 p-3 shadow-sm max-w-sm">
            {/* Header */}
            <div className="flex items-start gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-orange-800">รายงานคำตอบนี้</p>
                <p className="text-[11px] text-orange-600 mt-0.5 leading-relaxed">
                  ช่วยเราปรับปรุง AI ให้ดีขึ้น — โปรดระบุเหตุผลที่รายงาน
                </p>
              </div>
              <button
                onClick={() => setReportState("idle")}
                className="shrink-0 text-orange-400 hover:text-orange-600 transition-colors"
              >
                <X size={14} />
              </button>
            </div>

            {/* Reason selector */}
            <div className="flex flex-col gap-1.5 mb-3">
              {REPORT_REASONS.map((r) => (
                <label
                  key={r.id}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-2.5 py-1.5 cursor-pointer text-[12px] transition-colors",
                    selectedReason === r.id
                      ? "bg-orange-200/70 text-orange-900 font-medium"
                      : "text-orange-700 hover:bg-orange-100"
                  )}
                >
                  <input
                    type="radio"
                    name="report-reason"
                    value={r.id}
                    checked={selectedReason === r.id}
                    onChange={() => setSelectedReason(r.id)}
                    className="accent-orange-500"
                  />
                  {r.label}
                </label>
              ))}
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={submitReport}
                disabled={isSubmitting}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 px-3 py-1.5 text-[12px] font-semibold text-white transition-colors disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <span className="h-3 w-3 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                    กำลังส่ง...
                  </>
                ) : (
                  <>
                    <Flag size={11} />
                    ยืนยันรายงาน
                  </>
                )}
              </button>
              <button
                onClick={() => setReportState("idle")}
                disabled={isSubmitting}
                className="px-3 py-1.5 rounded-lg border border-orange-200 text-[12px] text-orange-600 hover:bg-orange-100 transition-colors disabled:opacity-50"
              >
                ยกเลิก
              </button>
            </div>
          </div>
        )}
      </div>

      {/* User Avatar (Right) */}
      {isUser && (
        <div className={cn(styles.avatar, styles.userAvatar)}>
          <User size={24} />
        </div>
      )}
    </div>
  );
}
