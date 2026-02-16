// src/shared/types/service.ts

export const ServiceModeEnum = {
  ONSITE: "ONSITE",
  ONLINE: "ONLINE",
} as const;
export type ServiceMode = (typeof ServiceModeEnum)[keyof typeof ServiceModeEnum];


export interface OnlineChannelCategory {
  id: number;
  code: string;
  nameTh: string;
  nameEn: string | null;
}

// Compat alias if needed, or just remove
export type OnlineChannel = OnlineChannelCategory;
