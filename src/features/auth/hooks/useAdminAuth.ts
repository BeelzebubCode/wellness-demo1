// src/features/auth/hooks/useAdminAuth.ts
"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { authApi } from "../api";
import type { AuthUser } from "../types";

interface UseAdminAuthReturn {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

// ✅ ปรับให้ตรง schema: SUPER_ADMIN / RECTOR
const ADMIN_ROLES = new Set<AuthUser["role"]>(["SUPER_ADMIN", "RECTOR"]);

export function useAdminAuth(redirectTo = "/login"): UseAdminAuthReturn {
  const router = useRouter();
  const pathname = usePathname();

  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const redirectLogin = () => {
      if (pathname === "/login") return;
      const next = pathname && pathname !== "/login" ? pathname : "/admin/data-center";
      router.replace(`${redirectTo}?next=${encodeURIComponent(next)}`);
    };

    const checkAuth = async () => {
      try {
        const response = await authApi.me();

        if (!isMounted) return;

        if (!response?.valid || !response?.account) {
          setUser(null);
          setIsAuthenticated(false);
          redirectLogin();
          return;
        }

        if (!ADMIN_ROLES.has(response.account.role)) {
          setUser(null);
          setIsAuthenticated(false);
          router.replace("/");
          return;
        }

        setUser(response.account);
        setIsAuthenticated(true);
      } catch {
        if (!isMounted) return;
        setUser(null);
        setIsAuthenticated(false);
        redirectLogin();
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    checkAuth();
    return () => {
      isMounted = false;
    };
  }, [router, pathname, redirectTo]);

  return { user, isLoading, isAuthenticated };
}

export default useAdminAuth;
