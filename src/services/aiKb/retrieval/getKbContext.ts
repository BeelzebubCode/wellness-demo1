// src/services/aiKb/retrieval/getKbContext.ts
import prisma from "@/lib/prisma";

function extractKeywords(q: string) {
  const cleaned = (q ?? "").toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ");
  const words = cleaned
    .split(/\s+/)
    .map((x) => x.trim())
    .filter((x) => x.length >= 2); // ไทยสั้นๆก็สำคัญ เช่น "จอง", "คิว"
  return Array.from(new Set(words)).slice(0, 8);
}

function jsonToText(v: any) {
  try {
    return JSON.stringify(v, null, 2);
  } catch {
    return String(v ?? "");
  }
}

export type KbHit = {
  documentId: number;
  key: string;
  title: string;
  publishedVersionId: number | null;

  // อันนี้ช่วย debug ว่าดึงจากไหน
  source: "chunk" | "version_fallback";
  chunkId?: number;
  versionId?: number;

  text: string;
};

export async function getKbContext(params: {
  q: string;
  universityId?: number | null; // undefined = ไม่กรอง, null=global, number=tenant
  role?: string | null;
  take?: number;
}): Promise<KbHit[]> {
  const { q, universityId, role, take = 6 } = params;
  const kw = q.trim();
  if (!kw) return [];

  const keywords = extractKeywords(kw);
  if (keywords.length === 0) return [];

  // 1) ค้นจาก CHUNK ก่อน
  const rawChunks = await prisma.aiKbChunk.findMany({
    where: {
      OR: keywords.map((k) => ({
        ai_kb_chunk_content_text: { contains: k, mode: "insensitive" },
      })),
      document: {
        ai_kb_document_is_active: true,
        ai_kb_published_version_id: { not: null },
        ...(universityId === undefined
          ? {}
          : { OR: [{ university_id: null }, { university_id: universityId }] }),
        ...(role ? { roles: { some: { ai_actor_role: role } } } : {}),
      },
      // ✅ ให้ชัวร์ว่าเป็นเวอร์ชันที่ publish
      version: { ai_kb_version_status: "PUBLISHED" },
    },
    take: Math.min(take * 5, 60),
    orderBy: { ai_kb_chunk_created_at: "desc" },
    select: {
      ai_kb_chunk_id: true,
      ai_kb_document_version_id: true,
      ai_kb_chunk_content_text: true,
      document: {
        select: {
          ai_kb_document_id: true,
          ai_kb_document_key: true,
          ai_kb_document_title: true,
          ai_kb_published_version_id: true,
        },
      },
    },
  });

  // score แบบง่าย: นับ keyword ที่ match เพื่อจัดอันดับดีขึ้น
  const scored = rawChunks
    .map((c) => {
      const t = (c.ai_kb_chunk_content_text ?? "").toLowerCase();
      const score = keywords.reduce((acc, k) => (t.includes(k) ? acc + 1 : acc), 0);
      return { c, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, take);

  if (scored.length > 0) {
    return scored.map(({ c }) => ({
      source: "chunk",
      chunkId: c.ai_kb_chunk_id,
      versionId: c.ai_kb_document_version_id,
      documentId: c.document.ai_kb_document_id,
      key: c.document.ai_kb_document_key,
      title: c.document.ai_kb_document_title,
      publishedVersionId: c.document.ai_kb_published_version_id,
      text: c.ai_kb_chunk_content_text,
    }));
  }

  // 2) FALLBACK: ถ้า chunk ยังไม่มี → ดึงจาก PUBLISHED VERSION ตรง ๆ
  const versions = await prisma.aiKbDocumentVersion.findMany({
    where: {
      ai_kb_version_status: "PUBLISHED",
      document: {
        ai_kb_document_is_active: true,
        ...(universityId === undefined
          ? {}
          : { OR: [{ university_id: null }, { university_id: universityId }] }),
        ...(role ? { roles: { some: { ai_actor_role: role } } } : {}),
      },
    },
    take: 10,
    orderBy: { ai_kb_version_updated_at: "desc" },
    select: {
      ai_kb_document_version_id: true,
      ai_kb_content_type: true,
      ai_kb_source_md: true,
      ai_kb_source_json: true,
      document: {
        select: {
          ai_kb_document_id: true,
          ai_kb_document_key: true,
          ai_kb_document_title: true,
          ai_kb_published_version_id: true,
        },
      },
    },
  });

  const hits: KbHit[] = [];
  for (const v of versions) {
    const text =
      v.ai_kb_content_type === "MARKDOWN"
        ? (v.ai_kb_source_md ?? "")
        : jsonToText(v.ai_kb_source_json);

    const low = text.toLowerCase();
    const ok = keywords.some((k) => low.includes(k));
    if (!ok) continue;

    hits.push({
      source: "version_fallback",
      versionId: v.ai_kb_document_version_id,
      documentId: v.document.ai_kb_document_id,
      key: v.document.ai_kb_document_key,
      title: v.document.ai_kb_document_title,
      publishedVersionId: v.document.ai_kb_published_version_id,
      text,
    });

    if (hits.length >= take) break;
  }

  return hits;
}
