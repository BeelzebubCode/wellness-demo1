// src/config/tenants.ts

export type TenantCode = 'DEFAULT' | 'NU' | 'CU' | 'KKU';

export type TenantConfig = {
  code: TenantCode;
  nameTh: string;
  nameEn: string;
  brandName: string;
  logo?: string;
};

export const TENANTS: Record<TenantCode, TenantConfig> = {
  DEFAULT: {
    code: 'DEFAULT',
    nameTh: 'ระบบให้คำปรึกษา',
    nameEn: 'Wellness System',
    brandName: 'Wellness System',
    logo: '/images/Brand_wellness_center1.png',
  },

  NU: {
    code: 'NU',
    nameTh: 'มหาวิทยาลัยนเรศวร',
    nameEn: 'Naresuan University',
    brandName: 'NU Wellness',
    logo: '/images/Brand_wellness_center1.png',
  },

  CU: {
    code: 'CU',
    nameTh: 'จุฬาลงกรณ์มหาวิทยาลัย',
    nameEn: 'Chulalongkorn University',
    brandName: 'Chula Wellness',
    logo: '/images/Brand_wellness_center1.png',
  },

  KKU: {
    code: 'KKU',
    nameTh: 'มหาวิทยาลัยขอนแก่น',
    nameEn: 'Khon Kaen University',
    brandName: 'KKU Wellness',
    logo: '/images/Brand_wellness_center1.png',
  },
};

export function normalizeTenant(input?: string | null): TenantCode {
  const code = (input ?? '').toUpperCase().trim();
  if (code === 'NU' || code === 'CU' || code === 'KKU') return code;
  return 'DEFAULT';
}
