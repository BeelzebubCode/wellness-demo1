// prisma/seed-utils/timezone.ts

// UTC+7 offset in minutes
const TH_OFFSET_MINUTES = 7 * 60;

/**
 * Returns a Date object representing the given time in Thailand (UTC+7).
 * The resulting Date object, when printed in ISO format (UTC), will reflect the
 * correct instant in time.
 * 
 * Example: toThaiDate(new Date('2024-01-01'), 8, 0)
 * -> 2024-01-01 08:00:00 TH
 * -> 2024-01-01 01:00:00 UTC
 */
export function toThaiDate(baseDate: Date, hour: number, minute: number = 0): Date {
  // Create a clone to avoid mutating the original
  const d = new Date(baseDate);
  
  // Set to the desired "face value" time in UTC
  // e.g. if we want 08:00 TH, we first set 08:00 UTC
  d.setUTCHours(hour, minute, 0, 0);

  // Then subtract 7 hours to get the actual UTC instant
  // 08:00 UTC - 7 hours = 01:00 UTC = 08:00 TH
  d.setMinutes(d.getMinutes() - TH_OFFSET_MINUTES);

  return d;
}

/**
 * Helper to get the current time in Thailand as a Date object.
 * (Adjusts system time to be "as if" it were in TH timezone relative to UTC)
 */
export function getThaiNow(): Date {
    const now = new Date();
    return new Date(now.getTime() + (TH_OFFSET_MINUTES * 60 * 1000));
}
