// components/layout/sidebar/ConsultantSidebar.tsx
"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useMyProfile } from "@/features/profile/hooks/useMyProfile";
import { authApi } from "@/features/auth/api";
import { buildTargetHostFromTenantCode } from "@/features/auth/login/login-utils";
import { CONSULTANT_NAV } from "@/lib/constants/consultant-nav";
import { BaseSidebar } from "./BaseSidebar";
import type { SidebarConfig } from "./types";

const CONSULTANT_CONFIG: SidebarConfig = {
  logo: {
    title: "NU Wellness",
    subtitle: "Consultant Portal",
    href: "/consultant",
    // theme = dark → BaseSidebar auto ใช้ variant="white"
  },
  items: CONSULTANT_NAV,
  theme: "dark",
  backLink: {
    href: "/",
    label: "กลับหน้าหลัก",
  },
};

interface ConsultantSidebarProps {
  isOpen: boolean;
  isCollapsed: boolean;
  onCloseMobile: () => void;
  onToggleCollapse: () => void;
}

export function ConsultantSidebar(props: ConsultantSidebarProps) {
  // ✅ Fetch profile with university info to get Home University ID/Code
  const { me } = useMyProfile({ university: true });
  const [loading, setLoading] = useState(false);

  // ตรวจสอบว่ากำลังถูกยืมตัวอยู่หรือไม่ (Active != Home)
  const isBorrowed =
    me &&
    me.profile?.universityId &&
    me.activeUniversityId !== me.profile.universityId;

  const handleReturnHome = async () => {
    if (!me?.profile?.universityId) return;

    try {
      setLoading(true);
      const targetId = me.profile.universityId;
      const result = await authApi.switchTenant(targetId);

      if (!result.success) {
        alert(result.error || "ไม่สามารถกลับสู่มหาลัยต้นสังกัดได้");
        return;
      }

      // Redirect to Home University Subdomain
      const code = me.profile.universityCode || "";
      const { protocol, targetHost } = buildTargetHostFromTenantCode(code);
      // ไปหน้า Dashboard ของตัวเอง
      window.location.assign(`${protocol}//${targetHost}/consultant`);
    } catch (err) {
      console.error("Return home error:", err);
      alert("เกิดข้อผิดพลาดในการเปลี่ยน tenant");
    } finally {
      setLoading(false);
    }
  };

  const footer = isBorrowed ? (
    <div className="space-y-2">
      {!props.isCollapsed && (
        <div className="text-xs text-center text-gray-500 mb-1">
          คุณกำลังใช้งานในฐานะ<br />
          บุคลากรยืมตัว
        </div>
      )}
      <Button
        variant="outline"
        size="sm"
        className="w-full justify-center gap-2 border-red-200 bg-red-50 text-red-700 hover:bg-red-100 hover:border-red-300 transition-all"
        onClick={handleReturnHome}
        disabled={loading}
        title="กลับสู่มหาลัยต้นสังกัด"
      >
        <LogOut className="w-4 h-4" />
        {!props.isCollapsed && "กลับมหาลัยต้นสังกัด"}
      </Button>
    </div>
  ) : null;

  return <BaseSidebar config={CONSULTANT_CONFIG} footer={footer} {...props} />;
}
