// lib/constants/consultant-nav.ts
import { CalendarCheck, ClipboardList, UserCircle, History } from 'lucide-react';
import type { NavItem } from '@/components/layout/sidebar/types';

export const CONSULTANT_NAV: NavItem[] = [
  {
    href: '/consultant/profile',
    label: 'โปรไฟล์',
    icon: UserCircle,
  },
  {
    href: '/consultant/my-jobs',
    label: 'งานของฉัน',
    icon: ClipboardList,
    exact: true,
  },
  {
    href: '/consultant/schedule',
    label: 'ตารางนัดหมาย',
    icon: CalendarCheck,
  },
  {
    href: '/consultant/history',
    label: 'ประวัติการให้คำปรึกษา',
    icon: History,
  },
];