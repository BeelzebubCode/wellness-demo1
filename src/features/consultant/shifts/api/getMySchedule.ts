// src/features/consultant/shifts/api/getMySchedule.ts

import type { MyScheduleResponse } from "../types";

export async function getMySchedule(): Promise<MyScheduleResponse> {
  try {
    const res = await fetch("/api/v2/consultants/me/shifts/my-schedule", {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      const errorData = await res.json();
      return {
        success: false,
        error: errorData.error || "Failed to fetch schedule",
      };
    }

    const data = await res.json();
    return data;
  } catch (error) {
    console.error("[GET_MY_SCHEDULE_ERROR]", error);
    return {
      success: false,
      error: "Network error",
    };
  }
}
