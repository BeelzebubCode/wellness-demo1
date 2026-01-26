// src/features/counseling-admin-bookings/type.ts
import type {
  BookingStatus,
  BookingCore,
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

// อันนี้จริง ๆ เป็น shared ก็ได้ แต่จะวางที่ feature ก็ไม่ผิด
export type AssigneeOption = { id: number; name: string };

// re-export ถ้าจะให้ที่อื่น import สะดวก
export type { BookingStatus };
