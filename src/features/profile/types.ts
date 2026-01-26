// src/features/profile/types.ts

export type ProfileType =
  | "STUDENT"
  | "CONSULTANT"
  | "HEAD_CONSULTANT"
  | "RECTOR"
  | "SUPER_ADMIN";

export type StudentAddressType = "CURRENT" | "PERMANENT";

export type ProfileMeDTO = {
  role: ProfileType;
  displayName: string;
  profile: {
    type: ProfileType;
    id?: number | null;

    // common
    prefix?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    nickname?: string | null;
    email?: string | null;
    phone?: string | null;

    universityId?: number | null;
    universityName?: string | null;

    // consultant
    organizationName?: string | null;
    languages?: { code: string; fluencyLevel?: string | null }[];
    specializations?: string[];

    // =========================
    // ✅ student extras
    // =========================
    gender?: string | null;
    birthday?: string | null; // ISO string
    bloodGroup?: string | null;
    nationality?: string | null;
    religion?: string | null;

    // academic
    program?: string | null;
    degree?: string | null;
    degreeName?: string | null;
    admitAcademicYear?: number | null;

    facultyName?: string | null;
    facultyNameEn?: string | null;

    departmentName?: string | null;
    departmentNameEn?: string | null;

    advisorName?: string | null;

    // addresses
    addresses?: {
      type: StudentAddressType;
      detail: string | null;
      subDistrict: string | null;
      district: string | null;
      provinceName: string | null;
      postalCode: string | null;
    }[];
  };
};

export type ProfileInclude = {
  languages?: boolean;
  specializations?: boolean;
  organization?: boolean;
  university?: boolean;

  // ✅ student include flags
  academic?: boolean;
  addresses?: boolean;
};

// (optional) helper: ทำ query string include ให้สวยๆ
export function buildProfileIncludeQuery(inc?: ProfileInclude) {
  if (!inc) return "";
  const keys = Object.entries(inc)
    .filter(([, v]) => !!v)
    .map(([k]) => k);
  return keys.length ? `?include=${keys.join(",")}` : "";
}
