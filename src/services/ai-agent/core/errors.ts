// src/services/aiAgent/core/errors.ts

export type AgentErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "LLM_ERROR"
  | "TOOL_ERROR"
  | "INTERNAL";

export class AgentError extends Error {
  code: AgentErrorCode;
  status: number;
  expose: boolean;
  meta?: any;

  constructor(args: {
    code: AgentErrorCode;
    message: string;
    status?: number;
    expose?: boolean;
    meta?: any;
  }) {
    super(args.message);
    this.name = "AgentError";
    this.code = args.code;
    this.status = args.status ?? 400;
    this.expose = args.expose ?? true;
    this.meta = args.meta;
  }
}

/**
 * ทำข้อความ error ให้ user-friendly แบบรวมศูนย์
 * (คุณค่อยเพิ่ม mapping ทีหลังได้)
 */
export function friendlyError(err: any): string {
  const msg =
    typeof err?.message === "string" ? err.message.trim() : "เกิดข้อผิดพลาด";

  // ✅ ยกตัวอย่าง mapping ที่คุณเคยใช้ใน confirm
  if (msg.includes("มีการจองที่ยังไม่เสร็จสิ้นอยู่แล้ว"))
    return "ตอนนี้คุณมีนัดหมายที่กำลังดำเนินการอยู่แล้วครับ ถ้าต้องการเปลี่ยนเวลา ให้ยกเลิกนัดเดิมก่อน 🙂";

  if (msg.includes("ช่วงเวลานี้เต็มแล้ว"))
    return "ช่วงเวลานี้เต็มแล้วครับ ลองเลือกช่วงเวลาอื่นได้เลย 🙂";

  if (msg.includes("ไม่พบช่วงเวลานี้ในระบบ"))
    return "ไม่พบช่วงเวลานี้ในระบบครับ ลองเลือกใหม่อีกครั้ง 🙂";

  if (msg.includes("ไม่พบนัดหมายที่กำลังดำเนินการอยู่"))
    return "ตอนนี้ยังไม่มีนัดหมายที่กำลังดำเนินการให้ยกเลิกครับ 🙂";

  return msg || "เกิดข้อผิดพลาด";
}
