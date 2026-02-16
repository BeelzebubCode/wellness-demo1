// src/features/booking/components/forms/ServiceMode/ServiceModePicker.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

import { ServiceModeEnum } from "@/shared/types/service";

import { Building2, Laptop } from "lucide-react";

import {
  PICKABLE_ONLINE_CHANNELS,
  ONLINE_CHANNEL_META,
  type PickableOnlineChannel,
} from "@/lib/constants/booking-service";

import type { ServicePick } from "./ServiceMode.types";
import { ChannelIcon } from "./ServiceModeIcons";

export function ServiceModePicker({
  value,
  onChange,
  disabled,
}: {
  value: ServicePick;
  onChange: (v: ServicePick) => void;
  disabled?: boolean;
}) {
  const mode = value.mode;
  const canPickChannel = mode === ServiceModeEnum.ONLINE;

  const [bubbleOpenKey, setBubbleOpenKey] =
    useState<PickableOnlineChannel | null>(null);

  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocDown(e: MouseEvent | TouchEvent) {
      const el = wrapRef.current;
      if (!el) return;
      if (el.contains(e.target as Node)) return;
      setBubbleOpenKey(null);
    }
    document.addEventListener("mousedown", onDocDown);
    document.addEventListener("touchstart", onDocDown, { passive: true });
    return () => {
      document.removeEventListener("mousedown", onDocDown);
      document.removeEventListener("touchstart", onDocDown);
    };
  }, []);

  useEffect(() => {
    if (mode !== ServiceModeEnum.ONLINE) setBubbleOpenKey(null);
  }, [mode]);

  return (
    <div className="space-y-3" ref={wrapRef}>
      <div>
        <div className="grid grid-cols-2 gap-2">
          <SegBtn
            active={mode === ServiceModeEnum.ONSITE}
            disabled={disabled}
            onClick={() =>
              onChange({ mode: ServiceModeEnum.ONSITE, onlineChannelCode: null })
            }
            icon={<Building2 className="h-5 w-5" />}
            label="On-site"
            sub="พบที่ศูนย์"
          />

          <SegBtn
            active={mode === ServiceModeEnum.ONLINE}
            disabled={disabled}
            onClick={() =>
              onChange({
                mode: ServiceModeEnum.ONLINE,
                onlineChannelCode:
                  value.onlineChannelCode ?? PICKABLE_ONLINE_CHANNELS[0], // Default to first available
              })
            }
            icon={<Laptop className="h-5 w-5" />}
            label="Online"
            sub="คุยออนไลน์"
          />
        </div>
      </div>

      {canPickChannel && (
        <div>
          <div className="text-sm text-black-700 mb-2">
            ช่องทางออนไลน์ <span className="text-red-500">*</span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {PICKABLE_ONLINE_CHANNELS.map((key) => {
              const meta = ONLINE_CHANNEL_META[key];
              const active = value.onlineChannelCode === key;
              const bubbleOpen = bubbleOpenKey === key;

              return (
                <div key={key} className="relative">
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => {
                      onChange({
                        mode: ServiceModeEnum.ONLINE,
                        onlineChannelCode: key,
                      });
                      setBubbleOpenKey(key);
                    }}
                    onMouseEnter={() => setBubbleOpenKey(key)}
                    onMouseLeave={() =>
                      setBubbleOpenKey((prev) => (prev === key ? null : prev))
                    }
                    className={cn(
                      // ⬛ compact square card
                      "w-full h-[75px] rounded-[15px] border",

                      // center icon
                      "flex items-center justify-center",

                      // animation
                      "transition-all duration-200",

                      // normal
                      !active &&
                      "bg-white border-gray-200 hover:border-primary-300 hover:shadow-sm",

                      // active
                      active &&
                      "bg-primary-50 border-primary-500 ring-2 ring-primary-200 shadow-sm",

                      // disabled
                      disabled && "opacity-50 cursor-not-allowed",
                    )}
                    aria-label={meta.label}
                  >
                    <div className="h-8 w-8 grid place-items-center">
                      <ChannelIcon iconKey={meta.iconKey} disabled={disabled} />
                    </div>
                  </button>

                  <SpeechBubble
                    show={bubbleOpen}
                    text={meta.label}
                    active={active}
                  />
                </div>
              );
            })}
          </div>



          <p className="mt-4 text-xs text-gray-500">
            เลือกช่องทางที่สะดวก ระบบจะแจ้งลิงก์/รายละเอียดภายหลัง
          </p>
        </div>
      )}
    </div>
  );
}

function SpeechBubble({
  show,
  text,
  active,
}: {
  show: boolean;
  text: string;
  active?: boolean;
}) {
  if (!show) return null;

  return (
    <div
      className={cn(
        "absolute left-1/2 -translate-x-1/2 -top-3 z-20",
        "pointer-events-none",
      )}
    >
      <div
        className={cn(
          "relative whitespace-nowrap",
          "rounded-md border bg-white px-2 py-1 text-xs font-medium shadow-sm",
          active
            ? "border-primary-200 text-primary-700"
            : "border-gray-300 text-gray-700",
        )}
      >
        {text}
        <span
          className={cn(
            "absolute left-1/2 -translate-x-1/2 -bottom-[6px]",
            "h-0 w-0",
            "border-l-[7px] border-l-transparent",
            "border-r-[7px] border-r-transparent",
            active
              ? "border-t-[7px] border-t-primary-200"
              : "border-t-[7px] border-t-gray-300",
          )}
        />
        <span
          className={cn(
            "absolute left-1/2 -translate-x-1/2 -bottom-[5px]",
            "h-0 w-0",
            "border-l-[6px] border-l-transparent",
            "border-r-[6px] border-r-transparent",
            "border-t-[6px] border-t-white",
          )}
        />
      </div>
    </div>
  );
}

function SegBtn({
  active,
  disabled,
  onClick,
  icon,
  label,
  sub,
}: {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  sub: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "min-w-0 rounded-2xl border-2 p-3 text-left transition-all",
        active
          ? "border-primary-500 bg-primary-50 text-primary-800 shadow-sm"
          : "border-gray-200 bg-white text-gray-800 hover:border-primary-200 hover:bg-primary-50/40",
        disabled && "opacity-60 cursor-not-allowed",
      )}
    >
      <div className="flex items-center gap-2 min-w-0">
        <div
          className={cn(
            "h-9 w-9 rounded-xl grid place-items-center",
            active ? "bg-white" : "bg-gray-50",
          )}
        >
          {icon}
        </div>

        <div className="min-w-0">
          <div className="font-semibold leading-tight truncate">{label}</div>
          <div
            className={cn(
              "text-xs truncate",
              active ? "text-primary-700" : "text-gray-500",
            )}
          >
            {sub}
          </div>
        </div>
      </div>
    </button>
  );
}
