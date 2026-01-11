import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  const faculties = await prisma.faculty.findMany({
    orderBy: { faculty_name_th: "asc" },
    select: {
      faculty_id: true,
      faculty_name_th: true,
    },
  });

  return NextResponse.json(
    faculties.map((f) => ({ label: f.faculty_name_th, value: f.faculty_id }))
  );
}
