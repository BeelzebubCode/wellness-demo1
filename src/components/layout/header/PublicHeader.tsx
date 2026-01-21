// components/layout/header/PublicHeader.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { PUBLIC_NAV } from "@/lib/constants";
import LogoutButton from "@/components/auth/LogoutButton";
import { BrandLogo } from "@/components/shared";
import { Menu, X, LogIn, User } from "lucide-react";

type PublicUser = {
  name?: string | null;
  avatar?: string | null;
  role?: string | null;
};

const USER_KEY = "auth_user";

const BRAND = {
  teal: "#2FA4A9",
  tealHover: "#278F93",
  border: "#D1EAEA",
  deep: "#1F3D3D",
};

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

    // name อาจไม่มีจาก /me ก็ fallback username
    const name = data.account.name ?? data.account.username ?? null;

    return {
      isLoggedIn: true,
      user: {
        name,
        // ถ้า /me ไม่มี avatar ก็ใช้ null (หรือดึงจาก storage ได้ใน merge ด้านล่าง)
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

export function PublicHeader({ userName, userAvatar, onLogin }: PublicHeaderProps) {
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
      // 1) fetch login state จาก cookie
      const me = await fetchMe();
      if (!mounted) return;

      // 2) merge profile จาก storage (ช่วยให้ชื่อ/รูปขึ้นเร็วหรือมี avatar ที่ me ไม่มี)
      const cached = readUserProfileFromStorage();

      const mergedUser: PublicUser = {
        ...cached,
        ...me.user,
        // ให้ server มาก่อน แต่ถ้า server ไม่มี name/avatar ก็ใช้ cached
        name: me.user.name ?? cached.name ?? null,
        avatar: me.user.avatar ?? cached.avatar ?? null,
        role: me.user.role ?? cached.role ?? null,
      };

      setAuth({ isLoggedIn: me.isLoggedIn, user: mergedUser });
    };

    const onStorage = () => {
      // กรณี tab อื่น login/logout
      sync();
    };

    // sync ครั้งแรก
    sync();
    setHydrated(true);

    window.addEventListener("storage", onStorage);
    window.addEventListener("auth-changed", sync as unknown as EventListener);

    return () => {
      mounted = false;
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("auth-changed", sync as unknown as EventListener);
    };
  }, []);

  // ✅ scroll hide / hover show
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

    const onMouseMove = (e: MouseEvent) => {
      setCursorTop(e.clientY <= 12);
    };

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
    [userName, auth.user.name]
  );

  const displayAvatar = useMemo(
    () => userAvatar ?? auth.user.avatar ?? null,
    [userAvatar, auth.user.avatar]
  );

  const toggleMobile = () => setMobileOpen((v) => !v);

  // ✅ เงื่อนไขโชว์ header
  const shouldShow = headerVisible || cursorTop || mobileOpen;

  return (
    <header
      className={cn(
        "fixed top-0 inset-x-0 z-50",
        "transition-transform duration-300 ease-out",
        shouldShow ? "translate-y-0" : "-translate-y-full"
      )}
    >
      <div className="absolute top-0 left-0 right-0 h-3" />

      <div className="relative">
        <div className="absolute inset-0 bg-white/30 backdrop-blur-xl" />
        <div
          className="absolute inset-0 opacity-70"
          style={{
            background:
              "linear-gradient(90deg, rgba(230,245,245,0.45) 0%, rgba(247,250,249,0.20) 55%, rgba(230,245,245,0.45) 100%)",
          }}
        />
        <div className="absolute inset-x-0 bottom-0 h-px bg-[#D1EAEA]/60" />

        <div className="relative">
          <div className="max-w-7xl mx-auto px-4">
            <div className="h-16 flex items-center justify-between gap-4">
              <Link
                href="/"
                className={cn("flex items-center gap-3 select-none", "transition-opacity hover:opacity-95")}
                aria-label="NU Wellness Home"
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
                  <div className="font-extrabold text-[15px] tracking-tight text-slate-900">
                    NU Wellness Center
                  </div>
                  <div className="text-[11px] font-semibold text-slate-600">
                    ระบบจองคิวให้คำปรึกษา
                  </div>
                </div>
              </Link>

              <nav className="hidden md:flex items-center gap-2">
                {PUBLIC_NAV.map((item) => {
                  const isActive = item.exact
                    ? pathname === item.href
                    : pathname === item.href || pathname.startsWith(`${item.href}/`);

                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-full transition-all",
                        "border border-[#D1EAEA]/70",
                        isActive
                          ? "bg-white/75 text-slate-900 shadow-sm"
                          : "bg-white/35 text-[#1F3D3D] hover:bg-white/55"
                      )}
                    >
                      {Icon && (
                        <Icon
                          className="w-4 h-4"
                          style={{ color: isActive ? BRAND.teal : "rgba(31,61,61,0.65)" }}
                        />
                      )}
                      {item.label}
                    </Link>
                  );
                })}
              </nav>

              <div className="flex items-center gap-3" suppressHydrationWarning>
                {isLoggedIn && (
                  <div className="hidden sm:flex items-center gap-3">
                    <div className="flex items-center gap-2 px-2 py-1 rounded-full border border-[#D1EAEA]/70 bg-white/45">
                      {displayAvatar ? (
                        <img
                          src={displayAvatar}
                          alt={displayName}
                          className="w-8 h-8 rounded-full ring-2 ring-white/60 object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-white/60 border border-[#D1EAEA]/70 flex items-center justify-center">
                          <User className="w-4 h-4" style={{ color: BRAND.teal }} />
                        </div>
                      )}
                      <span className="text-sm font-semibold max-w-[140px] truncate text-slate-900">
                        {displayName}
                      </span>
                    </div>

                    <LogoutButton
                      redirectTo="/"
                      label="ออกจากระบบ"
                      iconOnly={false}
                      className={cn(
                        "inline-flex items-center gap-2 px-4 py-2 rounded-full",
                        "text-xs font-extrabold transition shadow-sm",
                        "border border-[#D1EAEA]/70 text-[#1F3D3D]",
                        "bg-white/45 hover:bg-white/70"
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
                      "active:scale-[0.99]"
                    )}
                    style={{ background: BRAND.teal, color: "white" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = BRAND.tealHover)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = BRAND.teal)}
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
                    "border border-[#D1EAEA]/70 bg-white/45 hover:bg-white/70"
                  )}
                  style={{ color: BRAND.deep }}
                  aria-label="Toggle menu"
                >
                  {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>

          {/* ✅ ส่วน Mobile Drawer ของคุณเดิม เอาต่อได้เหมือนเดิมเลย */}
          {/* ... */}
        </div>
      </div>
    </header>
  );
}
