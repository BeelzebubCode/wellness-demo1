// src/services/aiKb/documents/toggleActive.ts
import prisma from "@/lib/prisma";

export async function toggleActive(docId: number) {
  const doc = await prisma.aiKbDocument.findUnique({
    where: { ai_kb_document_id: docId },
    select: { ai_kb_document_id: true, ai_kb_document_is_active: true },
  });
  if (!doc) return null;

  return prisma.aiKbDocument.update({
    where: { ai_kb_document_id: docId },
    data: { ai_kb_document_is_active: !doc.ai_kb_document_is_active },
    select: {
      ai_kb_document_id: true,
      university_id: true,
      ai_kb_document_key: true,
      ai_kb_document_title: true,
      ai_kb_document_category: true,
      ai_kb_document_url_hint: true,
      ai_kb_document_is_active: true,
      ai_kb_published_version_id: true,
      ai_kb_document_updated_at: true,
    },
  });
}
