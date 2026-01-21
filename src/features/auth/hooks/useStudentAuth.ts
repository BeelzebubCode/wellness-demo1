// src/features/auth/hooks/useStudentAuth.ts
"use client";

import type { AuthUser } from "../types";
import { useRoleAuth } from "./useRoleAuth";

type StudentUser = AuthUser & { role: "STUDENT" };

export function useStudentAuth(redirectTo = "/login") {
  return useRoleAuth<StudentUser>({
    redirectTo,
    allowedRoles: ["STUDENT"],
    loginToastKey: "toast_login_required_student",
  });
}
