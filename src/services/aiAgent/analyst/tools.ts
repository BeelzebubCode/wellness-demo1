import { getBookingStats } from "./tools-lib/booking-stats";
import { getStudentDistribution } from "./tools-lib/student-distribution";
import { getPopularTimeSlots } from "./tools-lib/popular-timeslots";
import { getUniversityComparison } from "./tools-lib/university-comparison";
import { getAdvancedBookingAnalytics } from "./tools-lib/advanced-analytics";

// Export individual tools for testing or direct usage if needed
export { getBookingStats, getStudentDistribution, getPopularTimeSlots, getUniversityComparison, getAdvancedBookingAnalytics };

// Export the array for the agent
export const tools = [
  getBookingStats,
  getStudentDistribution,
  getPopularTimeSlots,
  getUniversityComparison,
  getAdvancedBookingAnalytics
];
