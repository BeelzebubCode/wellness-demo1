// src/features/booking/components/forms/ServiceMode/ServiceModeIcons.tsx

import React from "react";
import { Phone } from "lucide-react";
import { SiLine, SiGooglemeet, SiZoom } from "react-icons/si";
import { BsMicrosoftTeams } from "react-icons/bs";
import type { OnlineChannelIconKey } from "@/lib/constants/booking-service";

const BRAND_COLOR: Record<OnlineChannelIconKey, string> = {
  line: "#06C755",
  meet: "#00897B",
  zoom: "#2D8CFF",
  teams: "#6264A7",
  phone: "#64748B",
};

const SIZE_CLASS: Record<OnlineChannelIconKey, string> = {
  line: "h-6 w-6",
  meet: "h-5 w-5",
  zoom: "h-9 w-9", // ✅ Zoom ใหญ่
  teams: "h-5 w-5",
  phone: "h-5 w-5",
};

export function ChannelIcon({
  iconKey,
  disabled,
}: {
  iconKey: OnlineChannelIconKey;
  disabled?: boolean;
}) {
  const color = disabled ? "#CBD5E1" : BRAND_COLOR[iconKey];
  const size = SIZE_CLASS[iconKey];

  switch (iconKey) {
    case "line":
      return <SiLine className={size} style={{ color }} />;
    case "meet":
      return <SiGooglemeet className={size} style={{ color }} />;
    case "zoom":
      return <SiZoom className={size} style={{ color }} />;
    case "teams":
      return <BsMicrosoftTeams className={size} style={{ color }} />;
    case "phone":
      return <Phone className={size} style={{ color }} />;
  }
}
