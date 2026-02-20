// src/services/aiAgent/help/presenter/messages.ts
import type { ChatMsg } from "../../core/types"; 

export function buildKbSystemMessage(kbText: string): ChatMsg {
  return {
    role: "system",
    content:
      `ข้อมูลอ้างอิงจากเอกสารระบบ (ให้ยึดตามนี้ก่อน)\n` +
      `ถ้าหาไม่เจอให้บอกว่า "ไม่พบในเอกสาร" และแนะนำทางเลือก\n\n` +
      kbText,
  };
}
