// src/services/aiKb/documents/getDocument.ts
import prisma from "@/lib/prisma";

export async function getDocument(docId: number) {
  const document = await prisma.aiKbDocument.findUnique({
    where: { ai_kb_document_id: docId },
    select: {
      ai_kb_document_id: true,
      university_id: true,
      ai_kb_document_key: true,
      ai_kb_document_title: true,
      ai_kb_document_category: true,
      ai_kb_document_url_hint: true,
      ai_kb_document_is_active: true,
      ai_kb_published_version_id: true,
      ai_kb_document_created_at: true,
      ai_kb_document_updated_at: true,
    },
  });

  if (!document) return null;

  const versions = await prisma.aiKbDocumentVersion.findMany({
    where: { ai_kb_document_id: docId },
    orderBy: [{ ai_kb_version_no: "desc" }],
    select: {
      ai_kb_document_version_id: true,
      ai_kb_document_id: true,
      ai_kb_version_no: true,
      ai_kb_content_type: true,
      ai_kb_version_status: true,
      ai_kb_index_status: true,
      ai_kb_index_error: true,
      ai_kb_source_path: true,
      ai_kb_source_md: true,
      ai_kb_source_json: true,
      ai_kb_version_updated_at: true,
      ai_kb_version_created_at: true,
    },
  });

  return { document, versions };
}
