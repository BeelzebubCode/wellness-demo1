import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth/platformGuard";

export async function GET(req: NextRequest) {
  const g = await requireSuperAdmin(req);
  if (!g.ok) {
    return NextResponse.json({ success: false, error: g.error }, { status: g.status });
  }

  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";

  const items = await prisma.university.findMany({
    where: q
      ? {
          OR: [
            { university_code: { contains: q, mode: "insensitive" } },
            { university_name_th: { contains: q, mode: "insensitive" } },
            { university_name_en: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: [{ university_name_th: "asc" }],
    select: {
      university_id: true,
      university_code: true,
      university_name_th: true,
      university_name_en: true,
      university_is_active: true,
    },
    take: 200,
  });

  const universities = items.map((u) => ({
    id: u.university_id,
    code: u.university_code,
    nameTh: u.university_name_th,
    nameEn: u.university_name_en,
    isActive: u.university_is_active,
  }));

  return NextResponse.json({ success: true, data: { universities } });
}
