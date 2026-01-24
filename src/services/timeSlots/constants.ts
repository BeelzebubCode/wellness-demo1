// src/services/timeSlots/constants.ts
export const BKK_TZ = "Asia/Bangkok";
export const BKK_OFFSET = "+07:00";

// roles
export const TIME_SLOT_VIEW_ROLES = [
  "STUDENT",
  "CONSULTANT",
  "HEAD_CONSULTANT",
  "ADMIN",
  "SUPER_ADMIN",
  "RECTOR",
] as const;

export const TIME_SLOT_STAFF_ROLES = [
  "HEAD_CONSULTANT",
  "ADMIN",
  "SUPER_ADMIN",
  "RECTOR",
] as const;

export const ACTIVE_BOOKING_STATUSES = [
  "PENDING_ASSIGNMENT",
  "ASSIGNED",
  "IN_PROGRESS",
] as const;

export type UnavailableReason = "PAST_TIME" | "FULL" | "CLOSED" | "UNAVAILABLE";
