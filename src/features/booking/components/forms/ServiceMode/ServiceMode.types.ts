// src/features/booking/components/forms/ServiceMode/ServiceMode.types.ts

import type { ServiceMode } from "@/shared/types/service";
import type { OnlineChannelCode } from "@/lib/constants/booking-service";

export type ServicePick = {
  mode: ServiceMode;
  onlineChannelCode?: OnlineChannelCode | null;
};
