// src/services/aiAgent/booking/cancel/presenter/messages.ts

export function msgNeedReason() {
  return (
    `🧾 **ขอเหตุผลในการยกเลิกนัดหมายสั้น ๆ หน่อยครับ**\n\n` +
    `พิมพ์ได้เลย เช่น:\n` +
    `- ติดธุระด่วน\n` +
    `- ไม่สะดวกในเวลานี้\n` +
    `- อยากเปลี่ยนวัน/เวลา`
  );
}

export function msgConfirmCancel(reason: string) {
  return (
    `⚠️ **คุณต้องการยกเลิกนัดหมายใช่ไหมครับ**\n\n` +
    `✅ เหตุผล: “${reason}”\n\n` +
    `ถ้าถูกต้อง กด **“ยืนยันการยกเลิก”** ได้เลย`
  );
}
