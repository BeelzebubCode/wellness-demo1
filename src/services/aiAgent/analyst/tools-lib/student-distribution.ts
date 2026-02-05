import { prisma } from "@/lib/prisma";

export const getStudentDistribution = {
  name: "getStudentDistribution",
  description: "Get number of students per faculty. Useful for 'student distribution', 'which faculty has most students'.",
  parameters: {
    type: "object",
    properties: {
      universityId: { type: "integer", description: "Optional university ID to filter by" },
    },
  },
  execute: async ({ universityId }: { universityId?: number }) => {
    // Note: This relies on how student-faculty relationship is structured.
    // Assuming Student -> Academic -> Faculty
    const students = await prisma.student.findMany({
      where: {
        ...(universityId ? { university_id: universityId } : {}),
      },
      select: {
        academic: {
          select: {
            faculty: {
              select: {
                faculty_name_th: true,
              }
            }
          }
        }
      }
    });

    const facultyCounts: Record<string, number> = {};
    
    students.forEach((s) => {
      const faculty = s.academic?.faculty?.faculty_name_th || "Unknown";
      facultyCounts[faculty] = (facultyCounts[faculty] || 0) + 1;
    });

    const chartData = Object.entries(facultyCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10); // Top 10 faculties

    return {
      summary: "Student distribution by faculty (Top 10)",
      data: chartData,
      recommendedChart: "pie",
    };
  },
};
