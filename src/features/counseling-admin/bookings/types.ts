// src/features/counseling-admin/bookings/types.ts
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
};

export type AssigneeOption = { id: number; name: string };

export type AdminBookingStatusFilter = BookingStatus | "ALL";
export type { BookingStatus };
