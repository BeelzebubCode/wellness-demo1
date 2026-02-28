"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { TenantCode } from "@/config/tenants";
import { normalizeTenant } from "@/config/tenants";
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
    // ✅ อ่าน tenant_code จาก cookie (ซึ่ง login service ตั้งจาก account_home_university_id)
    const fromCookie = typeof document !== "undefined"
      ? document.cookie.split(";").map(c => c.trim()).find(c => c.startsWith("tenant_code="))?.split("=")[1]
      : undefined;

    if (fromCookie && fromCookie !== "DEFAULT") {
      const applied = setTenantTheme(fromCookie);
      setTenantState(applied);
      return;
    }

    // fallback: ใช้ localStorage (จาก initTenantTheme)
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
