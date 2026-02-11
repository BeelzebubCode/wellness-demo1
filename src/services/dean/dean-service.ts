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
    // Get faculty info
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

    // Get department statistics
    const departments = await prisma.department.findMany({
      where: {
        faculty_id: facultyId,
        university_id: universityId,
      },
      include: {
        _count: {
          select: {
            studentAcademics: true,
          },
        },
      },
    });

    // Get all student IDs in this faculty for booking queries
    const studentAcademics = await prisma.studentAcademic.findMany({
      where: {
        faculty_id: facultyId,
        university_id: universityId,
      },
      select: {
        student_id: true,
      },
    });

    const studentIds = studentAcademics.map((sa) => sa.student_id);

    // Get booking statistics for students in this faculty
    const bookings = await prisma.booking.findMany({
      where: {
        university_id: universityId,
        student_id: { in: studentIds },
      },
      include: {
        outcome: true,
        problemCategory: {
          select: {
            problem_category_code: true,
            problem_category_name_th: true,
            problem_category_name_en: true,
          },
        },
        student: {
          select: {
            profile: {
              select: {
                student_gender: true,
              },
            },
          },
        },
      },
    });

    // Calculate risk distribution
    const riskDistribution = {
      HIGH: 0,
      MEDIUM: 0,
      LOW: 0,
      NORMAL: 0,
    };

    bookings.forEach((booking) => {
      const riskLevel = booking.outcome?.booking_outcome_risk_level || 0;
      if (riskLevel >= 5) {
        riskDistribution.HIGH++;
      } else if (riskLevel === 4) {
        riskDistribution.MEDIUM++;
      } else if (riskLevel === 3) {
        riskDistribution.LOW++;
      } else {
        riskDistribution.NORMAL++;
      }
    });

    // Calculate problem breakdown
    const problemStats: Record<string, number> = {};
    bookings.forEach((booking) => {
      const code = booking.problemCategory?.problem_category_code;
      if (code) {
        problemStats[code] = (problemStats[code] || 0) + 1;
      }
    });

    // Calculate gender vs problem stats
    const genderProblemStats: Record<string, Record<string, number>> = {
      Male: {},
      Female: {},
    };

    bookings.forEach((booking) => {
      const gender = booking.student?.profile?.student_gender;
      const code = booking.problemCategory?.problem_category_code;

      if (code && gender && (gender === "MALE" || gender === "FEMALE")) {
        const genderKey = gender === "MALE" ? "Male" : "Female";
        if (!genderProblemStats[genderKey][code]) {
          genderProblemStats[genderKey][code] = 0;
        }
        genderProblemStats[genderKey][code]++;
      }
    });

    // Calculate visits by month
    const visitsByMonth: Record<string, number> = {};
    bookings.forEach((booking) => {
      const createdAt = booking.booking_created_at;
      if (createdAt) {
        const monthKey = `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, '0')}`;
        visitsByMonth[monthKey] = (visitsByMonth[monthKey] || 0) + 1;
      }
    });

    // Calculate repeat consultation stats
    const studentVisitCounts: Record<number, number> = {};
    bookings.forEach((booking) => {
      const studentId = booking.student_id;
      studentVisitCounts[studentId] = (studentVisitCounts[studentId] || 0) + 1;
    });

    const repeatStats = {
      single: 0,
      repeat: 0,
    };

    Object.values(studentVisitCounts).forEach((count) => {
      if (count === 1) {
        repeatStats.single++;
      } else if (count > 1) {
        repeatStats.repeat++;
      }
    });

    // Department stats with booking counts
    const departmentStats = await Promise.all(
      departments.map(async (dept) => {
        // Get students in this department
        const deptStudents = await prisma.studentAcademic.findMany({
          where: {
            department_id: dept.department_id,
            university_id: universityId,
          },
          select: {
            student_id: true,
          },
        });

        const deptStudentIds = deptStudents.map((s) => s.student_id);

        // Count bookings for this department
        const bookingCount = await prisma.booking.count({
          where: {
            university_id: universityId,
            student_id: { in: deptStudentIds },
          },
        });

        return {
          departmentId: dept.department_id,
          departmentCode: dept.department_code,
          departmentName: dept.department_name_th,
          departmentNameEn: dept.department_name_en,
          studentCount: dept._count.studentAcademics,
          bookingCount,
        };
      })
    );

    return {
      facultyId: faculty.faculty_id,
      facultyCode: faculty.faculty_code,
      facultyName: faculty.faculty_name_th,
      facultyNameEn: faculty.faculty_name_en,
      universityCode: faculty.university.university_code,
      universityName: faculty.university.university_name_th,
      educationFieldGroup: faculty.educationFieldGroup?.field_group_name_en || null,
      totalStudents: studentAcademics.length,
      totalDepartments: departments.length,
      totalBookings: bookings.length,
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
