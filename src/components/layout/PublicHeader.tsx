// ==========================================
// 📌 Layout Component: PublicHeader (v3)
// ==========================================

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/cn';
import { APP_CONFIG, PUBLIC_NAV } from '@/lib/constants';
import {
  LogOut,
  Menu,
  X,
  LogIn,
  User,
} from 'lucide-react';

export interface PublicHeaderProps {
  userName?: string;
  userAvatar?: string;
  onLogin?: () => void;
  onLogout?: () => void;
}

export function PublicHeader({
  userName,
  userAvatar,
  onLogin,
  onLogout,
}: PublicHeaderProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleMobile = () => setMobileOpen((v) => !v);

  const isLoggedIn = !!userName;

  return (
    <header className="sticky top-0 z-40">
      {/* BG */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary-600 via-teal-500 to-cyan-500 opacity-95" />
      <div className="absolute inset-0 backdrop-blur-md" />

      <div className="relative">
        <div className="max-w-7xl mx-auto px-4">
          <div className="h-16 flex items-center justify-between gap-4">

            {/* Logo */}
            <Link
              href="/"
              className="flex items-center gap-2 rounded-full px-3 py-1.5 bg-white/10 hover:bg-white/15 border border-white/15 shadow-sm transition-all"
            >
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                <User className="w-4 h-4 text-primary-600" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-white/70 tracking-wide">
                  NU Wellness
                </span>
                <span className="text-sm font-semibold text-white">
                  {APP_CONFIG.name}
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-2">
              {PUBLIC_NAV.map((item) => {
                const isActive =
                  pathname === item.href ||
                  pathname.startsWith(`${item.href}/`);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full transition-all',
                      isActive
                        ? 'bg-white text-slate-900 shadow'
                        : 'text-white/80 hover:bg-white/10'
                    )}
                  >
                    {item.icon && (
                      <span className="w-4 h-4 flex items-center justify-center">
                        {item.icon}
                      </span>
                    )}
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Right: User / Auth Actions */}
            <div className="flex items-center gap-3">

              {/* Logged in */}
              {isLoggedIn && (
                <div className="hidden sm:flex items-center gap-3">
                  <div className="flex items-center gap-2 px-2 py-1 rounded-full bg-black/10 border border-white/20">
                    {userAvatar ? (
                      <img
                        src={userAvatar}
                        alt={userName}
                        className="w-8 h-8 rounded-full ring-2 ring-white/40 object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                        <User className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <span className="text-sm font-semibold text-white max-w-[120px] truncate">
                      {userName}
                    </span>
                  </div>

                  {onLogout && (
                    <button
                      type="button"
                      onClick={onLogout}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/25 bg-white/10 text-xs text-white hover:bg-white hover:text-slate-900 transition"
                    >
                      <LogOut className="w-4 h-4" />
                      ออกจากระบบ
                    </button>
                  )}
                </div>
              )}

              {/* Guest */}
              {!isLoggedIn && onLogin && (
                <button
                  type="button"
                  onClick={onLogin}
                  className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white text-slate-900 text-xs font-semibold shadow hover:bg-slate-100 transition"
                >
                  <LogIn className="w-4 h-4" />
                  เข้าสู่ระบบ
                </button>
              )}

              {/* Mobile toggle */}
              <button
                type="button"
                onClick={toggleMobile}
                className="md:hidden w-9 h-9 rounded-full bg-black/15 border border-white/20 text-white"
              >
                {mobileOpen ? <X /> : <Menu />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <div
          className={cn(
            'md:hidden border-t border-white/15 bg-black/20 backdrop-blur-md overflow-hidden transition-all',
            mobileOpen ? 'max-h-72 opacity-100' : 'max-h-0 opacity-0'
          )}
        >
          <div className="px-4 py-3 space-y-3">
            <nav className="flex flex-wrap gap-2">
              {PUBLIC_NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="px-3 py-1.5 rounded-full text-xs bg-white/10 text-white"
                  onClick={() => setMobileOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Mobile auth */}
            {isLoggedIn ? (
              onLogout && (
                <button
                  onClick={onLogout}
                  className="flex items-center gap-2 text-xs text-white bg-white/15 px-3 py-1.5 rounded-full"
                >
                  <LogOut className="w-4 h-4" />
                  ออกจากระบบ
                </button>
              )
            ) : (
              onLogin && (
                <button
                  onClick={onLogin}
                  className="flex items-center gap-2 text-xs bg-white text-slate-900 px-3 py-1.5 rounded-full"
                >
                  <LogIn className="w-4 h-4" />
                  เข้าสู่ระบบ
                </button>
              )
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
