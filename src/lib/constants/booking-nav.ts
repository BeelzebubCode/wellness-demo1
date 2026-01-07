// lib/constants/booking-nav.ts
import { CalendarPlus, CalendarCheck, History } from 'lucide-react';
import type { NavItem } from '@/components/layout/sidebar/types';

export const BOOKING_NAV: NavItem[] = [
  {
    href: '/booking',
    label: 'จองคิว',
    icon: CalendarPlus,
    exact: true,
  },
  {
    href: '/booking/my-appointments',
    label: 'ตารางนัดของฉัน',
    icon: CalendarCheck,
  },
  {
    href: '/booking/history',
    label: 'ประวัติการจอง',
    icon: History,
  },
];