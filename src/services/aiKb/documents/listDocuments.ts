// src/services/aiKb/documents/listDocuments.ts
import prisma from "@/lib/prisma";

type Scope = "ALL" | "GLOBAL" | "TENANT";
type Active = "ALL" | "ACTIVE" | "INACTIVE";

export async function listDocuments(input: {
  q?: string;
  scope?: Scope;
  active?: Active;
  universityId?: number | null;
  take?: number;
  skip?: number;
}) {
  // ✅ guard กัน prisma client ไม่ตรง/ยังไม่ generate
  const anyPrisma = prisma as any;
  if (!anyPrisma?.aiKbDocument?.count) {
    throw new Error(
      "Prisma client ยังไม่พร้อม: ไม่พบ prisma.aiKbDocument (ลองรัน `npx prisma generate` และ restart server)",
    );
  }

  const q = (input.q || "").trim();
  const scope = (input.scope || "ALL").toUpperCase() as Scope;
  const active = (input.active || "ALL").toUpperCase() as Active;

  const take = Math.min(Math.max(Number(input.take || 20), 1), 100);
  const skip = Math.max(Number(input.skip || 0), 0);

  const where: any = {};

  if (scope === "GLOBAL") where.university_id = null;
  if (scope === "TENANT") where.university_id = { not: null };

  if (active === "ACTIVE") where.ai_kb_document_is_active = true;
  if (active === "INACTIVE") where.ai_kb_document_is_active = false;

  // ⚠️ ตรงนี้ให้รองรับ null (GLOBAL) ด้วย ถ้าตั้งใจ filter แบบนั้น
  if (input.universityId !== undefined) where.university_id = input.universityId;

  if (q) {
    where.OR = [
      { ai_kb_document_key: { contains: q, mode: "insensitive" } },
      { ai_kb_document_title: { contains: q, mode: "insensitive" } },
      { ai_kb_document_category: { contains: q, mode: "insensitive" } },
    ];
  }

  const [total, rows] = await Promise.all([
    prisma.aiKbDocument.count({ where }),
    prisma.aiKbDocument.findMany({
      where,
      orderBy: { ai_kb_document_updated_at: "desc" },
      take,
      skip,
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
    }),
  ]);

  // ✅ map ให้ตรงกับ AiKbDoc ที่ฝั่ง client ใช้
  const docs = rows.map((d) => ({
    id: d.ai_kb_document_id,
    universityId: d.university_id,
    key: d.ai_kb_document_key,
    title: d.ai_kb_document_title,
    category: d.ai_kb_document_category,
    urlHint: d.ai_kb_document_url_hint,
    isActive: d.ai_kb_document_is_active,
    publishedVersionId: d.ai_kb_published_version_id,
    createdAt: d.ai_kb_document_created_at,
    updatedAt: d.ai_kb_document_updated_at,

    // ถ้าเปิด join university:
    // universityCode: d.university?.university_code ?? null,
    // universityName: d.university?.university_name_th ?? null,
  }));

  return { total, take, skip, docs };
}
