"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { TenantCode } from "@/config/tenant-domains";
import { tenantFromHost } from "@/config/tenant-domains";
import { initTenantTheme, setTenantTheme, clearTenantTheme } from "@/lib/tenant/client";

type ThemeContextValue = {
  tenant: TenantCode;
  setTenant: (code?: string | null) => void;
  resetTenant: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [tenant, setTenantState] = useState<TenantCode>("DEFAULT");

  useEffect(() => {
    // ✅ 1) บังคับตาม domain ก่อน (สำคัญ)
    const fromDomain = tenantFromHost(window.location.host); // nu.wellness.local:3000 -> "NU"
    if (fromDomain !== "DEFAULT") {
      const applied = setTenantTheme(fromDomain);
      setTenantState(applied);
      return;
    }

    // ✅ 2) ถ้าเป็นโดเมนหลัก (ไม่มี subdomain) ค่อยใช้ localStorage
    const code = initTenantTheme();
    setTenantState(code);
  }, []);

  const setTenant = (code?: string | null) => {
    const applied = setTenantTheme(code ?? "DEFAULT");
    setTenantState(applied);
  };

  const resetTenant = () => {
    clearTenantTheme();
    setTenantState("DEFAULT");
  };

  const value = useMemo(() => ({ tenant, setTenant, resetTenant }), [tenant]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
