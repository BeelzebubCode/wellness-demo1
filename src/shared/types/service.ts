// src/shared/types/service.ts

export const ServiceModeEnum = {
  ONSITE: "ONSITE",
  ONLINE: "ONLINE",
} as const;
export type ServiceMode = (typeof ServiceModeEnum)[keyof typeof ServiceModeEnum];

export const OnlineChannelEnum = {
  LINE_CALL: "LINE_CALL",
  GOOGLE_MEET: "GOOGLE_MEET",
  ZOOM: "ZOOM",
  MICROSOFT_TEAMS: "MICROSOFT_TEAMS",
  PHONE: "PHONE",
  OTHER: "OTHER",
} as const;
export type OnlineChannel = (typeof OnlineChannelEnum)[keyof typeof OnlineChannelEnum];
