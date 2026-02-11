export const StrategicMockData = {
    // Q1: Mental Health Trend (YoY)
    trends: {
        comparisonYear: "2568 vs 2567",
        trend: "increasing", // or decreasing
        percentChange: 12.5,
        monthlyData: {
            currentYear: [65, 70, 75, 85, 90, 85, 80, 85, 95, 100, 110, 105], // Higher trend
            lastYear: [60, 62, 65, 68, 70, 68, 65, 68, 72, 75, 78, 80]
        }
    },

    // Q2, Q3, Q9: System Capacity & Readiness
    capacity: {
        currentLoad: 85, // %
        status: "critical", // normal, warning, critical
        maxCapacity: 500,
        activeCases: 425,
        avgWaitTime: 4.5, // Days
        emergencyReadiness: true, // Q9
        emergencyTeamAvailable: 5, // Persons ready now
    },

    // Q4, Q5, Q6: Workforce & Severe Cases
    workforce: {
        severeCaseGrowth: 15, // % increase
        staffGrowth: 2, // % increase (Mismatch alert!)
        therapistBurnoutRisk: "High", // Q5
        internalCases: 65, // %
        externalCases: 35, // % (Q6 - Are we relying too much?)
        averageCaseload: 35, // Cases per therapist (High!)
    },

    // Q7, Q8: Quality & Safety
    quality: {
        satisfactionScore: 4.2, // /5
        satisfactionTrend: "improving", // +0.3 vs last quarter
        criticalIncidents: 0, // Q8 - Legal/Ethical failures
        missedFollowUps: 2, // Warning
    },

    // Q10: Service Quality & Impact (Real Schema: Feedback & BookingOutcome)
    impact: {
        avgSatisfaction: 4.6, // From FeedbackRating
        totalCompletedCases: 1250, // From BookingStatus.COMPLETED
        highRiskReduction: 150, // From BookingOutcome trends
        responseRate: 98.5 // % of Bookings responded to
    },

    // --- NEW EXPANDED DATA ---

    // Demographics: Risk by Year
    demographics: {
        labels: ["ปี 1", "ปี 2", "ปี 3", "ปี 4+"],
        datasets: [
            { label: "ความเสี่ยงสูง", data: [45, 30, 25, 40] },
            { label: "ความเสี่ยงปานกลาง", data: [60, 55, 45, 50] },
            { label: "ปกติ", data: [200, 180, 190, 150] }
        ]
    },

    // Top Issues
    issues: [
        { topic: "ความเครียดจากการเรียน", count: 450, color: "#EF4444" }, // Red
        { topic: "ปัญหาครอบครัว", count: 320, color: "#F97316" }, // Orange
        { topic: "ความสัมพันธ์", count: 280, color: "#F59E0B" }, // Amber
        { topic: "การปรับตัว", count: 210, color: "#3B82F6" }, // Blue
        { topic: "การนอนหลับ", count: 150, color: "#8B5CF6" }, // Purple
        { topic: "การเงิน", count: 90, color: "#10B981" } // Emerald
    ],

    // Appointment Funnel
    funnel: {
        requested: 1500,
        booked: 1200,
        completed: 1100,
        followUpNeeded: 300,
        followUpCompleted: 280
    },

    // Detailed Faculty Table (All Faculties Spectrum)
    facultyDetails: [
        { name: "วิศวกรรมศาสตร์", riskScore: 4.2, students: 2500, activeCases: 120, trend: "up" },
        { name: "สถาปัตยกรรมศาสตร์", riskScore: 3.8, students: 1200, activeCases: 85, trend: "stable" },
        { name: "พาณิชยศาสตร์และการบัญชี", riskScore: 3.5, students: 3000, activeCases: 90, trend: "down" },
        { name: "นิเทศศาสตร์", riskScore: 3.2, students: 1500, activeCases: 45, trend: "stable" },
        { name: "วิทยาศาสตร์", riskScore: 2.9, students: 1800, activeCases: 60, trend: "up" },
        { name: "อักษรศาสตร์", riskScore: 2.8, students: 1100, activeCases: 40, trend: "stable" },
        { name: "รัฐศาสตร์", riskScore: 2.7, students: 900, activeCases: 35, trend: "down" },
        { name: "เศรษฐศาสตร์", riskScore: 2.5, students: 850, activeCases: 25, trend: "stable" },
        { name: "นิติศาสตร์", riskScore: 2.4, students: 950, activeCases: 20, trend: "down" },
        { name: "ครุศาสตร์", riskScore: 2.2, students: 1600, activeCases: 30, trend: "stable" },
        { name: "จิตวิทยา", riskScore: 2.1, students: 400, activeCases: 15, trend: "stable" },
        { name: "แพทยศาสตร์", riskScore: 1.9, students: 1400, activeCases: 25, trend: "stable" },
        { name: "ทันตแพทยศาสตร์", riskScore: 1.8, students: 600, activeCases: 10, trend: "stable" },
        { name: "เภสัชศาสตร์", riskScore: 1.7, students: 700, activeCases: 12, trend: "down" }
    ]
};
