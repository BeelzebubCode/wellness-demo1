import prisma from "@/lib/prisma";

// Helper: Get current Thai academic year date range
// Thai academic year: June 1 → May 31
function getAcademicYearRange(): { start: Date; end: Date; label: string } {
  // Use Thai time for calculation to avoid UTC offset issues
  // UTC+7: Current time in Thailand
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const thaiTime = new Date(utc + (7 * 3600000));

  const year = thaiTime.getFullYear();
  const month = thaiTime.getMonth() + 1; // 1-based

  let startYear: number;
  if (month >= 6) {
    // June onwards → academic year starts this year
    startYear = year;
  } else {
    // Jan-May → academic year started last year
    startYear = year - 1;
  }

  // Define Start: June 1st at 00:00:00 Thai Time
  // In UTC, this is May 31st at 17:00:00 (Start Year)
  const start = new Date(Date.UTC(startYear, 4, 31, 17, 0, 0, 0)); // Month is 0-based: 4=May

  // Define End: May 31st at 23:59:59.999 Thai Time (Next Year)
  // In UTC, this is May 31st at 16:59:59.999 (Start Year + 1)
  const end = new Date(Date.UTC(startYear + 1, 4, 31, 16, 59, 59, 999));

  return {
    start,
    end,
    label: `${startYear + 543}`, // Buddhist Era
  };
}

export const DeanService = {
  /**
   * Get all faculties managed by a dean account
   */
  async getFacultiesByDean(deanAccountId: number) {
    const account = await prisma.account.findUnique({
      where: { account_id: deanAccountId },
      include: {
        facultiesDean: {
          include: {
            university: {
              select: {
                university_id: true,
                university_code: true,
                university_name_th: true,
                university_name_en: true,
              },
            },
            educationFieldGroup: {
              select: {
                field_group_name_th: true,
                field_group_name_en: true,
              },
            },
            _count: {
              select: {
                departments: true,
                studentAcademics: true,
              },
            },
          },
        },
      },
    });

    if (!account || account.account_role !== "DEAN") {
      throw new Error("Account is not a dean or does not exist");
    }

    return account.facultiesDean.map((faculty) => ({
      facultyId: faculty.faculty_id,
      facultyCode: faculty.faculty_code,
      facultyName: faculty.faculty_name_th,
      facultyNameEn: faculty.faculty_name_en,
      universityId: faculty.university_id,
      universityCode: faculty.university.university_code,
      universityName: faculty.university.university_name_th,
      universityNameEn: faculty.university.university_name_en,
      educationFieldGroup: faculty.educationFieldGroup?.field_group_name_en || null,
      educationFieldGroupTH: faculty.educationFieldGroup?.field_group_name_th || null,
      departmentCount: faculty._count.departments,
      studentCount: faculty._count.studentAcademics,
    }));
  },

  /**
   * Get detailed statistics for a specific faculty
   * All booking-related queries are scoped to:
   *   - university_id (มหาวิทยาลัย)
   *   - faculty_id (คณะ) via student_academic JOIN
   *   - academic year time range (ปีการศึกษา)
   */
  async getFacultyStats(facultyId: number, universityId: number, dateRange?: { start: Date; end: Date }) {
    let ayStart: Date, ayEnd: Date, ayLabel: string;

    if (dateRange) {
      ayStart = dateRange.start;
      ayEnd = dateRange.end;
      ayLabel = `${dateRange.start.toLocaleDateString('th-TH')} - ${dateRange.end.toLocaleDateString('th-TH')}`;
    } else {
      const range = getAcademicYearRange();
      ayStart = range.start;
      ayEnd = range.end;
      ayLabel = `ปีการศึกษา ${range.label}`;
    }

    // 1. Get faculty info
    const faculty = await prisma.faculty.findFirst({
      where: {
        faculty_id: facultyId,
        university_id: universityId,
      },
      include: {
        university: {
          select: {
            university_code: true,
            university_name_th: true,
            university_name_en: true,
          },
        },
        educationFieldGroup: {
          select: {
            field_group_name_th: true,
            field_group_name_en: true,
          },
        },
      },
    });

    if (!faculty) {
      throw new Error("Faculty not found");
    }

    // ─── 2. Total Students in Faculty ───
    // Scoped: university_id + faculty_id
    // This is "Population", so it usually ignores time range (unless we want active students only)
    const totalStudentsQuery = await prisma.$queryRaw<{ count: bigint }[]>`
        SELECT COUNT(*)::int as count
        FROM "student_academic"
        WHERE "university_id" = ${universityId}
        AND "faculty_id" = ${facultyId}
    `;
    const totalStudents = Number(totalStudentsQuery[0]?.count || 0);

    // ─── 3. Total Bookings (in selected range) ───
    // Scoped: university_id + faculty_id + time range
    const totalBookingsQuery = await prisma.$queryRaw<{ count: bigint }[]>`
        SELECT COUNT(b.booking_id)::int as count
        FROM "booking" b
        JOIN "student_academic" sa ON b.student_id = sa.student_id AND b.university_id = sa.university_id
        WHERE b.university_id = ${universityId}
        AND sa.faculty_id = ${facultyId}
        AND b.booking_created_at >= ${ayStart}
        AND b.booking_created_at <= ${ayEnd}
    `;
    const totalBookings = Number(totalBookingsQuery[0]?.count || 0);

    // ─── 4. Risk Distribution (in selected range) ───
    // Scoped: university_id + faculty_id + time range
    // Fixed: booking_outcome JOIN includes university_id (composite PK)
    const riskStats = await prisma.$queryRaw<{ risk: number, count: bigint }[]>`
        SELECT 
            bo.booking_outcome_risk_level as risk,
            COUNT(*)::int as count
        FROM "booking" b
        JOIN "booking_outcome" bo ON b.university_id = bo.university_id AND b.booking_id = bo.booking_id
        JOIN "student_academic" sa ON b.student_id = sa.student_id AND b.university_id = sa.university_id
        WHERE b.university_id = ${universityId}
        AND sa.faculty_id = ${facultyId}
        AND b.booking_created_at >= ${ayStart}
        AND b.booking_created_at <= ${ayEnd}
        GROUP BY bo.booking_outcome_risk_level
    `;

    const riskDistribution = { HIGH: 0, MEDIUM: 0, LOW: 0, NORMAL: 0 };
    riskStats.forEach(r => {
      if (r.risk >= 4) riskDistribution.HIGH += Number(r.count);
      else if (r.risk === 3) riskDistribution.MEDIUM += Number(r.count);
      else if (r.risk === 2) riskDistribution.LOW += Number(r.count);
      else riskDistribution.NORMAL += Number(r.count);
    });

    // ─── 4.5. Year Level Distribution (in selected range) ───
    // Calculate current year level based on admit year
    const currentYear = new Date().getFullYear();
    const currentBuddhistYear = currentYear + 543;

    const yearLevelQuery = await prisma.$queryRaw<{ year_level: number, count: bigint }[]>`
        SELECT 
            CASE 
                WHEN sa.student_admit_academic_year IS NULL THEN 0
                WHEN (${currentBuddhistYear} - sa.student_admit_academic_year + 1) > 4 THEN 5
                ELSE (${currentBuddhistYear} - sa.student_admit_academic_year + 1)
            END as year_level,
            COUNT(DISTINCT b.student_id)::int as count
        FROM "booking" b
        JOIN "student_academic" sa ON b.student_id = sa.student_id AND b.university_id = sa.university_id
        WHERE b.university_id = ${universityId}
        AND sa.faculty_id = ${facultyId}
        AND b.booking_created_at >= ${ayStart}
        AND b.booking_created_at <= ${ayEnd}
        GROUP BY year_level
    `;

    const yearLevelDistribution = { YEAR_1: 0, YEAR_2: 0, YEAR_3: 0, YEAR_4: 0, YEAR_5_PLUS: 0, UNKNOWN: 0 };
    yearLevelQuery.forEach(r => {
      const count = Number(r.count);
      if (r.year_level === 1) yearLevelDistribution.YEAR_1 += count;
      else if (r.year_level === 2) yearLevelDistribution.YEAR_2 += count;
      else if (r.year_level === 3) yearLevelDistribution.YEAR_3 += count;
      else if (r.year_level === 4) yearLevelDistribution.YEAR_4 += count;
      else if (r.year_level === 5) yearLevelDistribution.YEAR_5_PLUS += count;
      else yearLevelDistribution.UNKNOWN += count;
    });

    // ─── 5. Problem Stats & Gender (this academic year) ───
    // Scoped: university_id + faculty_id + academic year
    const problemGenderStats = await prisma.$queryRaw<{ name: string, gender: string, count: bigint }[]>`
        SELECT 
            COALESCE(pc.problem_category_name_th, 'อื่นๆ') as name,
            sp.student_gender as gender,
            COUNT(*)::int as count
        FROM "booking" b
        LEFT JOIN "problem_category" pc ON b.problem_category_id = pc.problem_category_id
        JOIN "student_academic" sa ON b.student_id = sa.student_id AND b.university_id = sa.university_id
        LEFT JOIN "student_profile" sp ON b.student_id = sp.student_id AND b.university_id = sp.university_id
        WHERE b.university_id = ${universityId}
        AND sa.faculty_id = ${facultyId}
        AND b.booking_created_at >= ${ayStart}
        AND b.booking_created_at <= ${ayEnd}
        GROUP BY pc.problem_category_name_th, sp.student_gender
    `;

    const problemStats: Record<string, number> = {};
    const genderProblemStats: Record<string, Record<string, number>> = { Male: {}, Female: {}, Other: {} };

    problemGenderStats.forEach(row => {
      const count = Number(row.count);
      problemStats[row.name] = (problemStats[row.name] || 0) + count;
      if (row.gender === 'MALE') {
        genderProblemStats.Male[row.name] = (genderProblemStats.Male[row.name] || 0) + count;
      } else if (row.gender === 'FEMALE') {
        genderProblemStats.Female[row.name] = (genderProblemStats.Female[row.name] || 0) + count;
      } else {
        genderProblemStats.Other[row.name] = (genderProblemStats.Other[row.name] || 0) + count;
      }
    });

    // ─── 6. Visits by Month (this academic year) ───
    // Scoped: university_id + faculty_id + academic year
    const visitsQuery = await prisma.$queryRaw<{ month: string, count: bigint }[]>`
        SELECT 
            TO_CHAR(b.booking_created_at, 'YYYY-MM') as month,
            COUNT(*)::int as count
        FROM "booking" b
        JOIN "student_academic" sa ON b.student_id = sa.student_id AND b.university_id = sa.university_id
        WHERE b.university_id = ${universityId}
        AND sa.faculty_id = ${facultyId}
        AND b.booking_created_at >= ${ayStart}
        AND b.booking_created_at <= ${ayEnd}
        GROUP BY TO_CHAR(b.booking_created_at, 'YYYY-MM')
        ORDER BY month
    `;
    const visitsByMonth: Record<string, number> = {};
    visitsQuery.forEach(v => {
      if (v.month) visitsByMonth[v.month] = Number(v.count);
    });

    // ─── 7. Repeat Visits (this academic year) ───
    // Scoped: university_id + faculty_id + academic year
    const repeatQuery = await prisma.$queryRaw<{ visit_count: number, student_count: bigint }[]>`
        SELECT 
            visit_count,
            COUNT(*)::int as student_count
        FROM (
            SELECT b.student_id, COUNT(*) as visit_count
            FROM "booking" b
            JOIN "student_academic" sa ON b.student_id = sa.student_id AND b.university_id = sa.university_id
            WHERE b.university_id = ${universityId}
            AND sa.faculty_id = ${facultyId}
            AND b.booking_created_at >= ${ayStart}
            AND b.booking_created_at <= ${ayEnd}
            GROUP BY b.student_id
        ) as sub
        GROUP BY visit_count
    `;
    const repeatStats = { single: 0, repeat: 0 };
    repeatQuery.forEach(r => {
      if (r.visit_count === 1) repeatStats.single += Number(r.student_count);
      else repeatStats.repeat += Number(r.student_count);
    });

    // ─── 8. Department Stats (this academic year for bookings) ───
    // Student count: all-time (population), Bookings: this academic year
    // Scoped: university_id + faculty_id via department → faculty
    const deptStatsQuery = await prisma.$queryRaw<{
      department_id: number,
      department_code: string,
      department_name_th: string,
      department_name_en: string,
      student_count: bigint,
      booking_count: bigint
    }[]>`
        SELECT 
            d.department_id,
            d.department_code,
            d.department_name_th,
            d.department_name_en,
            (
                SELECT COUNT(*)::int
                FROM "student_academic" sa
                WHERE sa.department_id = d.department_id 
                AND sa.university_id = ${universityId}
                AND sa.faculty_id = ${facultyId}
            ) as student_count,
            (
                SELECT COUNT(*)::int
                FROM "booking" b
                JOIN "student_academic" sa ON b.student_id = sa.student_id AND b.university_id = sa.university_id
                WHERE sa.department_id = d.department_id 
                AND b.university_id = ${universityId}
                AND sa.faculty_id = ${facultyId}
                AND b.booking_created_at >= ${ayStart}
                AND b.booking_created_at <= ${ayEnd}
            ) as booking_count
        FROM "department" d
        WHERE d.faculty_id = ${facultyId} AND d.university_id = ${universityId}
    `;

    const departmentStats = deptStatsQuery.map(d => ({
      departmentId: d.department_id,
      departmentCode: d.department_code,
      departmentName: d.department_name_th,
      departmentNameEn: d.department_name_en,
      studentCount: Number(d.student_count),
      bookingCount: Number(d.booking_count)
    }));

    // Total Departments
    const totalDepartmentsQuery = await prisma.$queryRaw<{ count: bigint }[]>`
        SELECT COUNT(*)::int as count FROM "department" 
        WHERE "faculty_id" = ${facultyId} AND "university_id" = ${universityId}
    `;
    const totalDepartments = Number(totalDepartmentsQuery[0]?.count || 0);

    // ─── 9. Active Cases (current — no time filter needed, status-based) ───
    // Scoped: university_id + faculty_id
    const activeCasesQuery = await prisma.$queryRaw<{ count: bigint }[]>`
        SELECT COUNT(DISTINCT b.booking_id)::int as count
        FROM "booking" b
        JOIN "student_academic" sa ON b.student_id = sa.student_id AND b.university_id = sa.university_id
        WHERE b.university_id = ${universityId}
        AND sa.faculty_id = ${facultyId}
        AND b.booking_status IN ('PENDING_ASSIGNMENT', 'ASSIGNED', 'IN_PROGRESS')
    `;
    const activeCases = Number(activeCasesQuery[0]?.count || 0);

    // ─── 10. Visit Trends (Current Month vs Previous Month) ───
    const now = new Date();
    const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;

    const currentMonthVisits = visitsByMonth[currentMonthStr] || 0;
    const prevMonthVisits = visitsByMonth[prevMonthStr] || 0;

    let visitTrendValue = 0;
    if (prevMonthVisits > 0) {
      visitTrendValue = ((currentMonthVisits - prevMonthVisits) / prevMonthVisits) * 100;
    } else if (currentMonthVisits > 0) {
      visitTrendValue = 100;
    }

    // ─── 11. Consultant Workload (this academic year) ───
    // Scoped: university_id + faculty_id + academic year
    const consultantStatsQuery = await prisma.$queryRaw<{
      consultant_id: number,
      consultant_first_name: string,
      consultant_last_name: string,
      case_count: bigint
    }[]>`
        SELECT 
            c.consultant_id,
            cp.consultant_first_name,
            cp.consultant_last_name,
            COUNT(b.booking_id)::int as case_count
        FROM "booking" b
        JOIN "consultant" c ON b.consultant_id = c.consultant_id
        JOIN "consultant_profile" cp ON c.consultant_id = cp.consultant_id
        JOIN "student_academic" sa ON b.student_id = sa.student_id AND b.university_id = sa.university_id
        WHERE b.university_id = ${universityId}
        AND sa.faculty_id = ${facultyId}
        AND b.booking_created_at >= ${ayStart}
        AND b.booking_created_at <= ${ayEnd}
        GROUP BY c.consultant_id, cp.consultant_first_name, cp.consultant_last_name
        ORDER BY case_count DESC
        LIMIT 5
    `;

    const consultantStats = consultantStatsQuery.map(c => ({
      id: c.consultant_id,
      name: `${c.consultant_first_name} ${c.consultant_last_name}`,
      count: Number(c.case_count)
    }));

    return {
      facultyId: faculty.faculty_id,
      facultyCode: faculty.faculty_code,
      facultyName: faculty.faculty_name_th,
      facultyNameEn: faculty.faculty_name_en,
      universityCode: faculty.university.university_code,
      universityName: faculty.university.university_name_th,
      educationFieldGroup: faculty.educationFieldGroup?.field_group_name_en || null,
      academicYear: ayLabel,
      totalStudents,
      totalDepartments,
      totalBookings,
      activeCases,
      visitTrend: visitTrendValue.toFixed(1),
      riskDistribution,
      yearLevelDistribution,
      problemStats,
      genderProblemStats,
      visitsByMonth,
      repeatStats,
      departmentStats,
      consultantStats,
    };
  },

  /**
   * Verify if a dean has access to a specific faculty
   */
  async verifyDeanAccess(deanAccountId: number, facultyId: number): Promise<boolean> {
    const faculty = await prisma.faculty.findFirst({
      where: {
        faculty_id: facultyId,
        dean_account_id: deanAccountId,
      },
    });

    return faculty !== null;
  },
};
