// src/lib/constants/app.ts
export const APP_CONFIG = {
  name: "NU Wellness Center",
  shortName: "NUW",
  description: "ระบบจองคิวให้คำปรึกษาสุขภาพจิต",
  maxAdvanceBookingDays: 60,
  maxActiveBookingsPerUser: 1,
  lineChannelId: process.env.NEXT_PUBLIC_LINE_CHANNEL_ID ?? "",
  liffId: process.env.NEXT_PUBLIC_LIFF_ID ?? "",
} as const;
