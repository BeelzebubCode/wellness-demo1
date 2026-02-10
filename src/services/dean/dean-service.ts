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
      },
    });

    // Calculate risk distribution
    const riskDistribution = {
      critical: 0,
      high: 0,
      moderate: 0,
      normal: 0,
    };

    bookings.forEach((booking) => {
      const riskLevel = booking.outcome?.booking_outcome_risk_level || 0;
      if (riskLevel >= 5) {
        riskDistribution.critical++;
      } else if (riskLevel === 4) {
        riskDistribution.high++;
      } else if (riskLevel === 3) {
        riskDistribution.moderate++;
      } else {
        riskDistribution.normal++;
      }
    });

    // Calculate problem breakdown
    const problemBreakdown: Record<string, number> = {};
    bookings.forEach((booking) => {
      const code = booking.problemCategory?.problem_category_code;
      if (code) {
        problemBreakdown[code] = (problemBreakdown[code] || 0) + 1;
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
      problemBreakdown,
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
