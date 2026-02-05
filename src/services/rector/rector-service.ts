import prisma from "@/lib/prisma";

export const RectorService = {
  /**
   * Get KPIs for a specific university
   */
  async getRectorKPI(universityId: number, filters?: { startDate?: string; endDate?: string }) {
    if (!universityId) return null;

    const dateFilter: any = {};
    if (filters?.startDate && filters?.endDate) {
        dateFilter.booking_created_at = {
            gte: new Date(filters.startDate),
            lte: new Date(filters.endDate + "T23:59:59")
        };
    }

    // Total Users: Count students in this university (Total usually means ALL, filter might not apply or apply to 'Active Users in period')
    // Let's keep Total Users as global total for now, or filter by 'created_at' if it means 'New Users'?
    // Usually "Total Users" is a stock metric. Let's keep it global.
    const totalUsers = await prisma.student.count({
        where: { university_id: universityId }
    });

    // Closed Cases: Bookings with COMPLETED status in period
    const closedCases = await prisma.booking.count({
        where: { 
            university_id: universityId,
            booking_status: "COMPLETED",
            ...dateFilter
        }
    });

    // High Risk: Bookings with outcome risk >= 4 in period
    const highRiskDateFilter: any = {};
    if (filters?.startDate && filters?.endDate) {
        highRiskDateFilter.booking_outcome_recorded_at = {
            gte: new Date(filters.startDate),
            lte: new Date(filters.endDate + "T23:59:59")
        };
    }
    const highRisk = await prisma.bookingOutcome.count({
        where: {
            university_id: universityId,
            booking_outcome_risk_level: { gte: 4 },
            ...highRiskDateFilter
        }
    });

    // Satisfaction: Avg rating from Feedback in period (based on feedback_created_at)
    const feedbackDateFilter: any = {};
    if (filters?.startDate && filters?.endDate) {
        feedbackDateFilter.feedback_created_at = {
            gte: new Date(filters.startDate),
            lte: new Date(filters.endDate + "T23:59:59")
        };
    }

    const ratings = await prisma.feedbackRating.aggregate({
        where: {
            feedback: {
                university_id: universityId,
                ...feedbackDateFilter
            }
        },
        _avg: {
            feedback_rating_score: true
        }
    });
    
    // Fallback to 0 if no ratings
    const satisfaction = ratings._avg.feedback_rating_score 
        ? Number(ratings._avg.feedback_rating_score.toFixed(1)) 
        : 0;

    return {
        totalUsers,
        closedCases,
        highRisk,
        satisfaction
    };
  },

  /**
   * Get Mental Health Trends (Cases over time)
   */
  async getMentalHealthTrends(universityId: number, filters?: { startDate?: string; endDate?: string }) {
     if (!universityId) return { labels: [], datasets: [] };

     // Date filter logic would normally go here to restrict the range of the trend
     // For now, we return the mock structure but ideally we filter 'booking_created_at'
     
     return {
        labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
        datasets: [
          {
            label: "เคสสะสม",
            data: [10, 25, 40, 45, 60, 80], // Placeholder
            borderColor: "rgb(75, 192, 192)",
            backgroundColor: "rgba(75, 192, 192, 0.5)",
            tension: 0.4,
          },
          {
            label: "เคสปิดแล้ว",
            data: [5, 15, 30, 40, 50, 70], // Placeholder
            borderColor: "rgb(53, 162, 235)",
            backgroundColor: "rgba(53, 162, 235, 0.5)",
            tension: 0.4,
          },
        ],
     };
  },

  /**
   * Get Risk Distribution (Pie Chart)
   */
  async getRiskDistribution(universityId: number, filters?: { startDate?: string; endDate?: string }) {
     if (!universityId) return { labels: [], datasets: [] };

     const where: any = { university_id: universityId };
     if (filters?.startDate && filters?.endDate) {
        where.booking_outcome_recorded_at = {
            gte: new Date(filters.startDate),
            lte: new Date(filters.endDate + "T23:59:59")
        };
     }

     const risks = await prisma.bookingOutcome.groupBy({
         by: ['booking_outcome_risk_level'],
         where,
         _count: true
     });

     // Map 1-5 to levels
     // This is a quick mapping.
     const labels = ["ปกติ", "เสี่ยงต่ำ", "เสี่ยงปานกลาง", "เสี่ยงสูง", "รุนแรง"];
     // Initialize counts
     const counts = [0, 0, 0, 0, 0];
     
     risks.forEach(r => {
         if (r.booking_outcome_risk_level && r.booking_outcome_risk_level >= 1 && r.booking_outcome_risk_level <= 5) {
             counts[r.booking_outcome_risk_level - 1] = r._count;
         }
     });

     return {
        labels,
        datasets: [
          {
            data: counts,
            backgroundColor: [
              "rgba(75, 192, 192, 0.8)", // Normal
              "rgba(255, 206, 86, 0.8)", // Mild
              "rgba(255, 159, 64, 0.8)", // Moderate
              "rgba(255, 99, 132, 0.8)", // High
              "rgba(153, 102, 255, 0.8)", // Severe
            ],
            borderWidth: 1,
          },
        ],
     };
  },

  /**
   * Get Faculty Stats
   */
  async getFacultyStats(universityId: number, filters?: { startDate?: string; endDate?: string }) {
     if (!universityId) return { labels: [], datasets: [] };

     // Filter would apply to bookings joined with students
     
     return {
        labels: ["วิศวกรรมศาสตร์", "วิทยาศาสตร์", "ศึกษาศาสตร์", "มนุษยศาสตร์", "แพทย์"],
        datasets: [
          {
            label: "จำนวนนิสิตที่เข้าใช้บริการ (คน)",
            data: [120, 90, 80, 60, 40],
            backgroundColor: "rgba(153, 102, 255, 0.6)",
          },
        ],
      };
  }
};
