// lib/constants/admin-nav.ts
import { CalendarDays, Clock, Database, BookCheck } from 'lucide-react';
import type { NavItem } from '@/components/layout/sidebar/types';

export const ADMIN_NAV: NavItem[] = [
{
    href: '/admin/data-center',
    label: 'ศูนย์ข้อมูล',
    icon: Database,
  },
  {
    href: '/admin/bookings',
    label: 'มอบหมายงาน',
    icon: CalendarDays,
  },
  {
    href: '/admin/schedule',
    label: 'จัดการตารางเวลา',
    icon: Clock,
  },
  {
    href: '/admin/my-jobs',
    label: 'งานของฉัน',
    icon: BookCheck,
  },
];