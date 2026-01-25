// src/shared/types/profile.ts

export type ProfileType =
  | "STUDENT"
  | "CONSULTANT"
  | "HEAD_CONSULTANT"
  | "RECTOR"
  | "SUPER_ADMIN";

export type ProfileMeDTO = {
  role: ProfileType;
  displayName: string;

  profile: {
    type: ProfileType;

    // ✅ optional เพื่อรองรับหลาย role (dynamic)
    id?: number | null;

    // common fields (optional)
    prefix?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    nickname?: string | null;
    email?: string | null;
    phone?: string | null;

    // extra (optional)
    universityId?: number | null;
    organizationName?: string | null;
  };
};
