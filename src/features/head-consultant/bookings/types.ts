// src/features/head-consultant/bookings/types.ts
import type {
  BookingCore,
  BookingStatus,
  BookingOutcomeCore,
  BookingCancellationCore,
} from "@/shared/types/booking";

export type AdminBookingRow = BookingCore & {
  userName: string;
  lineUserId: string;

  problemType: string;
  problemCategoryCode?: string;
  problemDescription?: string | null;

  student: {
    id: number;
    username: string;
    name?: string | null;
    faculty?: string | null;
    department?: string | null;
  };

  consultant?: { id: number | null; name: string } | null;

  outcome?: BookingOutcomeCore | null;
  cancellation?: BookingCancellationCore | null;

  createdAt: string;
  assignments?: Array<{
    assignedAt: string;
    isAutoAssigned: boolean;
    isActive: boolean;
    note: string | null;
    assignedBy: { name: string; username: string } | null;
    consultant: { name: string } | null;
  }>;
};

export interface AssigneeOption {
  id: number;
  name: string;
  borrowAssignmentId?: number;
  borrowWindow?: { start: string; end: string } | null;
  activeBookings?: number;
  feedbackCount?: number;
  avgRating?: number | null;
  accountRole?: string | null;
  specializations?: string[];
  busySlots?: { start: string; end: string }[];
};

export type AdminBookingStatusFilter = BookingStatus | "ALL";
export type AdminAssignmentMethodFilter = "ALL" | "MANUAL" | "AUTO";
export type { BookingStatus };
