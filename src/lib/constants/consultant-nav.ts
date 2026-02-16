// lib/constants/consultant-nav.ts
import { CalendarCheck, ClipboardList, UserCircle, History, Briefcase, Calendar } from 'lucide-react';
import type { NavItem } from '@/components/layout/sidebar/types';

export const CONSULTANT_NAV: NavItem[] = [
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
    href: '/consultant/borrowed-work',
    label: 'งานจากมหาลัยอื่น',
    icon: Briefcase,
  },
  {
    href: '/consultant/shifts',
    label: 'ตารางเวร',
    icon: Calendar,
  },
  {
    href: '/consultant/history',
    label: 'ประวัติการให้คำปรึกษา',
    icon: History,
  },
  {
    href: '/consultant/profile',
    label: 'โปรไฟล์',
    icon: UserCircle,
  },
];