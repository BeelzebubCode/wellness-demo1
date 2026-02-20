// src/services/aiKb/versions/publishVersion.ts
import prisma from "@/lib/prisma";

// --- helpers ---
function stripMarkdown(md: string) {
  return (md ?? "")
    .replace(/```[\s\S]*?```/g, "\n")          // code fences
    .replace(/`([^`]+)`/g, "$1")               // inline code
    .replace(/\[(.*?)\]\((.*?)\)/g, "$1")      // links
    .replace(/[#>*_=-]+/g, " ")                // md tokens
    .replace(/\r/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function jsonToText(obj: unknown) {
  // ทำให้อ่านง่าย + 검색ง่าย: เอาทั้ง key/value ออกมาเป็นบรรทัด
  // (ไม่ต้องสวยมาก แค่อย่าเป็น JSON ยาวติดกัน)
  try {
    if (obj == null) return "";
    if (typeof obj === "string") return obj;
    if (typeof obj !== "object") return String(obj);

    const lines: string[] = [];
    const walk = (v: unknown, path: string[] = []) => {
      if (v == null) return;
      if (Array.isArray(v)) {
        v.forEach((x, i) => walk(x, [...path, String(i)]));
        return;
      }
      if (typeof v === "object") {
        for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
          walk(val, [...path, k]);
        }
        return;
      }
      // primitive
      const p = path.join(".");
      lines.push(`${p}: ${String(v)}`);
    };
    walk(obj);
    return lines.join("\n").trim();
  } catch {
    // fallback
    return JSON.stringify(obj);
  }
}

function chunkText(text: string, maxLen = 800) {
  const t = (text ?? "").trim();
  if (!t) return [];
  const paras = t.split(/\n{2,}/g).map((x) => x.trim()).filter(Boolean);

  const out: string[] = [];
  let buf = "";
  for (const p of paras) {
    const next = (buf ? buf + "\n\n" : "") + p;
    if (next.length > maxLen) {
      if (buf) out.push(buf);
      // ถ้ายังยาว ให้หั่นเพิ่มแบบหยาบ
      if (p.length > maxLen) {
        for (let i = 0; i < p.length; i += maxLen) {
          out.push(p.slice(i, i + maxLen));
        }
        buf = "";
      } else {
        buf = p;
      }
    } else {
      buf = next;
    }
  }
  if (buf) out.push(buf);
  return out;
}

export async function publishVersion(versionId: number): Promise<
  | { ok: true; document: unknown; version: unknown }
  | { ok: false; status: 404 | 409; error: "NOT_FOUND" | "DOC_INACTIVE" }
> {
  // โหลด version + doc ที่จำเป็นสำหรับ chunk
  const v = await prisma.aiKbDocumentVersion.findUnique({
    where: { ai_kb_document_version_id: versionId },
    select: {
      ai_kb_document_version_id: true,
      ai_kb_document_id: true,
      ai_kb_version_status: true,
      ai_kb_content_type: true,
      ai_kb_source_md: true,
      ai_kb_source_json: true,
    },
  });
  if (!v) return { ok: false, status: 404, error: "NOT_FOUND" };

  const doc = await prisma.aiKbDocument.findUnique({
    where: { ai_kb_document_id: v.ai_kb_document_id },
    select: {
      ai_kb_document_id: true,
      university_id: true,
      ai_kb_document_is_active: true,
      ai_kb_published_version_id: true,
    },
  });
  if (!doc) return { ok: false, status: 404, error: "NOT_FOUND" };
  if (!doc.ai_kb_document_is_active) return { ok: false, status: 409, error: "DOC_INACTIVE" };

  // เตรียม normalized text + chunks (นอก transaction ก็ได้ เพื่อความเร็ว)
  let normalized = "";
  if (v.ai_kb_content_type === "MARKDOWN") {
    normalized = stripMarkdown(v.ai_kb_source_md ?? "");
  } else if (v.ai_kb_content_type === "JSON") {
    normalized = jsonToText(v.ai_kb_source_json);
  }
  const chunks = chunkText(normalized, 800);

  const result = await prisma.$transaction(async (tx) => {
    // 1) archive published เดิม (ถ้ามี)
    if (doc.ai_kb_published_version_id) {
      await tx.aiKbDocumentVersion.update({
        where: { ai_kb_document_version_id: doc.ai_kb_published_version_id },
        data: { ai_kb_version_status: "ARCHIVED" },
      });
    }

    // 2) set version เป็น PUBLISHED (+ index ready ถ้ามีข้อความ)
    const published = await tx.aiKbDocumentVersion.update({
      where: { ai_kb_document_version_id: versionId },
      data: {
        ai_kb_version_status: "PUBLISHED",
        ai_kb_index_status: chunks.length ? "READY" : "FAILED",
        ai_kb_index_error: chunks.length ? null : "EMPTY_NORMALIZED_TEXT",
        ai_kb_normalized_text: normalized || null,
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

    // 4) rebuild chunks ของ version นี้
    await tx.aiKbChunk.deleteMany({
      where: { ai_kb_document_version_id: versionId },
    });

    if (chunks.length) {
      await tx.aiKbChunk.createMany({
        data: chunks.map((text, idx) => ({
          ai_kb_document_id: v.ai_kb_document_id,
          ai_kb_document_version_id: versionId,
          ai_kb_chunk_index: idx,
          ai_kb_chunk_content_text: text,
          university_id: updatedDoc.university_id ?? null,
        })),
      });
    }

    return { updatedDoc, published };
  });

  return { ok: true, document: result.updatedDoc, version: result.published };
}
