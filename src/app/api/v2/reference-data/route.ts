// src/app/api/v2/reference-data/route.ts
// Public GET: return all active reference data for dropdowns/selects
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const ACTIVE_FILTER = { is_active: true };
const SORT_ORDER = { sort_order: "asc" as const };
const STD_SELECT = {
  code: true,
  name_th: true,
  name_en: true,
  sort_order: true,
};

export async function GET(req: NextRequest) {
  try {
    // ดึง ?tables=gender,blood_group หรือไม่ส่ง = ดึงทั้งหมด
    const tablesParam = req.nextUrl.searchParams.get("tables");
    const requested = tablesParam
      ? new Set(tablesParam.split(",").map((t) => t.trim()))
      : null; // null = all

    const want = (key: string) => !requested || requested.has(key);

    const [
      genders,
      bloodGroups,
      incomeBrackets,
      parentalStatuses,
      educationLevels,
      addressTypes,
      nationalityTypes,
      academicPeriodTypes,
      serviceModes,
      universityTypes,
    ] = await Promise.all([
      want("gender")
        ? prisma.genderCategory.findMany({
            where: ACTIVE_FILTER,
            orderBy: SORT_ORDER,
            select: { gender_category_id: true, ...STD_SELECT },
          })
        : [],
      want("blood_group")
        ? prisma.bloodGroupCategory.findMany({
            where: ACTIVE_FILTER,
            orderBy: SORT_ORDER,
            select: { blood_group_id: true, ...STD_SELECT },
          })
        : [],
      want("income_bracket")
        ? prisma.incomeBracketCategory.findMany({
            where: ACTIVE_FILTER,
            orderBy: SORT_ORDER,
            select: { income_bracket_id: true, ...STD_SELECT },
          })
        : [],
      want("parental_status")
        ? prisma.parentalStatusCategory.findMany({
            where: ACTIVE_FILTER,
            orderBy: SORT_ORDER,
            select: { parental_status_id: true, ...STD_SELECT },
          })
        : [],
      want("education_level")
        ? prisma.educationLevelCategory.findMany({
            where: ACTIVE_FILTER,
            orderBy: SORT_ORDER,
            select: { education_level_id: true, ...STD_SELECT },
          })
        : [],
      want("address_type")
        ? prisma.addressTypeCategory.findMany({
            where: ACTIVE_FILTER,
            orderBy: SORT_ORDER,
            select: { address_type_id: true, ...STD_SELECT },
          })
        : [],
      want("nationality_type")
        ? prisma.nationalityTypeCategory.findMany({
            where: ACTIVE_FILTER,
            orderBy: SORT_ORDER,
            select: { nationality_type_id: true, ...STD_SELECT },
          })
        : [],
      want("academic_period_type")
        ? prisma.academicPeriodTypeCategory.findMany({
            where: ACTIVE_FILTER,
            orderBy: SORT_ORDER,
            select: { academic_period_type_id: true, ...STD_SELECT },
          })
        : [],
      want("service_mode")
        ? prisma.serviceModeCategory.findMany({
            where: ACTIVE_FILTER,
            orderBy: SORT_ORDER,
            select: { service_mode_id: true, ...STD_SELECT },
          })
        : [],
      want("university_type")
        ? prisma.universityTypeCategory.findMany({
            where: ACTIVE_FILTER,
            orderBy: SORT_ORDER,
            select: { university_type_id: true, ...STD_SELECT },
          })
        : [],
    ]);

    return NextResponse.json({
      success: true,
      data: {
        genders,
        bloodGroups,
        incomeBrackets,
        parentalStatuses,
        educationLevels,
        addressTypes,
        nationalityTypes,
        academicPeriodTypes,
        serviceModes,
        universityTypes,
      },
    });
  } catch (e: any) {
    console.error("[GET /api/v2/reference-data]", e);
    return NextResponse.json(
      { success: false, error: e.message },
      { status: 500 }
    );
  }
}
