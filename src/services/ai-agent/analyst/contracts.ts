export type ChartType = "bar" | "line" | "pie";

export interface AnalystIntent {
  tool: "getBookingStats" | "getStudentDistribution" | "getPopularTimeSlots" | "getUniversityComparison" | "getAdvancedBookingAnalytics";
  args: Record<string, any>;
  view: {
    preferredChart?: ChartType;
    titleHint?: string;
  };
  thought: string;
}

export interface AnalystResponse {
  type: "chart" | "suggestions" | "text"; // easy discriminator
  title: string;
  description?: string;
  chart?: {
    type: ChartType;
    xKey?: string;
    yKey?: string; // for single series bar/line
    dataKey?: string; // used for pie value
    nameKey?: string; // used for pie label (name)
    seriesKey?: string; // for multi-series (e.g. stack by status)
  };
  data: Record<string, any>[];
  summary?: {
    bullets: string[];
  };
  suggestions?: string[]; // for ambiguous queries
  reply?: string; // plain text fallback
}
