"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { TenantCode } from "@/config/tenants";
import {
  initTenantTheme,
  setTenantTheme,
  clearTenantTheme,
} from "@/lib/tenant/client";

/**
 * ThemeContext ใช้สำหรับ:
 * - เก็บ tenant ปัจจุบัน (มหาลัย)
 * - เปลี่ยนธีมทั้งเว็บผ่าน <html data-tenant="...">
 * - ทำงานฝั่ง client เท่านั้น
 */

type ThemeContextValue = {
  tenant: TenantCode;
  /** เปลี่ยน tenant (ใช้หลัง login หรือ staff switch) */
  setTenant: (code?: string | null) => void;
  /** reset เป็น DEFAULT (ใช้ตอน logout) */
  resetTenant: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [tenant, setTenantState] = useState<TenantCode>("DEFAULT");

  /**
   * ตอนเปิดเว็บ / refresh
   * - โหลด tenant จาก localStorage
   * - apply data-tenant ให้ <html>
   */
  useEffect(() => {
    const code = initTenantTheme();
    setTenantState(code);
  }, []);

  /**
   * เปลี่ยน tenant แบบปกติ
   * - normalize + apply theme
   * - save ลง localStorage
   */
  const setTenant = (code?: string | null) => {
    const applied = setTenantTheme(code ?? "DEFAULT");
    setTenantState(applied);
  };

  /**
   * ใช้ตอน logout
   * - ล้าง localStorage
   * - ลบ data-tenant
   */
  const resetTenant = () => {
    clearTenantTheme();
    setTenantState("DEFAULT");
  };

  const value = useMemo(
    () => ({
      tenant,
      setTenant,
      resetTenant,
    }),
    [tenant]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/** hook ใช้ง่ายใน component */
export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}
