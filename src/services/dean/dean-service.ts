import prisma from "@/lib/prisma";

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
   */
  async getFacultyStats(facultyId: number, universityId: number) {
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

    // 2. Total Students in Faculty (SQL)
    const totalStudentsQuery = await prisma.$queryRaw<{ count: bigint }[]>`
        SELECT COUNT(*)::int as count
        FROM "student_academic"
        WHERE "university_id" = ${universityId}
        AND "faculty_id" = ${facultyId}
    `;
    const totalStudents = Number(totalStudentsQuery[0]?.count || 0);

    // 3. Total Bookings for Faculty Students (SQL)
    // We join booking -> student_academic to filter by faculty
    const totalBookingsQuery = await prisma.$queryRaw<{ count: bigint }[]>`
        SELECT COUNT(b.booking_id)::int as count
        FROM "booking" b
        JOIN "student_academic" sa ON b.student_id = sa.student_id AND b.university_id = sa.university_id
        WHERE b.university_id = ${universityId}
        AND sa.faculty_id = ${facultyId}
    `;
    const totalBookings = Number(totalBookingsQuery[0]?.count || 0);

    // 4. Risk Distribution (SQL)
    const riskStats = await prisma.$queryRaw<{ risk: number, count: bigint }[]>`
        SELECT 
            bo.booking_outcome_risk_level as risk,
            COUNT(*)::int as count
        FROM "booking" b
        JOIN "booking_outcome" bo ON b.booking_id = bo.booking_id
        JOIN "student_academic" sa ON b.student_id = sa.student_id AND b.university_id = sa.university_id
        WHERE b.university_id = ${universityId}
        AND sa.faculty_id = ${facultyId}
        GROUP BY bo.booking_outcome_risk_level
    `;

    const riskDistribution = { HIGH: 0, MEDIUM: 0, LOW: 0, NORMAL: 0 };
    riskStats.forEach(r => {
        if (r.risk >= 4) riskDistribution.HIGH += Number(r.count);
        else if (r.risk === 3) riskDistribution.MEDIUM += Number(r.count);
        else if (r.risk === 2) riskDistribution.LOW += Number(r.count);
        else riskDistribution.NORMAL += Number(r.count);
    });

    // 5. Problem Stats & Gender (SQL)
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
        GROUP BY pc.problem_category_name_th, sp.student_gender
    `;

    const problemStats: Record<string, number> = {};
    const genderProblemStats: Record<string, Record<string, number>> = { Male: {}, Female: {} };

    problemGenderStats.forEach(row => {
        const count = Number(row.count);
        problemStats[row.name] = (problemStats[row.name] || 0) + count;
        if (row.gender === 'MALE') {
             genderProblemStats.Male[row.name] = (genderProblemStats.Male[row.name] || 0) + count;
        } else if (row.gender === 'FEMALE') {
             genderProblemStats.Female[row.name] = (genderProblemStats.Female[row.name] || 0) + count;
        }
    });

    // 6. Visits by Month (SQL)
    const visitsQuery = await prisma.$queryRaw<{ month: string, count: bigint }[]>`
        SELECT 
            TO_CHAR(booking_created_at, 'YYYY-MM') as month,
            COUNT(*)::int as count
        FROM "booking" b
        JOIN "student_academic" sa ON b.student_id = sa.student_id AND b.university_id = sa.university_id
        WHERE b.university_id = ${universityId}
        AND sa.faculty_id = ${facultyId}
        GROUP BY TO_CHAR(booking_created_at, 'YYYY-MM')
    `;
    const visitsByMonth: Record<string, number> = {};
    visitsQuery.forEach(v => {
         if(v.month) visitsByMonth[v.month] = Number(v.count);
    });

    // 7. Repeat Visits (SQL)
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
            GROUP BY b.student_id
        ) as sub
        GROUP BY visit_count
    `;
    const repeatStats = { single: 0, repeat: 0 };
    repeatQuery.forEach(r => {
        if (r.visit_count === 1) repeatStats.single += Number(r.student_count);
        else repeatStats.repeat += Number(r.student_count);
    });

    // 8. Department Stats (SQL)
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
                WHERE sa.department_id = d.department_id AND sa.university_id = ${universityId}
            ) as student_count,
            (
                SELECT COUNT(*)::int
                FROM "booking" b
                JOIN "student_academic" sa ON b.student_id = sa.student_id AND b.university_id = sa.university_id
                WHERE sa.department_id = d.department_id AND b.university_id = ${universityId}
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

    return {
      facultyId: faculty.faculty_id,
      facultyCode: faculty.faculty_code,
      facultyName: faculty.faculty_name_th,
      facultyNameEn: faculty.faculty_name_en,
      universityCode: faculty.university.university_code,
      universityName: faculty.university.university_name_th,
      educationFieldGroup: faculty.educationFieldGroup?.field_group_name_en || null,
      totalStudents,
      totalDepartments,
      totalBookings,
      riskDistribution,
      problemStats,
      genderProblemStats,
      visitsByMonth,
      repeatStats,
      departmentStats,
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
