// components/layout/sidebar/BookingSidebar.tsx
'use client';

import { Heart } from 'lucide-react';
import { BOOKING_NAV } from '@/lib/constants/booking-nav';
import { BaseSidebar } from './BaseSidebar';
import type { SidebarConfig } from './types';

const BOOKING_CONFIG: SidebarConfig = {
  logo: {
    icon: Heart,
    title: 'NU Wellness',
    subtitle: 'Student Portal',
  },
  items: BOOKING_NAV,
  theme: 'primary',
  backLink: {
    href: '/',
    label: 'กลับหน้าหลัก',
  },
};

interface BookingSidebarProps {
  isOpen: boolean;
  isCollapsed: boolean;
  onCloseMobile: () => void;
  onToggleCollapse: () => void;
}

export function BookingSidebar(props: BookingSidebarProps) {
  return <BaseSidebar config={BOOKING_CONFIG} {...props} />;
}