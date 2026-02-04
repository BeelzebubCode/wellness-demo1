// src/features/booking/components/my-appointments/MyAppointmentCard.tsx

"use client";

import type { MyBookingDto } from "@/features/booking/types";
import { MyAppointmentCardLegacyView, type LegacyAppointmentView } from "./MyAppointmentCardLegacyView";

function toLegacyView(b: MyBookingDto): LegacyAppointmentView {
  const start = b.startAt ? new Date(b.startAt) : null;
  const end = b.endAt ? new Date(b.endAt) : null;

  return {
    id: b.bookingId,
    date: start ? start.toISOString().slice(0, 10) : null,
    startTime: start ? start.toTimeString().slice(0, 5) : null,
    endTime: end ? end.toTimeString().slice(0, 5) : null,
    problemType: b.problemCategoryNameTh ?? null,
  };
}

export interface MyAppointmentCardProps {
  booking: MyBookingDto;
  onCancel?: () => void;
  isCompact?: boolean;
  isExpanded?: boolean;
  onToggle?: () => void;
  onFeedback?: () => void;
}

export function MyAppointmentCard(props: MyAppointmentCardProps) {
  const view = toLegacyView(props.booking);

  return (
    <MyAppointmentCardLegacyView
      booking={props.booking}
      view={view}
      onCancel={props.onCancel}
      isCompact={props.isCompact}
      isExpanded={props.isExpanded}
      onToggle={props.onToggle}
      onFeedback={props.onFeedback}
    />
  );
}
