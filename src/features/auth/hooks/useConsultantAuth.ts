// src/features/auth/hooks/useConsultantAuth.ts
"use client";

import type { AuthUser } from "../types";
import { useRoleAuth } from "./useRoleAuth";

type ConsultantUser = AuthUser & { role: "CONSULTANT" | "HEAD_CONSULTANT" };

export function useConsultantAuth(redirectTo = "/login") {
  return useRoleAuth<ConsultantUser>({
    redirectTo,
    allowedRoles: ["CONSULTANT", "HEAD_CONSULTANT"],
    loginToastKey: "toast_login_required_consultant",
  });
}
