// src/features/booking/components/modals/BookingConfirmModal.tsx
"use client";

import { useMemo, useState } from "react";

import type { TimeSlotCore } from "@/shared/types/timeSlot";
import type { ServiceMode } from "@/shared/types/service";
import type { OnlineChannelCode } from "@/lib/constants/booking-service";

import { Modal, Button } from "@/components/ui";
import { AlertBox } from "@/components/notification/AlertBox";
import { cn } from "@/lib/cn";

import {
  BookingForm,
  type BookingFormData,
} from "@/features/booking/components/forms/BookingForm";
import { ServiceModePicker } from "@/features/booking/components/forms/ServiceMode";

import { ConsentBlock } from "@/features/booking/components/forms/ConsentBlock";
import { SignaturePad } from "@/features/booking/components/forms/SignaturePad";

type ServicePick = {
  mode: ServiceMode;
  onlineChannelCode?: OnlineChannelCode | null;
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
    onlineChannelCode?: OnlineChannelCode | null;
    consentChecked: boolean;
    agreementSignatureDataUrl?: string | null;
  }) => Promise<void> | void;
  isLoading?: boolean;
  error?: string | null;
}) {
  const [service, setService] = useState<ServicePick>({
    mode: "ONSITE",
  });

  const [consentChecked, setConsentChecked] = useState(false);
  const [agreementSignature, setAgreementSignature] = useState<string | null>(null);

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
    if (needsOnlineChannel && !service.onlineChannelCode) return false;
    if (needsSignature && !agreementSignature) return false;
    if (!formOk) return false;
    return true;
  }, [
    slot,
    consentChecked,
    needsOnlineChannel,
    service.onlineChannelCode,
    needsSignature,
    agreementSignature,
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
            <div className="flex flex-col gap-y-4">
              {/* TOP: Service Mode Picker */}
              <div className="rounded-[2rem] border border-gray-100 bg-white p-5 md:p-6 shadow-sm">
                <div className="max-w-lg mx-auto w-full">
                  <label className="text-sm font-black text-slate-800 flex items-center justify-center gap-1 tracking-tight mb-3">
                    ประเภทการเข้าพบ <span className="text-red-500">*</span>
                  </label>
                  <ServiceModePicker
                    value={service}
                    onChange={(next) => {
                      setService(next);
                      if (next.mode !== "ONLINE") {
                        setAgreementSignature(null);
                      }
                    }}
                  />
                  {needsOnlineChannel && !service.onlineChannelCode && (
                    <div className="mt-3">
                      <AlertBox type="warning" message="กรุณาเลือกช่องทางออนไลน์ก่อนทำการจอง" />
                    </div>
                  )}
                </div>
              </div>

              {/* GRID AREA */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-2 gap-y-4 lg:gap-y-0 items-stretch">
                {/* ROW 0, COL 0: Categories (Left Top) */}
                <div className="rounded-t-[2rem] lg:rounded-b-none border border-gray-100 bg-white p-5 md:p-6 lg:pb-5 lg:border-b-0 shadow-sm">
                  <div className="h-full flex flex-col">
                    <BookingForm
                      value={form}
                      onChange={setForm}
                      hideSubmit
                      isLoading={!!isLoading}
                      error={null}
                      mode="categories"
                    />
                  </div>
                </div>

                {/* ROW 0, COL 1: Consent (Right Top) */}
                <div className="rounded-t-[2rem] lg:rounded-b-none border border-gray-100 bg-white p-5 md:p-6 lg:pb-5 lg:border-b-0 shadow-sm">
                  <div className="h-full flex flex-col">
                    <div className="flex-1">
                      <ConsentBlock
                        checked={consentChecked}
                        onChange={setConsentChecked}
                        className="h-full"
                      />
                    </div>
                    {!consentChecked && (
                      <div className="mt-3">
                        <AlertBox type="warning" message="กรุณายอมรับเงื่อนไขก่อนทำการจอง" />
                      </div>
                    )}
                  </div>
                </div>

                {/* ROW 1, COL 0: Description (Left Bottom) */}
                <div className="rounded-b-[2rem] lg:rounded-t-none border border-gray-100 bg-white p-5 md:p-6 lg:pt-4 lg:border-t-0 shadow-sm flex flex-col">
                  <div className="min-h-[300px] flex flex-col">
                    <BookingForm
                      value={form}
                      onChange={setForm}
                      hideSubmit
                      isLoading={!!isLoading}
                      error={null}
                      mode="description"
                    />
                  </div>
                </div>

                {/* ROW 1, COL 1: Signature/Onsite (Right Bottom) */}
                <div className="rounded-b-[2rem] lg:rounded-t-none border border-gray-100 bg-white p-5 md:p-6 lg:pt-4 lg:border-t-0 shadow-sm flex flex-col">
                  <div className="min-h-[300px] flex flex-col">
                    {service.mode === "ONLINE" ? (
                      <div className="flex-1 flex flex-col space-y-3">
                        <SignaturePad
                          value={agreementSignature}
                          onChange={setAgreementSignature}
                          disabled={!!isLoading}
                          warning={!agreementSignature && (
                            <AlertBox type="warning" message="กรุณาเซ็นยินยอมการจองออนไลน์" />
                          )}
                        />
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col">
                        <div className="flex-1 flex items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 text-slate-400 text-sm min-h-[220px]">
                          ไม่ต้องเซ็นชื่อสำหรับการเข้าพบที่ศูนย์
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {error && <div className="mt-4 px-4"><AlertBox type="error" message={error} /></div>}
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
                  onlineChannelCode: needsOnlineChannel
                    ? service.onlineChannelCode ?? null
                    : null,
                  consentChecked,
                  agreementSignatureDataUrl:
                    service.mode === "ONLINE" ? agreementSignature : null,
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
