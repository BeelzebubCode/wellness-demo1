'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/cn';
import { ADMIN_NAV } from '@/lib/constants';
import { useEffect } from 'react';

import {
  CalendarDays,
  Clock,
  BookCheck,
  Database,
  ChevronLeft,
  ChevronRight,
  ShieldPlus,
} from 'lucide-react';

export interface AdminSidebarProps {
  isOpen: boolean;
  isCollapsed: boolean;
  onCloseMobile: () => void;
  onToggleCollapse: () => void;
}

export function AdminSidebar({
  isOpen,
  isCollapsed,
  onCloseMobile,
  onToggleCollapse,
}: AdminSidebarProps) {
  const pathname = usePathname();

  // ปิด sidebar เมื่อเปลี่ยนหน้า (mobile)
  useEffect(() => {
    onCloseMobile();
  }, [pathname, onCloseMobile]);

  // เลือก icon ตาม route (เฉพาะที่มีจริง)
  const getIcon = (href: string) => {
    switch (href) {
      case '/admin/bookings':
        return <CalendarDays className="w-6 h-6" />;
      case '/admin/schedule':
        return <Clock className="w-6 h-6" />;
      case '/admin/data-center':
        return <Database className="w-6 h-6" />;
      case '/admin/my-jobs':
        return <BookCheck className="w-6 h-6" />;
      default:
        return <Database className="w-6 h-6" />; // safe fallback
    }
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white border-r border-gray-200 text-gray-600 shadow-sm">
      {/* Logo */}
      <div
        className={cn(
          'h-20 flex items-center px-6 border-b border-gray-100',
          isCollapsed && 'justify-center px-2',
        )}
      >
        <div className="w-10 h-10 bg-primary-500 text-white rounded-xl flex items-center justify-center shadow-md shadow-primary-500/20">
          <ShieldPlus className="w-6 h-6" />
        </div>

        {!isCollapsed && (
          <span className="ml-3 font-bold text-gray-800 text-xl tracking-tight whitespace-nowrap">
            NU Wellness
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
        {ADMIN_NAV.map((item) => {
          if (item.href === '/admin') return null;

          const isActive =
            pathname === item.href ||
            pathname.startsWith(item.href + '/');

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-200 group relative',
                isCollapsed && 'justify-center px-2',
                isActive
                  ? 'bg-primary-50 text-primary-700 font-semibold shadow-sm'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900 font-medium',
              )}
            >
              <span
                className={cn(
                  'transition-transform duration-200',
                  isActive ? 'scale-110' : 'group-hover:scale-110',
                )}
              >
                {getIcon(item.href)}
              </span>

              {!isCollapsed && (
                <span className="text-base">{item.label}</span>
              )}

              {isActive && !isCollapsed && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary-500 rounded-r-full" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Collapse Toggle (desktop only) */}
      <div className="p-4 border-t border-gray-100 hidden md:block">
        <button
          onClick={onToggleCollapse}
          className="w-full flex items-center justify-center p-3 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-xl transition-colors"
        >
          {isCollapsed ? (
            <ChevronRight className="w-6 h-6" />
          ) : (
            <div className="flex items-center gap-2">
              <ChevronLeft className="w-5 h-5" />
              <span>ย่อเมนู</span>
            </div>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/20 backdrop-blur-sm transition-opacity duration-300 md:hidden',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none',
        )}
        onClick={onCloseMobile}
      />

      {/* Mobile drawer */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-72 bg-white transition-transform duration-300 md:hidden shadow-2xl',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          'hidden md:block h-screen sticky top-0 transition-all duration-300 z-20 border-r border-gray-200 bg-white',
          isCollapsed ? 'w-24' : 'w-72',
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
