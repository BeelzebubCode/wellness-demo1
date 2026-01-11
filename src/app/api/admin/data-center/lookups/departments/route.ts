import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const facultyId = searchParams.get("facultyId");

  const where: any = {};
  if (facultyId) where.faculty_id = Number(facultyId);

  const departments = await prisma.department.findMany({
    where,
    orderBy: { department_name_th: "asc" },
    select: {
      department_id: true,
      department_name_th: true,
      faculty_id: true,
    },
  });

  return NextResponse.json(
    departments.map((d) => ({
      label: d.department_name_th,
      value: d.department_id,
      facultyId: d.faculty_id,
    }))
  );
}
