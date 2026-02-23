import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

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

export interface FacultyFilters {
  department?: string;
  yearLevel?: string;
  riskLevel?: string;
  problemCategory?: string;
  gender?: string;
  search?: string;
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
            subjectGroupCategory: {
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
      subjectGroupCategory: faculty.subjectGroupCategory?.field_group_name_en || null,
      subjectGroupCategoryTH: faculty.subjectGroupCategory?.field_group_name_th || null,
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
  async getFacultyStats(facultyId: number, universityId: number, dateRange?: { start?: Date; end?: Date }, filters?: FacultyFilters) {
    let ayStart: Date, ayEnd: Date, ayLabel: string;
    const defaultRange = getAcademicYearRange();

    if (dateRange && (dateRange.start || dateRange.end)) {
      ayStart = dateRange.start || defaultRange.start;
      ayEnd = dateRange.end || defaultRange.end;
      
      const startStr = ayStart.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
      const endStr = ayEnd.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
      ayLabel = `${startStr} - ${endStr}`;
    } else {
      ayStart = defaultRange.start;
      ayEnd = defaultRange.end;
      ayLabel = `ปีการศึกษา ${defaultRange.label}`;
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
        subjectGroupCategory: {
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

    // FILTER LOGIC
    const currentYear = new Date().getFullYear();
    const currentBuddhistYear = currentYear + 543;

    // Filters Construction
    const whereDept = filters?.department && filters.department !== 'ALL' 
      ? Prisma.sql`AND d.department_code = ${filters.department}` 
      : Prisma.empty;

    const whereYear = filters?.yearLevel && filters.yearLevel !== 'ALL'
      ? (filters.yearLevel === 'YEAR_5_PLUS' 
          ? Prisma.sql`AND (${currentBuddhistYear} - sa.student_admit_academic_year + 1) > 4` 
          : Prisma.sql`AND (${currentBuddhistYear} - sa.student_admit_academic_year + 1) = ${Number(filters.yearLevel.replace('YEAR_', ''))}`)
      : Prisma.empty;

    const whereRisk = filters?.riskLevel && filters.riskLevel !== 'ALL'
      ? (filters.riskLevel === 'CRITICAL' ? Prisma.sql`AND bo.booking_outcome_risk_level >= 4`
        : (filters.riskLevel === 'HIGH' ? Prisma.sql`AND bo.booking_outcome_risk_level = 3`
        : (filters.riskLevel === 'MODERATE' ? Prisma.sql`AND bo.booking_outcome_risk_level = 2`
        : (filters.riskLevel === 'NORMAL' ? Prisma.sql`AND bo.booking_outcome_risk_level = 1`
        : Prisma.empty))))
      : Prisma.empty;

    const whereProblem = filters?.problemCategory && filters.problemCategory !== 'ALL'
      // Note: Problem Category filtering logic needs careful mapping. 
      // Assuming 'MENTAL' -> 'ด้านสุขภาพจิตและจิตเวช', etc.
      // Or if frontend passes EXACT Thai name, use that.
      // Here assuming partial match or exact if provided.
      ? Prisma.sql`AND pc.problem_category_name_th LIKE ${'%' + filters.problemCategory + '%'}`
      : Prisma.empty;

    const whereGender = filters?.gender && filters.gender !== 'ALL'
      ? Prisma.sql`AND sp.student_gender::text = ${filters.gender}`
      : Prisma.empty;

    const whereSearch = filters?.search
      ? Prisma.sql`AND (
          sp.first_name LIKE ${'%' + filters.search + '%'} OR 
          sp.last_name LIKE ${'%' + filters.search + '%'} OR 
          sa.student_id LIKE ${'%' + filters.search + '%'} OR
          CAST(b.booking_id AS TEXT) LIKE ${'%' + filters.search + '%'}
        )`
      : Prisma.empty;

    // Common WHERE for bookings
    const commonConditions = Prisma.sql`
      b.university_id = ${universityId}
      AND sa.faculty_id = ${facultyId}
      AND b.booking_created_at >= ${ayStart}
      AND b.booking_created_at <= ${ayEnd}
      ${whereDept}
      ${whereYear}
      ${whereRisk}
      ${whereProblem}
      ${whereGender}
      ${whereSearch}
    `;

    const commonWhereBooking = Prisma.sql`WHERE ${commonConditions}`;

    // ─── 2. Total Students (Filtered Population) ───
    // If filters rely on booking (risk, problem, search booking ID), we must join booking.
    // If only student filters (dept, year, gender, name), we don't strictly need booking, but for consistency "Filtered Dashboard" implies
    // showing students related to the context. 
    // Usually "Total Students" means "Total Students in Faculty". 
    // But if I filter "High Risk", I expect "Total High Risk Students".
    // So distinct students FROM booking + student_academic is safest for booking-related filters.
    // However, if NO booking filters are applied (only Dept/Year/Gender), we want ALL students in that Dept/Year/Gender, even if no booking?
    // User requirement: "Filter Dashboard". Usually means filter the *Dataset* being visualized.
    // If "High Risk" is selected, "Total Students" = Students with High Risk.
    
    // Logic: 
    // If booking-specific filters (Risk, Problem, Search Booking ID) are active, or Date Range is active -> Count Distinct Students from Bookings.
    // If only static filters (Dept, Year, Gender) active -> Count from Student Academic?
    // Actually, consistency is key. Currently dashboard shows "Total Students" = 4030 (Population).
    // "Total Bookings" = 0.
    // If I filter "High Risk", Bookings -> 0, Students -> ?
    // If I filter "High Risk", I expect to see stats for High Risk cases.
    // So "Total Students" should be "Students with High Risk".
    // AND "Total Bookings" should be "High Risk Bookings".
    
    // Thus, I will use Query based on BookingContext for everything IF any booking-related filter is present.
    // BUT what if simply filtering by "Department"? Use Population of Department?
    // Yes.
    // So, two strategies:
    // A) Always filter based on Student Population (Dept, Year, Gender) -> Base Population.
    //    AND Apply Booking filters (Risk, Problem, Date) to the specific charts.
    // B) Apply ALL filters to EVERYTHING.
    //    Strategy B is what "Advanced Multi-dimensional Data Filtering" usually implies.
    //    If I toggle "High Risk", I want to see "99 Students, 100 Bookings".
    
    // So I will use the `commonWhereBooking` for everything that counts booking-related entities.
    
    // For "Total Students" specifically:
    // If Risk/Problem/Date/Search is used -> Count DISTINCT students from Booking query.
    // If ONLY Dept/Year/Gender used (and no date range?), we might want total population.
    // BUT dashboard ALWAYS has a Date Range (Academic Year).
    // So we are ALWAYS looking at "Activity in this period".
    // Wait, the original `totalStudentsQuery` was:
    // SELECT COUNT(*) FROM student_academic WHERE faculty_id = ... (No date range).
    // It showed "Total Students in Faculty" (Population).
    // If I select "Year 1", I want "Total Year 1 Students".
    // If I select "High Risk", I want "Total High Risk Students" (who had high risk booking in this period).
    
    // So:
    // 1. Base Student Filter (Dept, Year, Gender, Name Search)
    const baseStudentFilter = Prisma.sql`
        AND sa.faculty_id = ${facultyId}
        AND sa.university_id = ${universityId}
        ${whereDept}
        ${whereYear}
        ${whereGender}
        ${filters?.search ? Prisma.sql`AND (sp.first_name LIKE ${'%' + filters.search + '%'} OR sp.last_name LIKE ${'%' + filters.search + '%'} OR sa.student_id LIKE ${'%' + filters.search + '%'})` : Prisma.empty}
    `;

    // 2. Booking Filter (Risk, Problem, Date, BookingID Search)
    const hasBookingFilters = (filters?.riskLevel && filters.riskLevel !== 'ALL') || 
                              (filters?.problemCategory && filters.problemCategory !== 'ALL') ||
                              (filters?.search && !isNaN(Number(filters.search))) || // heuristic
                              true; // Actually we always have Date Range.
    
    // Let's stick to: "Total Students" = Population matching Dept/Year/Gender.
    // "Active Students" / "Risk Students" = Subsets.
    // BUT if "High Risk" is selected, the "Total Students" text probably explicitly means "Students matching filter".
    
    // To simplify: I will apply `commonWhereBooking` to `totalStudentsQuery` as well?
    // If I do, then "Total Students" becomes "Active Students in Period" (since it requires a booking).
    // That might be confusing if usually it shows 4000, and suddenly shows 50 (active).
    
    // Compromise: 
    // If Risk/Problem filters are active -> Use Booking-based count.
    // If only Dept/Year/Gender active -> Use Population-based count.
    
    const useBookingContext = (filters?.riskLevel && filters.riskLevel !== 'ALL') || 
                              (filters?.problemCategory && filters.problemCategory !== 'ALL');

    let totalStudents = 0;
    if (useBookingContext) {
         const q = await prisma.$queryRaw<{ count: bigint }[]>`
            SELECT COUNT(DISTINCT sa.student_id)::int as count
            FROM "booking" b
            JOIN "student_academic" sa ON b.student_id = sa.student_id AND b.university_id = sa.university_id
            JOIN "student_profile" sp ON b.student_id = sp.student_id AND b.university_id = sp.university_id
            LEFT JOIN "department" d ON sa.department_id = d.department_id AND sa.university_id = d.university_id
            LEFT JOIN "booking_outcome" bo ON b.university_id = bo.university_id AND b.booking_id = bo.booking_id
            LEFT JOIN "problem_category" pc ON b.problem_category_id = pc.problem_category_id
            ${commonWhereBooking}
         `;
         totalStudents = Number(q[0]?.count || 0);
    } else {
         const q = await prisma.$queryRaw<{ count: bigint }[]>`
            SELECT COUNT(DISTINCT sa.student_id)::int as count
            FROM "student_academic" sa
            JOIN "student_profile" sp ON sa.student_id = sp.student_id AND sa.university_id = sp.university_id
            LEFT JOIN "department" d ON sa.department_id = d.department_id AND sa.university_id = d.university_id
            WHERE sa.university_id = ${universityId}
            ${baseStudentFilter}
         `;
         totalStudents = Number(q[0]?.count || 0);
    }

    // ─── 3. Total Bookings ───
    const totalBookingsQuery = await prisma.$queryRaw<{ count: bigint }[]>`
        SELECT COUNT(b.booking_id)::int as count
        FROM "booking" b
        JOIN "student_academic" sa ON b.student_id = sa.student_id AND b.university_id = sa.university_id
        JOIN "student_profile" sp ON b.student_id = sp.student_id AND b.university_id = sp.university_id
        LEFT JOIN "department" d ON sa.department_id = d.department_id AND sa.university_id = d.university_id
        LEFT JOIN "booking_outcome" bo ON b.university_id = bo.university_id AND b.booking_id = bo.booking_id
        LEFT JOIN "problem_category" pc ON b.problem_category_id = pc.problem_category_id
        ${commonWhereBooking}
    `;
    const totalBookings = Number(totalBookingsQuery[0]?.count || 0);

    // ─── 4. Risk Distribution (in selected range) ───
    const riskStats = await prisma.$queryRaw<{ risk: number, count: bigint }[]>`
        SELECT 
            bo.booking_outcome_risk_level as risk,
            COUNT(*)::int as count
        FROM "booking" b
        JOIN "booking_outcome" bo ON b.university_id = bo.university_id AND b.booking_id = bo.booking_id
        JOIN "student_academic" sa ON b.student_id = sa.student_id AND b.university_id = sa.university_id
        JOIN "student_profile" sp ON b.student_id = sp.student_id AND b.university_id = sp.university_id
        LEFT JOIN "department" d ON sa.department_id = d.department_id AND sa.university_id = d.university_id
        LEFT JOIN "problem_category" pc ON b.problem_category_id = pc.problem_category_id
        ${commonWhereBooking}
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
        JOIN "student_profile" sp ON b.student_id = sp.student_id AND b.university_id = sp.university_id
        LEFT JOIN "department" d ON sa.department_id = d.department_id AND sa.university_id = d.university_id
        LEFT JOIN "booking_outcome" bo ON b.university_id = bo.university_id AND b.booking_id = bo.booking_id
        LEFT JOIN "problem_category" pc ON b.problem_category_id = pc.problem_category_id
        ${commonWhereBooking}
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
    const problemGenderStats = await prisma.$queryRaw<{ name: string, gender: string, count: bigint }[]>`
        SELECT 
            COALESCE(pc.problem_category_name_th, 'อื่นๆ') as name,
            sp.student_gender as gender,
            COUNT(*)::int as count
        FROM "booking" b
        LEFT JOIN "problem_category" pc ON b.problem_category_id = pc.problem_category_id
        JOIN "student_academic" sa ON b.student_id = sa.student_id AND b.university_id = sa.university_id
        JOIN "student_profile" sp ON b.student_id = sp.student_id AND b.university_id = sp.university_id
        LEFT JOIN "department" d ON sa.department_id = d.department_id AND sa.university_id = d.university_id
        LEFT JOIN "booking_outcome" bo ON b.university_id = bo.university_id AND b.booking_id = bo.booking_id
        ${commonWhereBooking}
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

    // ─── 6. Visits by Data Point (Daily or Monthly) ───
    // If range <= 62 days, show daily. Else show monthly.
    const diffDays = Math.ceil((ayEnd.getTime() - ayStart.getTime()) / (1000 * 60 * 60 * 24));
    const isDaily = diffDays <= 62;
    const format = isDaily ? 'YYYY-MM-DD' : 'YYYY-MM';

    const visitsQuery = await prisma.$queryRaw<{ point: string, count: bigint }[]>`
        SELECT 
            TO_CHAR(b.booking_created_at, ${format}) as point,
            COUNT(*)::int as count
        FROM "booking" b
        JOIN "student_academic" sa ON b.student_id = sa.student_id AND b.university_id = sa.university_id
        JOIN "student_profile" sp ON b.student_id = sp.student_id AND b.university_id = sp.university_id
        LEFT JOIN "department" d ON sa.department_id = d.department_id AND sa.university_id = d.university_id
        LEFT JOIN "booking_outcome" bo ON b.university_id = bo.university_id AND b.booking_id = bo.booking_id
        LEFT JOIN "problem_category" pc ON b.problem_category_id = pc.problem_category_id
        ${commonWhereBooking}
        GROUP BY point
        ORDER BY point
    `;
    const visitsByMonth: Record<string, number> = {};
    visitsQuery.forEach(v => {
      if (v.point) visitsByMonth[v.point] = Number(v.count);
    });

    // ─── 7. Repeat Visits (this academic year) ───
    const repeatQuery = await prisma.$queryRaw<{ visit_count: number, student_count: bigint }[]>`
        SELECT 
            visit_count,
            COUNT(*)::int as student_count
        FROM (
            SELECT b.student_id, COUNT(*) as visit_count
            FROM "booking" b
            JOIN "student_academic" sa ON b.student_id = sa.student_id AND b.university_id = sa.university_id
            JOIN "student_profile" sp ON b.student_id = sp.student_id AND b.university_id = sp.university_id
            LEFT JOIN "department" d ON sa.department_id = d.department_id AND sa.university_id = d.university_id
            LEFT JOIN "booking_outcome" bo ON b.university_id = bo.university_id AND b.booking_id = bo.booking_id
            LEFT JOIN "problem_category" pc ON b.problem_category_id = pc.problem_category_id
            ${commonWhereBooking}
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
    
    // 8.1. Fetch Risk distribution for each department
    const deptRiskStats = await prisma.$queryRaw<{ department_id: number, risk: number, count: bigint }[]>`
        SELECT 
            sa.department_id,
            bo.booking_outcome_risk_level as risk,
            COUNT(*)::int as count
        FROM "booking" b
        JOIN "booking_outcome" bo ON b.university_id = bo.university_id AND b.booking_id = bo.booking_id
        JOIN "student_academic" sa ON b.student_id = sa.student_id AND b.university_id = sa.university_id
        JOIN "student_profile" sp ON b.student_id = sp.student_id AND b.university_id = sp.university_id
        LEFT JOIN "department" d ON sa.department_id = d.department_id AND sa.university_id = d.university_id
        LEFT JOIN "problem_category" pc ON b.problem_category_id = pc.problem_category_id
        ${commonWhereBooking}
        GROUP BY sa.department_id, bo.booking_outcome_risk_level
    `;

    // 8.2. Fetch Problem stats for each department
    const deptProblemStats = await prisma.$queryRaw<{ department_id: number, name: string, gender: string, count: bigint }[]>`
        SELECT 
            sa.department_id,
            COALESCE(pc.problem_category_name_th, 'อื่นๆ') as name,
            sp.student_gender as gender,
            COUNT(*)::int as count
        FROM "booking" b
        LEFT JOIN "problem_category" pc ON b.problem_category_id = pc.problem_category_id
        JOIN "student_academic" sa ON b.student_id = sa.student_id AND b.university_id = sa.university_id
        JOIN "student_profile" sp ON b.student_id = sp.student_id AND b.university_id = sp.university_id
        LEFT JOIN "department" d ON sa.department_id = d.department_id AND sa.university_id = d.university_id
        LEFT JOIN "booking_outcome" bo ON b.university_id = bo.university_id AND b.booking_id = bo.booking_id
        ${commonWhereBooking}
        GROUP BY sa.department_id, pc.problem_category_name_th, sp.student_gender
    `;

    // 8.3. Fetch Visits by month for each department
    const deptVisitsQuery = await prisma.$queryRaw<{ department_id: number, month: string, count: bigint }[]>`
        SELECT 
            sa.department_id,
            TO_CHAR(b.booking_created_at, 'YYYY-MM') as month,
            COUNT(*)::int as count
        FROM "booking" b
        JOIN "student_academic" sa ON b.student_id = sa.student_id AND b.university_id = sa.university_id
        JOIN "student_profile" sp ON b.student_id = sp.student_id AND b.university_id = sp.university_id
        LEFT JOIN "department" d ON sa.department_id = d.department_id AND sa.university_id = d.university_id
        LEFT JOIN "booking_outcome" bo ON b.university_id = bo.university_id AND b.booking_id = bo.booking_id
        LEFT JOIN "problem_category" pc ON b.problem_category_id = pc.problem_category_id
        ${commonWhereBooking}
        GROUP BY sa.department_id, month
    `;

    // 8.4. Base department info
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
                SELECT COUNT(DISTINCT sa.student_id)::int
                FROM "student_academic" sa
                WHERE sa.department_id = d.department_id 
                AND sa.university_id = ${universityId}
                AND sa.faculty_id = ${facultyId}
                ${useBookingContext ? Prisma.sql`
                   AND EXISTS (
                      SELECT 1 FROM "booking" b 
                      JOIN "student_profile" sp ON b.student_id = sp.student_id AND b.university_id = sp.university_id
                      LEFT JOIN "booking_outcome" bo ON b.university_id = bo.university_id AND b.booking_id = bo.booking_id
                      LEFT JOIN "problem_category" pc ON b.problem_category_id = pc.problem_category_id
                      WHERE b.student_id = sa.student_id AND b.university_id = sa.university_id
                      AND ${commonConditions}
                   )
                ` : Prisma.empty}
            ) as student_count,
            (
                SELECT COUNT(*)::int
                FROM "booking" b
                JOIN "student_academic" sa ON b.student_id = sa.student_id AND b.university_id = sa.university_id
                JOIN "student_profile" sp ON b.student_id = sp.student_id AND b.university_id = sp.university_id
                LEFT JOIN "booking_outcome" bo ON b.university_id = bo.university_id AND b.booking_id = bo.booking_id
                LEFT JOIN "problem_category" pc ON b.problem_category_id = pc.problem_category_id
                WHERE sa.department_id = d.department_id 
                AND ${commonConditions}
            ) as booking_count
        FROM "department" d
        WHERE d.faculty_id = ${facultyId} AND d.university_id = ${universityId}
        ${whereDept}
    `;

    const departmentStats = deptStatsQuery.map(d => {
      const deptId = d.department_id;
      
      // Filter risk distribution for this dept
      const riskDist = { HIGH: 0, MEDIUM: 0, LOW: 0, NORMAL: 0 };
      deptRiskStats.filter(r => r.department_id === deptId).forEach(r => {
        if (r.risk >= 4) riskDist.HIGH += Number(r.count);
        else if (r.risk === 3) riskDist.MEDIUM += Number(r.count);
        else if (r.risk === 2) riskDist.LOW += Number(r.count);
        else riskDist.NORMAL += Number(r.count);
      });

      // Filter problem stats for this dept
      const pStats: Record<string, number> = {};
      const gPStats: Record<string, Record<string, number>> = { Male: {}, Female: {}, Other: {} };
      deptProblemStats.filter(p => p.department_id === deptId).forEach(row => {
        const count = Number(row.count);
        pStats[row.name] = (pStats[row.name] || 0) + count;
        if (row.gender === 'MALE') {
          gPStats.Male[row.name] = (gPStats.Male[row.name] || 0) + count;
        } else if (row.gender === 'FEMALE') {
          gPStats.Female[row.name] = (gPStats.Female[row.name] || 0) + count;
        } else {
          gPStats.Other[row.name] = (gPStats.Other[row.name] || 0) + count;
        }
      });

      // Filter visits for this dept
      const vByMonth: Record<string, number> = {};
      deptVisitsQuery.filter(v => v.department_id === deptId).forEach(v => {
        if (v.month) vByMonth[v.month] = Number(v.count);
      });

      return {
        departmentId: d.department_id,
        departmentCode: d.department_code,
        departmentName: d.department_name_th,
        departmentNameEn: d.department_name_en,
        studentCount: Number(d.student_count),
        bookingCount: Number(d.booking_count),
        riskDistribution: riskDist,
        problemStats: pStats,
        genderProblemStats: gPStats,
        visitsByMonth: vByMonth
      };
    });

    // Total Departments
    const totalDepartmentsQuery = await prisma.$queryRaw<{ count: bigint }[]>`
        SELECT COUNT(*)::int as count FROM "department" d
        WHERE d.faculty_id = ${facultyId} AND d.university_id = ${universityId}
        ${whereDept}
    `;
    const totalDepartments = Number(totalDepartmentsQuery[0]?.count || 0);

    // ─── 9. Active Cases ───
    const activeCasesQuery = await prisma.$queryRaw<{ count: bigint }[]>`
        SELECT COUNT(DISTINCT b.booking_id)::int as count
        FROM "booking" b
        JOIN "student_academic" sa ON b.student_id = sa.student_id AND b.university_id = sa.university_id
        JOIN "student_profile" sp ON b.student_id = sp.student_id AND b.university_id = sp.university_id
        LEFT JOIN "department" d ON sa.department_id = d.department_id AND sa.university_id = d.university_id
        LEFT JOIN "booking_outcome" bo ON b.university_id = bo.university_id AND b.booking_id = bo.booking_id
        LEFT JOIN "problem_category" pc ON b.problem_category_id = pc.problem_category_id
        ${commonWhereBooking}
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
        JOIN "student_profile" sp ON b.student_id = sp.student_id AND b.university_id = sp.university_id
        LEFT JOIN "department" d ON sa.department_id = d.department_id AND sa.university_id = d.university_id
        LEFT JOIN "booking_outcome" bo ON b.university_id = bo.university_id AND b.booking_id = bo.booking_id
        LEFT JOIN "problem_category" pc ON b.problem_category_id = pc.problem_category_id
        ${commonWhereBooking}
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
      universityLogoUrl: `/images/logo/${faculty.university.university_code}_logo.png`,
      subjectGroupCategory: faculty.subjectGroupCategory?.field_group_name_en || null,
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
      recentCases: await this.getRecentCases(facultyId, universityId, ayStart, ayEnd),
      strategicAnalysis: await this.getStrategicAnalysis(facultyId, universityId, ayStart, ayEnd, departmentStats),
    };
  },

  async getRecentCases(facultyId: number, universityId: number, ayStart: Date, ayEnd: Date) {
    const recentBookings = await prisma.$queryRaw<unknown[]>`
      SELECT 
        b.booking_id as id,
        b.student_id,
        b.booking_created_at as "createdAt",
        b.booking_status as status,
        b.booking_service_mode as "serviceMode",
        sa.student_admit_academic_year as "admitYear",
        d.department_name_th as "departmentName",
        d.department_code as "departmentCode",
        pc.problem_category_name_th as "problemName",
        bo.booking_outcome_risk_level as "riskLevel",
        sp.student_gender as gender
      FROM "booking" b
      JOIN "student_academic" sa ON b.student_id = sa.student_id AND b.university_id = sa.university_id
      LEFT JOIN "department" d ON sa.department_id = d.department_id AND sa.university_id = d.university_id
      LEFT JOIN "problem_category" pc ON b.problem_category_id = pc.problem_category_id
      LEFT JOIN "booking_outcome" bo ON b.university_id = bo.university_id AND b.booking_id = bo.booking_id
      LEFT JOIN "student_profile" sp ON b.student_id = sp.student_id AND b.university_id = sp.university_id
      WHERE b.university_id = ${universityId}
      AND sa.faculty_id = ${facultyId}
      AND b.booking_created_at >= ${ayStart}
      AND b.booking_created_at <= ${ayEnd}
      ORDER BY b.booking_created_at DESC
    `;

    console.log(`[DeanService] getRecentCases (Raw SQL) found ${recentBookings.length} bookings for faculty ${facultyId}`);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return recentBookings.map((b: any) => {
      const riskLevel = Number(b.riskLevel) || 1;
      let risk: "NORMAL" | "MODERATE" | "HIGH" | "CRITICAL" = "NORMAL";
      if (riskLevel >= 4) risk = "CRITICAL";
      else if (riskLevel === 3) risk = "HIGH";
      else if (riskLevel === 2) risk = "MODERATE";

      const currentYear = new Date().getFullYear() + 543;
      const yearLevel = b.admitYear 
        ? Math.min(5, currentYear - Number(b.admitYear) + 1)
        : 1;

      return {
        id: `CASE-${b.id}`,
        name: `นิสิตชั้นปีที่ ${yearLevel} - ${b.departmentName || "ไม่ระบุ"}`,
        risk,
        problem: b.problemName || "ไม่ระบุ",
        date: new Date(b.createdAt).toLocaleDateString("th-TH", { day: "2-digit", month: "short", year: "numeric" }),
        status: b.status === "COMPLETED" ? "ปิดเคสแล้ว" : (b.status === "PENDING_ASSIGNMENT" ? "รอรับบัตร" : "กำลังดำเนินการ"),
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${b.student_id}`,
        department: b.departmentCode || "UNKNOWN",
        year: `YEAR_${yearLevel}`,
        serviceMode: b.serviceMode,
        gender: b.gender || "OTHER",
      };
    });
  },

  async getStrategicAnalysis(facultyId: number, universityId: number, ayStart: Date, ayEnd: Date, deptStats: { departmentName: string; riskDistribution: { HIGH: number }; [key: string]: unknown }[]) {
    // 1. Highest Risk Group (Department or Year)
    const topRiskDept = [...deptStats].sort((a, b) => b.riskDistribution.HIGH - a.riskDistribution.HIGH)[0];

    const yearRiskStats = await prisma.$queryRaw<{ year_level: number, high_risk_count: bigint }[]>`
      SELECT 
        CASE 
          WHEN sa.student_admit_academic_year IS NULL THEN 0
          WHEN (${new Date().getFullYear() + 543} - sa.student_admit_academic_year + 1) > 4 THEN 5
          ELSE (${new Date().getFullYear() + 543} - sa.student_admit_academic_year + 1)
        END as year_level,
        COUNT(*)::int as high_risk_count
      FROM "booking" b
      JOIN "booking_outcome" bo ON b.university_id = bo.university_id AND b.booking_id = bo.booking_id
      JOIN "student" s ON b.student_id = s.student_id AND b.university_id = s.university_id
      JOIN "student_academic" sa ON s.student_id = sa.student_id AND s.university_id = sa.university_id
      WHERE b.university_id = ${universityId}
      AND sa.faculty_id = ${facultyId}
      AND bo.booking_outcome_risk_level >= 3
      AND b.booking_created_at >= ${ayStart}
      AND b.booking_created_at <= ${ayEnd}
      GROUP BY year_level
      ORDER BY high_risk_count DESC
      LIMIT 1
    `;

    const topRiskYear = yearRiskStats[0];

    let riskGroup = { name: "N/A", count: 0, sub: "ไม่พบข้อมูล" };
    if (topRiskDept && topRiskDept.riskDistribution.HIGH > (Number(topRiskYear?.high_risk_count) || 0)) {
      riskGroup = {
        name: topRiskDept.departmentName,
        count: topRiskDept.riskDistribution.HIGH,
        sub: `พบกลุ่มเสี่ยง ${topRiskDept.riskDistribution.HIGH} ราย`
      };
    } else if (topRiskYear) {
      riskGroup = {
        name: `นิสิตชั้นปีที่ ${topRiskYear.year_level === 5 ? '5 ขึ้นไป' : topRiskYear.year_level}`,
        count: Number(topRiskYear.high_risk_count),
        sub: `พบกลุ่มเสี่ยง ${topRiskYear.high_risk_count} ราย`
      };
    }

    // 2. Most Common Problem
    const problemStatsResult = await prisma.$queryRaw<{ name: string, count: bigint }[]>`
      SELECT 
        pc.problem_category_name_th as name,
        COUNT(*)::int as count
      FROM "booking" b
      JOIN "problem_category" pc ON b.problem_category_id = pc.problem_category_id
      JOIN "student" s ON b.student_id = s.student_id AND b.university_id = s.university_id
      JOIN "student_academic" sa ON s.student_id = sa.student_id AND s.university_id = sa.university_id
      WHERE b.university_id = ${universityId}
      AND sa.faculty_id = ${facultyId}
      AND b.booking_created_at >= ${ayStart}
      AND b.booking_created_at <= ${ayEnd}
      GROUP BY pc.problem_category_name_th
      ORDER BY count DESC
      LIMIT 1
    `;

    const topProblem = problemStatsResult[0] ? {
      name: problemStatsResult[0].name,
      count: Number(problemStatsResult[0].count),
      sub: `จำนวน ${problemStatsResult[0].count} เคส`
    } : { name: "ไม่พบข้อมูล", count: 0, sub: "เริ่มบันทึกข้อมูลเพื่อวิเคราะห์" };

    return {
      riskGroup,
      topProblem
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
