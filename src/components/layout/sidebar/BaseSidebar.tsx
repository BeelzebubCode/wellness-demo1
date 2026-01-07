// components/layout/sidebar/BaseSidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { ChevronLeft, ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { BaseSidebarProps } from './types';

export function BaseSidebar({
  config,
  isOpen,
  isCollapsed,
  onCloseMobile,
  onToggleCollapse,
}: BaseSidebarProps) {
  const pathname = usePathname();
  const { logo, items, theme = 'light', backLink } = config;

  useEffect(() => {
    onCloseMobile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Theme variants
  const themes = {
    light: {
      wrapper: 'bg-white text-gray-600',
      border: 'border-gray-200',
      logoBg: 'bg-primary-500 text-white',
      logoText: 'text-gray-800',
      logoSubtext: 'text-gray-500',
      navActive: 'bg-primary-50 text-primary-700',
      navInactive: 'text-gray-500 hover:bg-gray-50 hover:text-gray-900',
      divider: 'border-gray-100',
      backLink: 'text-gray-400 hover:bg-gray-50 hover:text-gray-600',
      collapseBtn: 'text-gray-400 hover:text-gray-600 hover:bg-gray-50',
    },
    primary: {
      wrapper: 'bg-gradient-to-b from-primary-600 to-teal-600 text-white',
      border: 'border-white/10',
      logoBg: 'bg-white text-primary-600',
      logoText: 'text-white',
      logoSubtext: 'text-white/70',
      navActive: 'bg-white text-primary-700',
      navInactive: 'text-white/80 hover:bg-white/10 hover:text-white',
      divider: 'border-white/10',
      backLink: 'text-white/60 hover:bg-white/10 hover:text-white',
      collapseBtn: 'text-white/50 hover:text-white hover:bg-white/10',
    },
    dark: {
      wrapper: 'bg-gray-900 text-gray-300',
      border: 'border-gray-800',
      logoBg: 'bg-primary-500 text-white',
      logoText: 'text-white',
      logoSubtext: 'text-gray-500',
      navActive: 'bg-gray-800 text-white',
      navInactive: 'text-gray-400 hover:bg-gray-800 hover:text-white',
      divider: 'border-gray-800',
      backLink: 'text-gray-500 hover:bg-gray-800 hover:text-gray-300',
      collapseBtn: 'text-gray-500 hover:text-gray-300 hover:bg-gray-800',
    },
  };

  const t = themes[theme];
  const LogoIcon = logo.icon;

  const sidebarContent = (
    <div className={cn('flex flex-col h-full overflow-hidden', t.wrapper)}>
      {/* Logo */}
      <div
        className={cn(
          'h-20 flex items-center px-6 border-b overflow-hidden flex-shrink-0',
          t.border,
          isCollapsed && 'justify-center px-2'
        )}
      >
        <div
          className={cn(
            'w-10 h-10 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0',
            t.logoBg
          )}
        >
          <LogoIcon className="w-6 h-6" />
        </div>

        {!isCollapsed && (
          <div className="ml-3 min-w-0 overflow-hidden">
            <span className={cn('font-bold text-xl tracking-tight whitespace-nowrap block', t.logoText)}>
              {logo.title}
            </span>
            {logo.subtitle && (
              <span className={cn('text-xs whitespace-nowrap', t.logoSubtext)}>{logo.subtitle}</span>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-6 px-3 space-y-2">
        {items.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(item.href + '/');

          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-200 group relative overflow-hidden',
                isCollapsed && 'justify-center px-2',
                isActive
                  ? cn(t.navActive, 'font-semibold shadow-sm')
                  : cn(t.navInactive, 'font-medium')
              )}
            >
              <span
                className={cn(
                  'transition-transform duration-200 flex-shrink-0',
                  isActive ? 'scale-110' : 'group-hover:scale-110'
                )}
              >
                <Icon className="w-6 h-6" />
              </span>

              {!isCollapsed && (
                <>
                  <span className="text-base flex-1 whitespace-nowrap overflow-hidden">{item.label}</span>

                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full flex-shrink-0">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </>
              )}

              {isActive && !isCollapsed && theme === 'light' && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary-500 rounded-r-full" />
              )}

              {isCollapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
                  {item.label}
                </div>
              )}
            </Link>
          );
        })}

        {backLink && (
          <>
            <div className={cn('my-4 border-t', t.divider)} />
            <Link
              href={backLink.href}
              className={cn(
                'flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 font-medium overflow-hidden',
                t.backLink,
                isCollapsed && 'justify-center px-2'
              )}
            >
              <Home className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && <span className="text-sm whitespace-nowrap">{backLink.label}</span>}
            </Link>
          </>
        )}
      </nav>

      {/* Collapse Toggle (desktop only) */}
      <div className={cn('p-4 border-t hidden md:block overflow-hidden flex-shrink-0', t.border)}>
        <button
          onClick={onToggleCollapse}
          className={cn(
            'w-full flex items-center justify-center p-3 rounded-xl transition-colors overflow-hidden',
            t.collapseBtn
          )}
        >
          {isCollapsed ? (
            <ChevronRight className="w-6 h-6 flex-shrink-0" />
          ) : (
            <div className="flex items-center gap-2 whitespace-nowrap">
              <ChevronLeft className="w-5 h-5 flex-shrink-0" />
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
          'fixed inset-0 z-40 bg-black/30 backdrop-blur-sm transition-opacity duration-300 md:hidden',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={onCloseMobile}
      />

      {/* Mobile drawer */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-72 transition-transform duration-300 md:hidden shadow-2xl overflow-hidden',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          'hidden md:block h-screen sticky top-0 transition-all duration-300 z-20 overflow-hidden',
          isCollapsed ? 'w-20' : 'w-72'
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}