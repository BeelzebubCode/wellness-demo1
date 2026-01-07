// components/layout/sidebar/ConsultantSidebar.tsx
'use client';

import { Stethoscope } from 'lucide-react';
import { CONSULTANT_NAV } from '@/lib/constants/consultant-nav';
import { BaseSidebar } from './BaseSidebar';
import type { SidebarConfig } from './types';

const CONSULTANT_CONFIG: SidebarConfig = {
  logo: {
    icon: Stethoscope,
    title: 'NU Wellness',
    subtitle: 'Consultant Portal',
  },
  items: CONSULTANT_NAV,
  theme: 'dark',  // ใช้ theme dark ให้ต่างจาก Admin/Booking
  backLink: {
    href: '/',
    label: 'กลับหน้าหลัก',
  },
};

interface ConsultantSidebarProps {
  isOpen: boolean;
  isCollapsed: boolean;
  onCloseMobile: () => void;
  onToggleCollapse: () => void;
}

export function ConsultantSidebar(props: ConsultantSidebarProps) {
  return <BaseSidebar config={CONSULTANT_CONFIG} {...props} />;
}