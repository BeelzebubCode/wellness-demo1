// src/components/layout/header/PublicHeader.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { PUBLIC_NAV } from "@/lib/constants/public-nav";
import type { NavItem } from "@/components/layout/sidebar/types";
import LogoutButton from "@/components/auth/LogoutButton";
import { BrandLogo } from "@/components/shared";
import { Menu, X, LogIn, User } from "lucide-react";
import { TENANTS, normalizeTenant } from "@/config/tenants";
import { StudentPointsBadge } from "@/components/points/StudentPointsBadge";

type PublicUser = {
  name?: string | null;
  avatar?: string | null;
  role?: string | null;
};

const USER_KEY = "auth_user";

function readUserProfileFromStorage(): PublicUser {
  if (typeof window === "undefined") return {};
  const rawUser = localStorage.getItem(USER_KEY);
  if (!rawUser) return {};

  try {
    return JSON.parse(rawUser);
  } catch {
    return { name: rawUser };
  }
}

async function fetchMe(): Promise<{ isLoggedIn: boolean; user: PublicUser }> {
  try {
    const res = await fetch("/api/v2/auth/me", {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    });

    if (!res.ok) return { isLoggedIn: false, user: {} };

    const data = await res.json();
    if (!data?.valid || !data?.account) return { isLoggedIn: false, user: {} };

    const name = data.account.name ?? data.account.username ?? null;

    return {
      isLoggedIn: true,
      user: {
        name,
        avatar: data.account.avatar ?? null,
        role: data.account.role ?? null,
      },
    };
  } catch {
    return { isLoggedIn: false, user: {} };
  }
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
  const [mobileOpen, setMobileOpen] = useState(false);

  const [auth, setAuth] = useState<{ isLoggedIn: boolean; user: PublicUser }>({
    isLoggedIn: false,
    user: {},
  });
  const [hydrated, setHydrated] = useState(false);

  // ✅ auto-hide header
  const [headerVisible, setHeaderVisible] = useState(true);
  const [cursorTop, setCursorTop] = useState(false);

  useEffect(() => {
    let mounted = true;

    const sync = async () => {
      const me = await fetchMe();
      if (!mounted) return;

      const cached = readUserProfileFromStorage();

      const mergedUser: PublicUser = {
        ...cached,
        ...me.user,
        name: me.user.name ?? cached.name ?? null,
        avatar: me.user.avatar ?? cached.avatar ?? null,
        role: me.user.role ?? cached.role ?? null,
      };

      setAuth({ isLoggedIn: me.isLoggedIn, user: mergedUser });
    };

    const onStorage = () => sync();

    sync();
    setHydrated(true);

    window.addEventListener("storage", onStorage);
    window.addEventListener("auth-changed", sync as unknown as EventListener);

    return () => {
      mounted = false;
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(
        "auth-changed",
        sync as unknown as EventListener,
      );
    };
  }, []);

  useEffect(() => {
    let lastY = typeof window !== "undefined" ? window.scrollY : 0;

    const onScroll = () => {
      const y = window.scrollY;
      const goingDown = y > lastY;

      if (y <= 10) {
        setHeaderVisible(true);
        lastY = y;
        return;
      }

      if (goingDown) setHeaderVisible(false);
      else setHeaderVisible(true);

      lastY = y;
    };

    const onMouseMove = (e: MouseEvent) => setCursorTop(e.clientY <= 12);

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("mousemove", onMouseMove);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("mousemove", onMouseMove);
    };
  }, []);

  const isLoggedIn = useMemo(() => {
    if (!hydrated) return false;
    return auth.isLoggedIn;
  }, [hydrated, auth.isLoggedIn]);

  const displayName = useMemo(
    () => userName ?? auth.user.name ?? "ผู้ใช้",
    [userName, auth.user.name],
  );

  const displayAvatar = useMemo(
    () => userAvatar ?? auth.user.avatar ?? null,
    [userAvatar, auth.user.avatar],
  );

  const toggleMobile = () => setMobileOpen((v) => !v);

  const shouldShow = headerVisible || cursorTop || mobileOpen;

  const navItems: NavItem[] = useMemo(() => {
    const base = [...PUBLIC_NAV];
    return base;
  }, [isLoggedIn]);

  const isActiveNav = (item: NavItem) =>
    item.exact
      ? pathname === item.href
      : pathname === item.href || pathname.startsWith(`${item.href}/`);

  const [tenantCode, setTenantCode] = useState<string | null>(null);

  useEffect(() => {
    const read = () =>
      typeof document === "undefined"
        ? null
        : document.documentElement?.dataset?.tenant ?? null;

    setTenantCode(read());

    const el = document.documentElement;
    const obs = new MutationObserver(() => setTenantCode(read()));
    obs.observe(el, { attributes: true, attributeFilter: ["data-tenant"] });

    return () => obs.disconnect();
  }, []);

  const tenant = useMemo(() => {
    const code = normalizeTenant(tenantCode);
    return TENANTS[code] ?? TENANTS.DEFAULT;
  }, [tenantCode]);

  const headerTitle = tenant.brandName;
  const headerSubtitle = "ระบบจองคิวให้คำปรึกษา";

  return (
    <header
      className={cn(
        "fixed top-0 inset-x-0 z-50",
        "transition-transform duration-300 ease-out",
        shouldShow ? "translate-y-0" : "-translate-y-full",
      )}
    >
      <div className="absolute top-0 left-0 right-0 h-3" />

      <div className="relative">
        {/* glass */}
        <div className="absolute inset-0 bg-white/30 backdrop-blur-xl" />

        {/* ✅ dynamic gradient overlay (อิง vars ของ tenant) */}
        <div
          className="absolute inset-0 opacity-70"
          style={{
            background:
              "linear-gradient(90deg, rgba(var(--bg-grad-2),0.45) 0%, rgba(var(--bg-grad-1),0.20) 55%, rgba(var(--bg-grad-2),0.45) 100%)",
          }}
        />

        {/* divider */}
        <div className="absolute inset-x-0 bottom-0 h-px bg-[rgb(var(--border)/0.60)]" />

        <div className="relative">
          <div className="max-w-7xl mx-auto px-4">
            <div className="h-16 flex items-center justify-between gap-4">
              <Link
                href="/"
                className={cn(
                  "flex items-center gap-3 select-none",
                  "transition-opacity hover:opacity-95",
                )}
                aria-label="Wellness Home"
              >
                <BrandLogo
                  asLink={false}
                  size={34}
                  showText={false}
                  variant="default"
                  className="gap-0"
                  imgClassName="object-contain"
                />

                <div className="leading-tight">
                  <div className="font-extrabold text-[15px] tracking-tight text-[rgb(var(--fg))]">
                    {headerTitle}
                  </div>
                  <div className="text-[11px] font-semibold text-[rgb(var(--muted))]">
                    {headerSubtitle}
                  </div>
                </div>
              </Link>

              {/* ✅ Desktop menu */}
              <nav className="hidden md:flex items-center gap-2">
                {navItems.map((item) => {
                  const active = isActiveNav(item);
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "group relative flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-full",
                        "border border-[rgb(var(--border)/0.70)]",
                        "transition-all duration-200 ease-out",
                        "hover:-translate-y-[1px] hover:shadow-sm hover:bg-white/60",
                        "active:translate-y-0 active:scale-[0.98]",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--ring),0.40)]",
                        active
                          ? "bg-white/80 text-[rgb(var(--fg))] shadow-sm"
                          : "bg-white/35 text-[rgb(var(--fg))]/80",
                      )}
                    >
                      {Icon && (
                        <Icon
                          className={cn(
                            "w-4 h-4 transition-transform duration-200",
                            "group-hover:-rotate-3 group-hover:scale-[1.05]",
                          )}
                          style={{
                            color: active
                              ? "rgb(var(--primary))"
                              : "rgba(var(--fg),0.65)",
                          }}
                        />
                      )}
                      <span className="transition-transform duration-200 group-active:translate-y-[0.5px]">
                        {item.label}
                      </span>

                      {/* shine */}
                      <span
                        className={cn(
                          "pointer-events-none absolute inset-0 rounded-full opacity-0",
                          "bg-gradient-to-r from-white/0 via-white/30 to-white/0",
                          "transition-opacity duration-200",
                          "group-hover:opacity-100",
                        )}
                      />
                    </Link>
                  );
                })}
              </nav>

              <div className="flex items-center gap-3" suppressHydrationWarning>
                {isLoggedIn && (
                  <div className="hidden sm:flex items-center gap-2">

                    {/* ✅ Points (Student only) */}
                    {isLoggedIn && <StudentPointsBadge role={auth.user.role} />} 

                    {/* Avatar + Name : สเกลเดียวกับเมนูซ้าย */}
                    <div
                      className="flex items-center gap-1.5 px-2 py-1 rounded-full
                                border border-[rgb(var(--border)/0.70)] bg-white/45"
                    >
                      {displayAvatar ? (
                        <img
                          src={displayAvatar}
                          alt={displayName}
                          className="w-6 h-6 rounded-full object-cover"
                        />
                      ) : (
                        <div
                          className="w-6 h-6 rounded-full bg-white/60
                                    border border-[rgb(var(--border)/0.70)]
                                    flex items-center justify-center"
                        >
                          <User
                            className="w-3.5 h-3.5"
                            style={{ color: "rgb(var(--primary))" }}
                          />
                        </div>
                      )}
                      <span className="text-xs font-semibold max-w-[110px] truncate text-[rgb(var(--fg))]">
                        {displayName}
                      </span>
                    </div>

                    {/* Logout : เล็กเท่าเมนูซ้าย */}
                    <LogoutButton
                      redirectTo="/login"
                      label="ออกจากระบบ"
                      iconOnly={false}
                      className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-2 rounded-full",
                        "text-xs font-semibold transition",
                        "border border-[rgb(var(--border)/0.70)]",
                        "bg-white/45 hover:bg-white/70",
                        "text-[rgb(var(--fg))]",
                      )}
                    />
                  </div>
                )}


                {!isLoggedIn && onLogin && (
                  <button
                    type="button"
                    onClick={onLogin}
                    className={cn(
                      "hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-full",
                      "text-xs font-extrabold shadow-sm transition",
                      "active:scale-[0.99]",
                      "bg-[rgb(var(--primary))] hover:bg-[rgb(var(--primary-600))] text-white",
                    )}
                  >
                    <LogIn className="w-4 h-4" />
                    เข้าสู่ระบบ
                  </button>
                )}

                <button
                  type="button"
                  onClick={toggleMobile}
                  className={cn(
                    "md:hidden inline-flex items-center justify-center",
                    "w-10 h-10 rounded-full transition active:scale-95",
                    "border border-[rgb(var(--border)/0.70)] bg-white/45 hover:bg-white/70",
                  )}
                  style={{ color: "rgb(var(--fg))" }}
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

          {/* ✅ Mobile Drawer */}
          {mobileOpen && (
            <div className="md:hidden px-4 pb-4">
              <div className="mt-2 rounded-2xl border border-[rgb(var(--border)/0.70)] bg-white/45 backdrop-blur-xl p-2">
                <div className="flex flex-col gap-1">
                  {navItems.map((item) => {
                    const active = isActiveNav(item);
                    const Icon = item.icon;

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          "group flex items-center gap-3 px-3 py-2 rounded-xl",
                          "transition-all duration-200 ease-out",
                          "hover:-translate-y-[1px] hover:bg-white/60 hover:shadow-sm",
                          "active:translate-y-0 active:scale-[0.98]",
                          active ? "bg-white/75" : "bg-transparent",
                        )}
                      >
                        {Icon ? (
                          <Icon
                            className="w-5 h-5 opacity-80 transition-transform duration-200 group-hover:scale-[1.05]"
                            style={{
                              color: active
                                ? "rgb(var(--primary))"
                                : "rgba(var(--fg),0.70)",
                            }}
                          />
                        ) : null}
                        <span className="text-sm font-semibold text-[rgb(var(--fg))]">
                          {item.label}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
