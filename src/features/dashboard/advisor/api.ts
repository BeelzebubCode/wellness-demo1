// features/dashboard/advisor/api.ts
import { AdvisorStats, AdvisorStudent } from "./types";

// Mock Data
const MOCK_STATS: AdvisorStats = {
  totalStudents: 24,
  appointmentsToday: 2,
  highRiskCount: 1,
};

const MOCK_STUDENTS: AdvisorStudent[] = [
  {
    id: "64010001",
    name: "นายสมชาย ใจดี",
    firstName: "สมชาย",
    lastName: "ใจดี",
    riskLevel: "NORMAL",
    lastAppointment: new Date("2024-10-20"),
    status: "ปกติ",
  },
  {
    id: "64010002",
    name: "นางสาวสมหญิง รักเรียน",
    firstName: "สมหญิง",
    lastName: "รักเรียน",
    riskLevel: "WATCH",
    lastAppointment: new Date("2024-11-15"),
    status: "เฝ้าระวัง",
  },
  {
    id: "64010003",
    name: "นายจริงจัง ตั้งใจ",
    firstName: "จริงจัง",
    lastName: "ตั้งใจ",
    riskLevel: "HIGH_RISK",
    lastAppointment: new Date("2024-12-01"),
    status: "เสี่ยงสูง",
  },
];

export const getAdvisorStats = async (): Promise<AdvisorStats> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500));
  return MOCK_STATS;
};

export const getMyStudents = async (): Promise<AdvisorStudent[]> => {
  await new Promise((resolve) => setTimeout(resolve, 600));
  return MOCK_STUDENTS;
};
