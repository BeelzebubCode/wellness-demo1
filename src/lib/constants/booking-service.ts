// src/lib/constants/booking-service.ts

import { OnlineChannelEnum } from "@/shared/types/service";

/**
 * ช่องทางที่ "อนุญาตให้เลือก" ในหน้า Booking
 */
export const PICKABLE_ONLINE_CHANNELS = [
  OnlineChannelEnum.LINE_CALL,
  OnlineChannelEnum.GOOGLE_MEET,
  OnlineChannelEnum.ZOOM,
  OnlineChannelEnum.MICROSOFT_TEAMS,
  OnlineChannelEnum.PHONE,
] as const;

export type PickableOnlineChannel = (typeof PICKABLE_ONLINE_CHANNELS)[number];

/**
 * icon key ที่ UI จะ map เป็น React icon เอง
 * (อย่าใส่ ReactNode ใน constants)
 */
export const OnlineChannelIconKeyEnum = {
  line: "line",
  meet: "meet",
  zoom: "zoom",
  teams: "teams",
  phone: "phone",
} as const;

export type OnlineChannelIconKey =
  (typeof OnlineChannelIconKeyEnum)[keyof typeof OnlineChannelIconKeyEnum];

export type OnlineChannelMeta = Readonly<{
  label: string;
  shortLabel?: string;
  iconKey: OnlineChannelIconKey;
}>;

/**
 * Meta สำหรับแสดงผล
 */
export const ONLINE_CHANNEL_META = {
  [OnlineChannelEnum.LINE_CALL]: {
    label: "LINE Call",
    shortLabel: "LINE",
    iconKey: OnlineChannelIconKeyEnum.line,
  },
  [OnlineChannelEnum.GOOGLE_MEET]: {
    label: "Google Meet",
    shortLabel: "Meet",
    iconKey: OnlineChannelIconKeyEnum.meet,
  },
  [OnlineChannelEnum.ZOOM]: {
    label: "Zoom",
    iconKey: OnlineChannelIconKeyEnum.zoom,
  },
  [OnlineChannelEnum.MICROSOFT_TEAMS]: {
    label: "Microsoft Teams",
    shortLabel: "Teams",
    iconKey: OnlineChannelIconKeyEnum.teams,
  },
  [OnlineChannelEnum.PHONE]: {
    label: "Phone Call",
    shortLabel: "Phone",
    iconKey: OnlineChannelIconKeyEnum.phone,
  },
} satisfies Record<PickableOnlineChannel, OnlineChannelMeta>;
