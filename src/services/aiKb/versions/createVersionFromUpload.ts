import prisma from "@/lib/prisma";

export async function createVersionFromUpload(input: {
  docId: number;
  file: File;
  contentType: "MARKDOWN" | "JSON";
}): Promise<
  | { ok: true; version: any }
  | { ok: false; status: 400 | 404 | 409; error: "NOT_FOUND" | "DOC_INACTIVE" | "BAD_FILE" | "CONFLICT" }
> {
  const doc = await prisma.aiKbDocument.findUnique({
    where: { ai_kb_document_id: input.docId },
    select: { ai_kb_document_id: true, ai_kb_document_is_active: true },
  });
  if (!doc) return { ok: false, status: 404, error: "NOT_FOUND" };

  // ถ้านายอยาก “สร้าง draft ได้แม้ inactive” ก็ลบบล็อกนี้ได้
  if (!doc.ai_kb_document_is_active) return { ok: false, status: 409, error: "DOC_INACTIVE" };

  // อ่านไฟล์
  let text = "";
  try {
    text = await input.file.text();
  } catch {
    return { ok: false, status: 400, error: "BAD_FILE" };
  }

  // แปลงเป็น md/json
  const sourceMd = input.contentType === "MARKDOWN" ? text : null;
  let sourceJson: any = null;

  if (input.contentType === "JSON") {
    try {
      sourceJson = JSON.parse(text);
    } catch {
      return { ok: false, status: 400, error: "BAD_FILE" };
    }
  }

  try {
    const created = await prisma.$transaction(async (tx) => {
      const agg = await tx.aiKbDocumentVersion.aggregate({
        where: { ai_kb_document_id: input.docId },
        _max: { ai_kb_version_no: true },
      });
      const nextNo = (agg._max.ai_kb_version_no ?? 0) + 1;

      return tx.aiKbDocumentVersion.create({
        data: {
          ai_kb_document_id: input.docId,
          ai_kb_version_no: nextNo,
          ai_kb_content_type: input.contentType,
          ai_kb_version_status: "DRAFT",
          ai_kb_index_status: "PENDING",
          ai_kb_source_md: sourceMd,
          ai_kb_source_json: sourceJson,
          ai_kb_source_path: input.file.name, // เก็บชื่อไฟล์ไว้ก่อน (optional)
        },
      });
    });

    return { ok: true, version: created };
  } catch (e: any) {
    if (e?.code === "P2002") return { ok: false, status: 409, error: "CONFLICT" };
    throw e;
  }
}
