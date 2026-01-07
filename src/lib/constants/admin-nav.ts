// lib/constants/admin-nav.ts
import { CalendarDays, Clock, Database, BookCheck } from 'lucide-react';
import type { NavItem } from '@/components/layout/sidebar/types';

export const ADMIN_NAV: NavItem[] = [
  {
    href: '/admin/bookings',
    label: 'จัดการการจอง',
    icon: CalendarDays,
  },
  {
    href: '/admin/schedule',
    label: 'จัดการตารางเวลา',
    icon: Clock,
  },
  {
    href: '/admin/data-center',
    label: 'ศูนย์ข้อมูล',
    icon: Database,
  },
  {
    href: '/admin/my-jobs',
    label: 'งานของฉัน',
    icon: BookCheck,
  },
];