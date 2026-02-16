
// src/lib/constants/booking-service.ts

export const OnlineChannelCode = {
  LINE_CALL: "LINE_CALL",
  GOOGLE_MEET: "GOOGLE_MEET",
  ZOOM: "ZOOM",
  MICROSOFT_TEAMS: "MICROSOFT_TEAMS",
  PHONE: "PHONE",
  OTHER: "OTHER",
} as const;

export type OnlineChannelCode = (typeof OnlineChannelCode)[keyof typeof OnlineChannelCode];

/**
 * ช่องทางที่ "อนุญาตให้เลือก" ในหน้า Booking
 */
export const PICKABLE_ONLINE_CHANNELS = [
  OnlineChannelCode.LINE_CALL,
  OnlineChannelCode.GOOGLE_MEET,
  OnlineChannelCode.ZOOM,
  OnlineChannelCode.MICROSOFT_TEAMS,
  OnlineChannelCode.PHONE,
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
export const ONLINE_CHANNEL_META: Record<PickableOnlineChannel, OnlineChannelMeta> = {
  [OnlineChannelCode.LINE_CALL]: {
    label: "LINE Call",
    shortLabel: "LINE",
    iconKey: OnlineChannelIconKeyEnum.line,
  },
  [OnlineChannelCode.GOOGLE_MEET]: {
    label: "Google Meet",
    shortLabel: "Meet",
    iconKey: OnlineChannelIconKeyEnum.meet,
  },
  [OnlineChannelCode.ZOOM]: {
    label: "Zoom",
    iconKey: OnlineChannelIconKeyEnum.zoom,
  },
  [OnlineChannelCode.MICROSOFT_TEAMS]: {
    label: "Microsoft Teams",
    shortLabel: "Teams",
    iconKey: OnlineChannelIconKeyEnum.teams,
  },
  [OnlineChannelCode.PHONE]: {
    label: "Phone Call",
    shortLabel: "Phone",
    iconKey: OnlineChannelIconKeyEnum.phone,
  },
};
