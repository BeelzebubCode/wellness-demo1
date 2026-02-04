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
      className="max-w-[980px] w-[calc(100vw-24px)]"
      contentClassName="p-3 md:p-4"
    >
      {!slot ? (
        <div className="text-sm text-slate-600">ยังไม่ได้เลือกช่วงเวลา</div>
      ) : (
        <div className="flex flex-col max-h-[80vh]">
          {/* BODY */}
            <div className="flex-1 overflow-auto pr-2 custom-scroll">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
                {/* LEFT */}
                <div className="min-w-0 h-full">
                  <div className="rounded-xl border border-gray-100 bg-white p-2 h-full">
                    <BookingForm
                      value={form}
                      onChange={setForm}
                      hideSubmit
                      isLoading={!!isLoading}
                      error={null}
                    />
                  </div>
                </div>

                {/* RIGHT */}
                <div className="min-w-0 h-full">
                  <div className="rounded-xl border border-gray-100 bg-white p-2 h-full flex flex-col">
                    <div className="flex-1 space-y-4">
                      {/* Service mode */}
                      <div>
                        <div className="text-sm font-semibold text-gray-900">
                          ประเภทการจอง <span className="text-red-500">*</span>
                        </div>

                        <div className="mt-2">
                          <ServiceModePicker
                            value={service}
                            onChange={(next) => {
                              setService(next);
                              if (next.mode !== "ONLINE") {
                                setConsentSignature(null);
                              }
                            }}
                          />
                        </div>

                        {needsOnlineChannel && !service.onlineChannel ? (
                          <div className="mt-2">
                            <AlertBox
                              type="warning"
                              message="กรุณาเลือกช่องทางออนไลน์ก่อนทำการจอง"
                            />
                          </div>
                        ) : null}
                      </div>

                      {/* Consent */}
                      <div>
                        <ConsentBlock
                          checked={consentChecked}
                          onChange={setConsentChecked}
                        />

                        {!consentChecked ? (
                          <div className="mt-2">
                            <AlertBox
                              type="warning"
                              message="กรุณายอมรับเงื่อนไขก่อนทำการจอง"
                            />
                          </div>
                        ) : null}
                      </div>

                      {/* Signature */}
                      {service.mode === "ONLINE" ? (
                        <div>
                          <SignaturePad
                            value={consentSignature}
                            onChange={setConsentSignature}
                            disabled={!!isLoading}
                          />

                          {!consentSignature ? (
                            <div className="mt-2">
                              <AlertBox
                                type="warning"
                                message="กรุณาเซ็นลายเซ็นยินยอมก่อนทำการจองออนไลน์"
                              />
                            </div>
                          ) : null}
                        </div>
                      ) : null}

                      {error ? <AlertBox type="error" message={error} /> : null}
                    </div>
                  </div>
                </div>
              </div>
            </div>


          {/* FOOTER */}
          <div className="shrink-0 mt-3 pt-3 border-t border-gray-100 bg-white">
            <Button
              type="button"
              variant="primary"
              size="md"
              className="w-full bg-primary-500 hover:bg-primary-600 h-11 text-sm"
              isLoading={!!isLoading}
              disabled={!canSubmit || !!isLoading}
              onClick={async () => {
                if (!slot) return;
                if (!canSubmit) return;

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
              ยืนยันการจอง
            </Button>

            {!canSubmit ? (
              <p className="mt-2 text-xs text-gray-400 text-center">
                กรุณากรอกข้อมูลให้ครบ เลือกช่องทาง/เซ็นลายเซ็น (ถ้าออนไลน์)
                และยอมรับเงื่อนไขก่อนทำการจอง
              </p>
            ) : null}
          </div>
        </div>
      )}
    </Modal>
  );
}

function isOther(form: BookingFormData) {
  return !!form.problemTypeOther?.trim();
}
