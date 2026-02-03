"use client";

import type { OnlineChannel, ServiceMode, TimeSlotService } from "../../types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

function labelForMode(mode: ServiceMode) {
  return mode === "ONLINE" ? "ออนไลน์" : "ออนไซต์";
}

function labelForChannel(ch?: OnlineChannel | null) {
  if (!ch) return "";
  switch (ch) {
    case "LINE_CALL":
      return "LINE Call";
    case "GOOGLE_MEET":
      return "Google Meet";
    case "ZOOM":
      return "Zoom";
    case "MICROSOFT_TEAMS":
      return "Microsoft Teams";
    case "PHONE":
      return "โทรศัพท์";
    default:
      return "อื่น ๆ";
  }
}

export function ServiceModePicker({
  services,
  value,
  onChange,
}: {
  services?: TimeSlotService[];
  value: { mode: ServiceMode; timeSlotServiceId?: number | null; onlineChannel?: OnlineChannel | null };
  onChange: (v: { mode: ServiceMode; timeSlotServiceId?: number | null; onlineChannel?: OnlineChannel | null }) => void;
}) {
  // ถ้า backend ยังไม่ส่ง services มา → ให้เลือกโหมด 2 ปุ่ม
  if (!services || services.length === 0) {
    return (
      <Card className="p-3">
        <div className="text-sm font-semibold text-slate-800 mb-2">เลือกรูปแบบบริการ</div>
        <div className="flex gap-2">
          <Button
            variant={value.mode === "ONSITE" ? "primary" : "secondary"}
            onClick={() => onChange({ mode: "ONSITE", timeSlotServiceId: null, onlineChannel: null })}
          >
            ออนไซต์
          </Button>
          <Button
            variant={value.mode === "ONLINE" ? "primary" : "secondary"}
            onClick={() => onChange({ mode: "ONLINE", timeSlotServiceId: null, onlineChannel: "LINE_CALL" })}
          >
            ออนไลน์
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-3">
      <div className="text-sm font-semibold text-slate-800 mb-2">เลือกรูปแบบบริการ</div>
      <div className="flex flex-col gap-2">
        {services.map((s) => {
          const active = value.timeSlotServiceId === s.id;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => onChange({ mode: s.mode, timeSlotServiceId: s.id, onlineChannel: s.onlineChannel ?? null })}
              className={[
                "w-full text-left rounded-xl border px-3 py-2 transition",
                active ? "border-primary-500 bg-primary-50" : "border-slate-200 hover:bg-slate-50",
              ].join(" ")}
            >
              <div className="font-medium text-slate-800">
                {labelForMode(s.mode)} {s.mode === "ONLINE" ? `• ${labelForChannel(s.onlineChannel)}` : ""}
              </div>
              {s.title ? <div className="text-xs text-slate-500 mt-0.5">{s.title}</div> : null}
            </button>
          );
        })}
      </div>
    </Card>
  );
}
