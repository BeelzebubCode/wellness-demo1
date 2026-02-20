// src/services/aiKb/documents/uploadDocument.ts
import prisma from "@/lib/prisma";
import crypto from "crypto";

export async function uploadDocument(input: {
  universityId: number | null;
  file: File;
}) {
  const key = crypto.randomUUID();
  const title = input.file.name || "Untitled";

  const name = title.toLowerCase();
  const mime = (input.file.type || "").toLowerCase();
  const isJson = name.endsWith(".json") || mime.includes("json");

  const text = await input.file.text();

  let sourceMd: string | null = null;
  let sourceJson: any | null = null;

  if (isJson) {
    try {
      sourceJson = JSON.parse(text);
    } catch {
      throw new Error("JSON parse ไม่ได้");
    }
  } else {
    sourceMd = text;
  }

  const normalizedText = isJson
    ? JSON.stringify(sourceJson).slice(0, 20000)
    : text.slice(0, 20000);

  return prisma.$transaction(async (tx) => {
    const doc = await tx.aiKbDocument.create({
      data: {
        university_id: input.universityId,
        ai_kb_document_key: key,
        ai_kb_document_title: title,
        ai_kb_document_is_active: true,
      },
    });

    const version = await tx.aiKbDocumentVersion.create({
      data: {
        ai_kb_document_id: doc.ai_kb_document_id,
        ai_kb_version_no: 1,
        ai_kb_content_type: isJson ? "JSON" : "MARKDOWN",
        ai_kb_version_status: "DRAFT",
        ai_kb_source_md: sourceMd,
        ai_kb_source_json: sourceJson,
        ai_kb_normalized_text: normalizedText,
        ai_kb_index_status: "PENDING",
      },
    });

    return { doc, version };
  });
}
