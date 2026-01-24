// src/services/aiKb/versions/publishVersion.ts
import prisma from "@/lib/prisma";

export async function publishVersion(versionId: number): Promise<
  | { ok: true; document: any; version: any }
  | { ok: false; status: 404 | 409; error: "NOT_FOUND" | "DOC_INACTIVE" }
> {
  const v = await prisma.aiKbDocumentVersion.findUnique({
    where: { ai_kb_document_version_id: versionId },
    select: {
      ai_kb_document_version_id: true,
      ai_kb_document_id: true,
      ai_kb_version_status: true,
    },
  });
  if (!v) return { ok: false, status: 404, error: "NOT_FOUND" };

  const doc = await prisma.aiKbDocument.findUnique({
    where: { ai_kb_document_id: v.ai_kb_document_id },
    select: {
      ai_kb_document_id: true,
      ai_kb_document_is_active: true,
      ai_kb_published_version_id: true,
    },
  });
  if (!doc) return { ok: false, status: 404, error: "NOT_FOUND" };
  if (!doc.ai_kb_document_is_active) return { ok: false, status: 409, error: "DOC_INACTIVE" };

  const result = await prisma.$transaction(async (tx) => {
    // 1) ถ้ามี published เดิม -> archive มัน (optional แต่แนะนำ)
    if (doc.ai_kb_published_version_id) {
      await tx.aiKbDocumentVersion.update({
        where: { ai_kb_document_version_id: doc.ai_kb_published_version_id },
        data: { ai_kb_version_status: "ARCHIVED" },
      });
    }

    // 2) set version เป็น PUBLISHED
    const published = await tx.aiKbDocumentVersion.update({
      where: { ai_kb_document_version_id: versionId },
      data: { ai_kb_version_status: "PUBLISHED" },
      select: {
        ai_kb_document_version_id: true,
        ai_kb_document_id: true,
        ai_kb_version_no: true,
        ai_kb_content_type: true,
        ai_kb_version_status: true,
        ai_kb_index_status: true,
        ai_kb_version_updated_at: true,
      },
    });

    // 3) update document ชี้ publishedVersion
    const updatedDoc = await tx.aiKbDocument.update({
      where: { ai_kb_document_id: v.ai_kb_document_id },
      data: { ai_kb_published_version_id: versionId },
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

    return { updatedDoc, published };
  });

  return { ok: true, document: result.updatedDoc, version: result.published };
}
