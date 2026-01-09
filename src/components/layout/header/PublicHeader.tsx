// components/layout/header/PublicHeader.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { APP_CONFIG, PUBLIC_NAV } from "@/lib/constants";
import LogoutButton from "@/components/auth/LogoutButton";
import { BrandLogo } from "@/components/shared";
import { Menu, X, LogIn, User } from "lucide-react";

type PublicUser = {
  name?: string | null;
  avatar?: string | null;
  role?: string | null;
};

const TOKEN_KEY = "token";
const USER_KEY = "auth_user";

function readUserFromStorage(): { isLoggedIn: boolean; user: PublicUser } {
  if (typeof window === "undefined") return { isLoggedIn: false, user: {} };

  const token = localStorage.getItem(TOKEN_KEY);
  const rawUser = localStorage.getItem(USER_KEY);

  let user: PublicUser = {};
  if (rawUser) {
    try {
      user = JSON.parse(rawUser);
    } catch {
      user = { name: rawUser };
    }
  }

  return { isLoggedIn: !!token, user };
}

export interface PublicHeaderProps {
  userName?: string;
  userAvatar?: string;
  onLogin?: () => void;
}

export function PublicHeader({
  userName,
  userAvatar,
  onLogin,
}: PublicHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const [auth, setAuth] = useState<{ isLoggedIn: boolean; user: PublicUser }>(
    () => ({
      isLoggedIn: false,
      user: {},
    })
  );
  const [hydrated, setHydrated] = useState(false);

  const toggleMobile = () => setMobileOpen((v) => !v);

  useEffect(() => {
    const sync = () => setAuth(readUserFromStorage());

    window.addEventListener("storage", sync);
    window.addEventListener("auth-changed", sync as EventListener);

    sync();
    setHydrated(true);

    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("auth-changed", sync as EventListener);
    };
  }, []);

  const isLoggedIn = useMemo(() => {
    if (!hydrated) return false;
    return auth.isLoggedIn;
  }, [hydrated, auth.isLoggedIn]);

  const displayName = useMemo(
    () => userName ?? auth.user.name ?? "ผู้ใช้",
    [userName, auth.user.name]
  );

  const displayAvatar = useMemo(
    () => userAvatar ?? auth.user.avatar ?? null,
    [userAvatar, auth.user.avatar]
  );

  return (
    <header className="sticky top-0 z-40">
      {/* BG */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary-600 via-teal-500 to-cyan-500 opacity-95" />
      <div className="absolute inset-0 backdrop-blur-md" />
      {/* subtle border */}
      <div className="absolute inset-x-0 bottom-0 h-px bg-white/15" />

      <div className="relative">
        <div className="max-w-7xl mx-auto px-4">
          <div className="h-16 flex items-center justify-between gap-4">
            {/* Logo (clean, no frame) */}
            <Link
              href="/"
              className={cn(
                "flex items-center gap-3 select-none",
                "transition-opacity hover:opacity-95"
              )}
              aria-label="NU Wellness Home"
            >
              {/* ใช้ BrandLogo แบบไม่เป็นลิงก์ซ้อน */}
              <BrandLogo
                asLink={false}
                size={34}
                showText={false}
                variant="default"
                className="gap-0"
                imgClassName="object-contain drop-shadow-[0_1px_6px_rgba(0,0,0,0.25)]"
              />

              <div className="leading-tight">
                <div className="text-white font-extrabold text-lg tracking-tight">
                  NU Wellness Center
                </div>
              </div>
            </Link>

            {/* ================= Desktop Navigation ================= */}
            <nav className="hidden md:flex items-center gap-2">
              {PUBLIC_NAV.map((item) => {
                const isActive = item.exact
                  ? pathname === item.href
                  : pathname === item.href ||
                    pathname.startsWith(`${item.href}/`);

                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-all",
                      "border border-white/0",
                      isActive
                        ? "bg-white text-slate-900 shadow border-white/40"
                        : "text-white/85 hover:bg-white/10 hover:border-white/15"
                    )}
                  >
                    {Icon && (
                      <Icon
                        className={cn(
                          "w-4 h-4",
                          isActive ? "text-slate-900" : "text-white/85"
                        )}
                      />
                    )}
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* ================= Right ================= */}
            <div className="flex items-center gap-3" suppressHydrationWarning>
              {/* Logged in (desktop) */}
              {isLoggedIn && (
                <div className="hidden sm:flex items-center gap-3">
                  <div className="flex items-center gap-2 px-2 py-1 rounded-full bg-black/10 border border-white/20">
                    {displayAvatar ? (
                      <img
                        src={displayAvatar}
                        alt={displayName}
                        className="w-8 h-8 rounded-full ring-2 ring-white/40 object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                        <User className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <span className="text-sm font-semibold text-white max-w-[140px] truncate">
                      {displayName}
                    </span>
                  </div>

                  <LogoutButton
                    redirectTo="/"
                    label="ออกจากระบบ"
                    iconOnly={false}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full",
                      "border border-white/25 bg-white/10 text-xs font-semibold text-white",
                      "hover:bg-white hover:text-slate-900 transition shadow-sm"
                    )}
                  />
                </div>
              )}

              {/* Guest (desktop) */}
              {!isLoggedIn && onLogin && (
                <button
                  type="button"
                  onClick={onLogin}
                  className={cn(
                    "hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-full",
                    "bg-white text-slate-900 text-xs font-extrabold shadow",
                    "hover:bg-slate-100 active:scale-[0.99] transition"
                  )}
                >
                  <LogIn className="w-4 h-4" />
                  เข้าสู่ระบบ
                </button>
              )}

              {/* Mobile toggle */}
              <button
                type="button"
                onClick={toggleMobile}
                className={cn(
                  "md:hidden inline-flex items-center justify-center",
                  "w-10 h-10 rounded-full",
                  "bg-white/10 hover:bg-white/15 active:scale-95 transition",
                  "border border-white/20 text-white shadow-sm"
                )}
                aria-label="Toggle menu"
              >
                {mobileOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ================= Mobile Drawer ================= */}
        <div
          className={cn(
            "md:hidden overflow-hidden transition-all duration-300",
            mobileOpen ? "max-h-[440px] opacity-100" : "max-h-0 opacity-0"
          )}
        >
          <div className="px-4 pt-3 pb-4">
            <div
              className={cn(
                "rounded-2xl border border-white/15",
                "bg-white/10 backdrop-blur-xl shadow-xl",
                "p-4 space-y-4"
              )}
            >
              {/* Mobile user chip */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  {isLoggedIn ? (
                    displayAvatar ? (
                      <img
                        src={displayAvatar}
                        alt={displayName}
                        className="w-9 h-9 rounded-full ring-2 ring-white/35 object-cover"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center">
                        <User className="w-4 h-4 text-white" />
                      </div>
                    )
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  )}

                  <div className="min-w-0">
                    <div className="text-[11px] text-white/70">สถานะ</div>
                    <div className="text-sm font-extrabold text-white truncate">
                      {isLoggedIn ? displayName : "ผู้เยี่ยมชม"}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="w-9 h-9 rounded-full bg-white/10 border border-white/15 text-white/90 hover:bg-white/15 transition"
                  aria-label="Close menu"
                >
                  <X className="w-4 h-4 mx-auto" />
                </button>
              </div>

              {/* nav pills */}
              <nav className="grid grid-cols-2 gap-2">
                {PUBLIC_NAV.map((item) => {
                  const isActive = item.exact
                    ? pathname === item.href
                    : pathname === item.href ||
                      pathname.startsWith(`${item.href}/`);

                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "relative flex items-center justify-center gap-2",
                        "h-11 rounded-full text-xs font-extrabold tracking-wide",
                        "transition active:scale-[0.98]",
                        isActive
                          ? "bg-white text-slate-900 shadow"
                          : "bg-white/10 text-white hover:bg-white/15 border border-white/15"
                      )}
                    >
                      {isActive && (
                        <span
                          aria-hidden
                          className="absolute -inset-0.5 rounded-full bg-white/30 blur-md opacity-60"
                        />
                      )}

                      <span className="relative flex items-center justify-center gap-2">
                        {Icon && (
                          <Icon
                            className={cn(
                              "w-4 h-4",
                              isActive ? "text-slate-900" : "text-white"
                            )}
                          />
                        )}
                        <span className="truncate">{item.label}</span>
                      </span>
                    </Link>
                  );
                })}
              </nav>

              {/* auth button */}
              <div className="pt-1" suppressHydrationWarning>
                {isLoggedIn ? (
                  <LogoutButton
                    redirectTo="/"
                    label="ออกจากระบบ"
                    iconOnly={false}
                    className={cn(
                      "w-full h-11 rounded-full",
                      "flex items-center justify-center gap-2",
                      "text-xs font-extrabold",
                      "bg-white/10 text-white border border-white/20",
                      "hover:bg-white/15 active:scale-[0.98] transition"
                    )}
                  />
                ) : (
                  onLogin && (
                    <button
                      onClick={() => {
                        setMobileOpen(false);
                        onLogin();
                      }}
                      className={cn(
                        "w-full h-11 rounded-full",
                        "flex items-center justify-center gap-2",
                        "text-xs font-extrabold",
                        "bg-white text-slate-900 shadow",
                        "hover:bg-slate-100 active:scale-[0.98] transition"
                      )}
                    >
                      <LogIn className="w-4 h-4" />
                      เข้าสู่ระบบ
                    </button>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
        {/* ================= End Mobile Drawer ================= */}
      </div>
    </header>
  );
}
