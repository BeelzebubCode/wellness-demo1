// src/services/aiKb/versions/createVersion.ts
import prisma from "@/lib/prisma";

type ContentType = "MARKDOWN" | "JSON";

export async function createVersion(input: {
  documentId: number;
  contentType: ContentType;
  sourceMd: string | null;
  sourceJson: any | null;
  sourcePath?: string | null;
}): Promise<
  | { ok: true; version: any }
  | { ok: false; status: 404 | 409; error: "NOT_FOUND" | "DOC_INACTIVE" }
> {
  const doc = await prisma.aiKbDocument.findUnique({
    where: { ai_kb_document_id: input.documentId },
    select: {
      ai_kb_document_id: true,
      ai_kb_document_is_active: true,
    },
  });
  if (!doc) return { ok: false, status: 404, error: "NOT_FOUND" };
  if (!doc.ai_kb_document_is_active) return { ok: false, status: 409, error: "DOC_INACTIVE" };

  const normalizedText =
    input.contentType === "MARKDOWN"
      ? (input.sourceMd || "").trim()
      : JSON.stringify(input.sourceJson ?? {}).slice(0, 20000);

  const version = await prisma.$transaction(async (tx) => {
    const last = await tx.aiKbDocumentVersion.findFirst({
      where: { ai_kb_document_id: input.documentId },
      orderBy: { ai_kb_version_no: "desc" },
      select: { ai_kb_version_no: true },
    });

    const nextNo = (last?.ai_kb_version_no ?? 0) + 1;

    return tx.aiKbDocumentVersion.create({
      data: {
        ai_kb_document_id: input.documentId,
        ai_kb_version_no: nextNo,
        ai_kb_content_type: input.contentType,
        ai_kb_version_status: "DRAFT",
        ai_kb_source_path: input.sourcePath ?? null,
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
        ai_kb_source_path: true,
        ai_kb_version_updated_at: true,
      },
    });
  });

  return { ok: true, version };
}
