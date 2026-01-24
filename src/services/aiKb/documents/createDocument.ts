// src/services/aiKb/documents/createDocument.ts
import prisma from "@/lib/prisma";

type ContentType = "MARKDOWN" | "JSON";

export async function createDocument(input: {
  universityId: number | null;
  key: string;
  title: string;
  category: string | null;
  urlHint: string | null;
  contentType: ContentType;
  sourceMd: string | null;
  sourceJson: any | null;
}) {
  const key = input.key.trim();
  const title = input.title.trim();

  // normalize/prepare (optional) สำหรับทำ chunk/index ในอนาคต
  const normalizedText =
    input.contentType === "MARKDOWN"
      ? (input.sourceMd || "").trim()
      : JSON.stringify(input.sourceJson ?? {}).slice(0, 20000);

  return prisma.$transaction(async (tx) => {
    // กัน key ซ้ำใน scope เดียวกัน (ตาม @@unique([university_id, ai_kb_document_key]))
    const dup = await tx.aiKbDocument.findFirst({
      where: {
        university_id: input.universityId,
        ai_kb_document_key: key,
      },
      select: { ai_kb_document_id: true },
    });

    if (dup) {
      return {
        ok: false as const,
        status: 409 as const,
        error: "DUPLICATE_KEY",
      };
    }

    const doc = await tx.aiKbDocument.create({
      data: {
        university_id: input.universityId,
        ai_kb_document_key: key,
        ai_kb_document_title: title,
        ai_kb_document_category: input.category,
        ai_kb_document_url_hint: input.urlHint,
        ai_kb_document_is_active: true,
      },
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

    const versionNo = 1;

    const version = await tx.aiKbDocumentVersion.create({
      data: {
        ai_kb_document_id: doc.ai_kb_document_id,
        ai_kb_version_no: versionNo,
        ai_kb_content_type: input.contentType,
        ai_kb_version_status: "DRAFT",
        ai_kb_source_md: input.contentType === "MARKDOWN" ? input.sourceMd : null,
        ai_kb_source_json: input.contentType === "JSON" ? input.sourceJson : null,
        ai_kb_normalized_text: normalizedText || null,
        ai_kb_index_status: "PENDING",
      },
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

    return { ok: true as const, document: doc, version };
  }).then((r) => {
    if (!r.ok) return r;
    return r;
  });
}
