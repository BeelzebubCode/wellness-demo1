// src/features/booking/components/forms/ServiceMode/ServiceMode.types.ts

import type { ServiceMode } from "@/shared/types/service";

export type ServicePick = {
  mode: ServiceMode;
  onlineChannelCode?: string | null;
};
