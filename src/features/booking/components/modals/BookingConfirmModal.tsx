// src/features/booking/components/modals/BookingConfirmModal.tsx
"use client";

import { useMemo, useState } from "react";

import type { TimeSlotCore } from "@/shared/types/timeSlot";
import type { OnlineChannel, ServiceMode } from "@/shared/types/service";

import { Modal, Button } from "@/components/ui";
import { AlertBox } from "@/components/notification/AlertBox";

import {
  BookingForm,
  type BookingFormData,
} from "@/features/booking/components/forms/BookingForm";
import { ServiceModePicker } from "@/features/booking/components/forms/ServiceMode";

import { ConsentBlock } from "@/features/booking/components/forms/ConsentBlock";
import { SignaturePad } from "@/features/booking/components/forms/SignaturePad";

type ServicePick = {
  mode: ServiceMode;
  onlineChannel?: OnlineChannel | null;
};

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
  slot: TimeSlotCore | null;
  onSubmit: (payload: {
    timeSlotId: number;
    problemCategoryId: number;
    bookingDetailText: string;
    serviceMode: ServiceMode;
    onlineChannel?: OnlineChannel | null;
    consentChecked: boolean;
    consentSignatureDataUrl?: string | null;
  }) => Promise<void> | void;
  isLoading?: boolean;
  error?: string | null;
}) {
  const [service, setService] = useState<ServicePick>({
    mode: "ONSITE",
    onlineChannel: null,
  });

  const [consentChecked, setConsentChecked] = useState(false);
  const [consentSignature, setConsentSignature] = useState<string | null>(null);

  const [form, setForm] = useState<BookingFormData>({
    problemCategoryId: 0,
    problemTypeOther: "",
    problemDescription: "",
  });

  const needsOnlineChannel = service.mode === "ONLINE";
  const needsSignature = service.mode === "ONLINE";

  const formOk =
    !!form.problemCategoryId &&
    form.problemCategoryId > 0 &&
    !!form.problemDescription?.trim() &&
    (!isOther(form) ? true : !!form.problemTypeOther?.trim());

  const canSubmit = useMemo(() => {
    if (!slot) return false;
    if (!consentChecked) return false;
    if (needsOnlineChannel && !service.onlineChannel) return false;
    if (needsSignature && !consentSignature) return false;
    if (!formOk) return false;
    return true;
  }, [
    slot,
    consentChecked,
    needsOnlineChannel,
    service.onlineChannel,
    needsSignature,
    consentSignature,
    formOk,
  ]);

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title="ยืนยันการจอง"
      size="full"
      className="max-w-[1024px] w-[calc(100vw-24px)]"
      contentClassName="p-0 pt-3"
    >

      {!slot ? (
        <div className="p-8 text-center text-sm text-slate-500">
          ยังไม่ได้เลือกช่วงเวลา
        </div>
      ) : (
        <div className="flex flex-col overflow-hidden" style={{ maxHeight: "calc(90vh - 80px)" }}>
          {/* BODY */}
          <div className="flex-1 overflow-auto p-4 md:p-5 custom-scroll">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
              {/* LEFT: Booking Form */}
              <div className="rounded-[2rem] border border-gray-100 bg-white p-5 md:p-6 shadow-sm flex flex-col flex-1">
                <BookingForm
                  value={form}
                  onChange={setForm}
                  hideSubmit
                  isLoading={!!isLoading}
                  error={null}
                />
              </div>

              {/* RIGHT: Service Mode & Consent */}
              <div className="rounded-[2rem] border border-gray-100 bg-white p-5 md:p-6 shadow-sm flex flex-col flex-1">
                <div className="flex-1 flex flex-col space-y-6">
                  {/* Service mode */}
                  <div className="space-y-4">
                    <label className="text-sm font-black text-slate-800 flex items-center gap-1 tracking-tight">
                      ประเภทการเข้าพบ <span className="text-red-500">*</span>
                    </label>
                    <ServiceModePicker
                      value={service}
                      onChange={(next) => {
                        setService(next);
                        if (next.mode !== "ONLINE") {
                          setConsentSignature(null);
                        }
                      }}
                    />

                    {needsOnlineChannel && !service.onlineChannel && (
                      <AlertBox
                        type="warning"
                        message="กรุณาเลือกช่องทางออนไลน์ก่อนทำการจอง"
                      />
                    )}
                  </div>

                  {/* Consent */}
                  <div className="space-y-4">
                    <ConsentBlock
                      checked={consentChecked}
                      onChange={setConsentChecked}
                    />
                    {!consentChecked && (
                      <AlertBox
                        type="warning"
                        message="กรุณายอมรับเงื่อนไขก่อนทำการจอง"
                      />
                    )}
                  </div>

                  {/* Signature Pad for Online */}
                  {service.mode === "ONLINE" && (
                    <div className="space-y-4">
                      <SignaturePad
                        value={consentSignature}
                        onChange={setConsentSignature}
                        disabled={!!isLoading}
                      />
                      {!consentSignature && (
                        <AlertBox
                          type="warning"
                          message="กรุณาเซ็นลายเซ็นยินยอมก่อนทำการจองออนไลน์"
                        />
                      )}
                    </div>
                  )}

                  {error && <AlertBox type="error" message={error} />}
                </div>
              </div>
            </div>
          </div>

          {/* FOOTER */}
          <div className="shrink-0 px-5 pt-6 pb-3 border-t border-gray-100 bg-white rounded-b-2xl flex flex-col items-center">
            <Button
              type="button"
              variant="primary"
              size="md"
              className="w-full text-base font-black shadow-xl shadow-primary-500/20 py-4 h-auto min-h-[56px] flex items-center justify-center"
              isLoading={!!isLoading}
              disabled={!canSubmit || !!isLoading}
              onClick={async () => {
                if (!slot || !canSubmit) return;

                await onSubmit({
                  timeSlotId: slot.id,
                  problemCategoryId: Number(form.problemCategoryId),
                  bookingDetailText: form.problemDescription,
                  serviceMode: service.mode,
                  onlineChannel: needsOnlineChannel
                    ? service.onlineChannel ?? null
                    : null,
                  consentChecked,
                  consentSignatureDataUrl:
                    service.mode === "ONLINE" ? consentSignature : null,
                });
              }}
            >
              <span className="leading-none">ยืนยันการจอง</span>
            </Button>

            <p className="mt-2 text-[12px] text-gray-400 text-center leading-relaxed">
              กรุณาตรวจสอบข้อมูล เลือกประเภทการเข้าพบ และยอมรับเงื่อนไขให้ครบถ้วนก่อนทำการจอง
            </p>
          </div>
        </div>
      )}
    </Modal>
  );
}

function isOther(form: BookingFormData) {
  return !!form.problemTypeOther?.trim();
}
