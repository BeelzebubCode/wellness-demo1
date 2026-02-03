"use client";

import { useMemo, useState } from "react";
import type { BookingFormValues, TimeSlot } from "../../types";
import type { OnlineChannel, ServiceMode } from "../../types";
import { Modal } from "@/components/ui/Modal";
import { AlertBox } from "@/components/notification/AlertBox";
import { BookingForm } from "../forms/BookingForm";
import { ServiceModePicker } from "../forms/ServiceModePicker";
import { ConsentBlock } from "../forms/ConsentBlock";

export function BookingConfirmModal({
  open,
  onClose,
  slot,
  onSubmit,
  isLoading,
  error,
}: {
  open: boolean;
  onClose: () => void;
  slot: TimeSlot | null;
  onSubmit: (payload: {
    timeSlotId: number;
    problemCategoryId: number;
    bookingDetailText: string;
    serviceMode: ServiceMode;
    onlineChannel?: OnlineChannel | null;
    timeSlotServiceId?: number | null;
    consentChecked: boolean;
  }) => Promise<void> | void;
  isLoading?: boolean;
  error?: string | null;
}) {
  const [service, setService] = useState<{ mode: ServiceMode; timeSlotServiceId?: number | null; onlineChannel?: OnlineChannel | null }>({
    mode: "ONSITE",
    timeSlotServiceId: null,
    onlineChannel: null,
  });
  const [consentChecked, setConsentChecked] = useState(false);

  const canSubmit = useMemo(() => !!slot && consentChecked, [slot, consentChecked]);

  return (
    <Modal open={open} onClose={onClose} title="ยืนยันการจอง">
      {!slot ? (
        <div className="text-sm text-slate-600">ยังไม่ได้เลือกช่วงเวลา</div>
      ) : (
        <div className="flex flex-col gap-3">
          {/* ✅ เพิ่ม: เลือก ONLINE/ONSITE ตอนกดเลือก */}
          <ServiceModePicker
            services={slot.services}
            value={service}
            onChange={(v) => setService(v)}
          />

          {/* ✅ เพิ่ม: consent */}
          <ConsentBlock checked={consentChecked} onChange={setConsentChecked} />

          {!consentChecked ? (
            <AlertBox type="warning" message="กรุณายอมรับเงื่อนไขก่อนทำการจอง" />
          ) : null}

          {error ? <AlertBox type="error" message={error} /> : null}

          <BookingForm
            isLoading={!!isLoading}
            error={error ?? undefined}
            onSubmit={async (v: BookingFormValues) => {
              if (!slot) return;
              if (!consentChecked) return;

              await onSubmit({
                timeSlotId: slot.time_slot_id,
                problemCategoryId: Number(v.problemCategoryId),
                bookingDetailText: v.problemDescription,
                serviceMode: service.mode,
                onlineChannel: service.onlineChannel ?? null,
                timeSlotServiceId: service.timeSlotServiceId ?? null,
                consentChecked,
              });
            }}
            disableSubmit={!canSubmit || !!isLoading}
          />
        </div>
      )}
    </Modal>
  );
}
