import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/auth/jwt";

export async function GET(req: NextRequest) {
  try {
    // 1. Auth Check (Optional but recommended for master data if sensitive, 
    // but typically master data like faculties is public/shared. 
    // We'll restrict to authenticated users at least.)
    const tokenCookie = req.cookies.get("auth_token");
    if (!tokenCookie) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // verify token to get university_id if needed, but for now we list all or filter by query
    const token = await verifyToken(tokenCookie.value);
    if (!token) {
      return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 });
    }

    // If user is Rector/Staff, they might need data specific to their university
    // Fetch universityId from account
    const account = await prisma.account.findUnique({
      where: { account_id: token.accountId },
      select: { account_home_university_id: true }
    });

    const universityId = account?.account_home_university_id;

    if (!universityId) {
      return NextResponse.json({ success: false, error: "University not found for user" }, { status: 404 });
    }

    // 2. Fetch Data in Parallel
    const [faculties, departments, problemCategories] = await Promise.all([
      prisma.faculty.findMany({
        where: { university_id: universityId },
        select: { faculty_id: true, faculty_name_th: true, faculty_name_en: true },
        orderBy: { faculty_name_th: 'asc' }
      }),
      prisma.department.findMany({
        where: { faculty: { university_id: universityId } }, // Departments belonging to faculties of this university
        select: { department_id: true, department_name_th: true, department_name_en: true, faculty_id: true },
        orderBy: { department_name_th: 'asc' }
      }),
      prisma.problemCategory.findMany({
        select: { problem_category_id: true, problem_category_name_th: true, problem_category_name_en: true },
        orderBy: { problem_category_name_th: 'asc' }
      })
    ]);

    // Sort: "OTHER" / "อื่นๆ" always last
    const sortedCategories = problemCategories.sort((a, b) => {
      const aOther = a.problem_category_name_th === "อื่นๆ" ? 1 : 0;
      const bOther = b.problem_category_name_th === "อื่นๆ" ? 1 : 0;
      return aOther - bOther;
    });

    return NextResponse.json({
      success: true,
      data: {
        faculties,
        departments,
        problemCategories: sortedCategories,
      },
    });

  } catch (error) {
    console.error("[FILTER_OPTIONS_ERROR]", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
