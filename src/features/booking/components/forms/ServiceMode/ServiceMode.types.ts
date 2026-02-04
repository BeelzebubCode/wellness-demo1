// src/features/booking/components/forms/ServiceMode/ServiceMode.types.ts

import type { OnlineChannel, ServiceMode } from "@/shared/types/service";

export type ServicePick = {
  mode: ServiceMode;
  onlineChannel?: OnlineChannel | null;
};
