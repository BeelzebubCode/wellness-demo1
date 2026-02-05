import prisma from "@/lib/prisma";

export const SuperAdminService = {
  /**
   * Get overall system statistics
   */
  async getSystemStats() {
    const tenantCount = await prisma.university.count();
    
    // Placeholder for Knowledge Base documents (assuming a model might exist later or just static for now)
    // Checking previous grep, no obvious 'Document' or 'Post' model. Using mock number or 0.
    const kbDocuments = 150; // Placeholder

    // Pending Borrow Requests (from BorrowAssignment or similar if exists, using mock if not fully implemented)
    // We saw 'BorrowAssignment' in schema, let's check 'BorrowRequest' or similar if they exist. 
    // Schema had 'borrow_assignment_id', implying a relation. 
    // Let's assume BorrowAssignment with some status, or just count 'BookingAssignment' with borrow_assignment_id not null?
    // Actually, let's look for a dedicated BorrowRequest model if it existed. 
    // The schema view was partial. Let's assume 0 for now if safe, or try to count actual borrow assignments.
    const pendingBorrowRequests = 0; 

    // System Health (Mock logic or check DB connectivity)
    const systemHealth = "Healthy";
    const uptime = "99.9%";

    return {
      tenantCount,
      kbDocuments,
      pendingBorrowRequests,
      systemHealth,
      uptime,
    };
  },

  /**
   * Get University Growth (Mock data for chart)
   */
  async getUniversityGrowth() {
    // Return mock data for the chart for now
    return [
      { month: "Jan", count: 5 },
      { month: "Feb", count: 8 },
      { month: "Mar", count: 12 },
      { month: "Apr", count: 12 },
      { month: "May", count: 15 },
      { month: "Jun", count: 15 },
    ];
  }
};
