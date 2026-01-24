// src/services/aiKb/documents/deleteDocument.ts
import prisma from "@/lib/prisma";

export async function deleteDocument(docId: number): Promise<
  | { ok: true }
  | { ok: false; status: 404 | 409; error: "NOT_FOUND" | "HAS_RESOLVED_FEEDBACK" }
> {
  const found = await prisma.aiKbDocument.findUnique({
    where: { ai_kb_document_id: docId },
    select: { ai_kb_document_id: true },
  });
  if (!found) return { ok: false, status: 404, error: "NOT_FOUND" };

  // ป้องกันเคสมี feedback resolve ชี้อยู่ (ถ้านายอยาก allow ก็ลบ/ตั้ง null ก่อน)
  const feedbackCount = await prisma.aiFeedbackEvent.count({
    where: { ai_resolved_document_id: docId },
  });
  if (feedbackCount > 0) {
    return { ok: false, status: 409, error: "HAS_RESOLVED_FEEDBACK" };
  }

  await prisma.$transaction(async (tx) => {
    // ต้อง set published_version_id เป็น null ก่อน เพราะ relation PublishedVersion ตั้ง NoAction
    await tx.aiKbDocument.update({
      where: { ai_kb_document_id: docId },
      data: { ai_kb_published_version_id: null },
    });

    // ลบ document -> versions/chunks/roles จะ cascade ตาม schema
    await tx.aiKbDocument.delete({
      where: { ai_kb_document_id: docId },
    });
  });

  return { ok: true };
}
