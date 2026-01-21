// src/config/tenants.ts
export type TenantCode = 'DEFAULT' | 'NU' | 'CU' | 'KKU';

export type TenantConfig = {
  code: TenantCode;
  nameTh: string;
  nameEn: string;
  logo?: string; // optional
};

export const TENANTS: Record<TenantCode, TenantConfig> = {
  DEFAULT: {
    code: 'DEFAULT',
    nameTh: 'ระบบให้คำปรึกษา',
    nameEn: 'Wellness System',
    logo: '/logos/default.png',
  },
  NU: {
    code: 'NU',
    nameTh: 'มหาวิทยาลัยนเรศวร',
    nameEn: 'Naresuan University',
    logo: '/logos/nu.png',
  },
  CU: {
    code: 'CU',
    nameTh: 'จุฬาลงกรณ์มหาวิทยาลัย',
    nameEn: 'Chulalongkorn University',
    logo: '/logos/cu.png',
  },
  KKU: {
    code: 'KKU',
    nameTh: 'มหาวิทยาลัยขอนแก่น',
    nameEn: 'Khon Kaen University',
    logo: '/logos/kku.png',
  },
};

export function normalizeTenant(input?: string | null): TenantCode {
  const code = (input ?? '').toUpperCase().trim();
  if (code === 'NU' || code === 'CU' || code === 'KKU') return code;
  return 'DEFAULT';
}
