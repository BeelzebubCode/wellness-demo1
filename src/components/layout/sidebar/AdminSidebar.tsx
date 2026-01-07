// components/layout/sidebar/AdminSidebar.tsx
'use client';

import { ShieldPlus } from 'lucide-react';
import { ADMIN_NAV } from '@/lib/constants/admin-nav';
import { BaseSidebar } from './BaseSidebar';
import type { SidebarConfig } from './types';

const ADMIN_CONFIG: SidebarConfig = {
  logo: {
    icon: ShieldPlus,
    title: 'NU Wellness',
    subtitle: 'Admin Panel',
  },
  items: ADMIN_NAV,
  theme: 'light',
};

interface AdminSidebarProps {
  isOpen: boolean;
  isCollapsed: boolean;
  onCloseMobile: () => void;
  onToggleCollapse: () => void;
}

export function AdminSidebar(props: AdminSidebarProps) {
  return <BaseSidebar config={ADMIN_CONFIG} {...props} />;
}