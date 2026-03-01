// components/layout/sidebar/ConsultantSidebar.tsx
"use client";

import { useMemo, useState } from "react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useMyProfile } from "@/features/profile/hooks/useMyProfile";
import { authApi } from "@/features/auth/api";
import { useConsultantAssignedCount } from "@/features/consultant/my-jobs/hooks/useConsultantAssignedCount";

import { CONSULTANT_NAV } from "@/lib/constants/consultant-nav";
import { BaseSidebar } from "./BaseSidebar";
import type { SidebarConfig } from "./types";

const DEFAULT_CONSULTANT_CONFIG: SidebarConfig = {
  logo: {
    title: "NU Wellness",
    subtitle: "Consultant Portal",
    href: "/consultant",
  },
  items: CONSULTANT_NAV,
  theme: "dark",
};

interface ConsultantSidebarProps {
  isOpen: boolean;
  isCollapsed: boolean;
  onCloseMobile: () => void;
  onToggleCollapse: () => void;
}

export function ConsultantSidebar(props: ConsultantSidebarProps) {
  const { me } = useMyProfile({ university: true });
  const [loading, setLoading] = useState(false);

  // ✅ Fetch assigned count for badge
  const { data: assignedCount } = useConsultantAssignedCount();

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

      window.location.assign("/consultant/my-jobs");
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

  const configWithBadge = useMemo(() => {
    if (!assignedCount || assignedCount <= 0) return DEFAULT_CONSULTANT_CONFIG;

    const newItems = CONSULTANT_NAV.map((item) => {
      // Add badge to "งานของฉัน" (My Jobs)
      if (item.href === "/consultant/my-jobs") {
        return { ...item, badge: assignedCount };
      }
      return item;
    });

    return { ...DEFAULT_CONSULTANT_CONFIG, items: newItems };
  }, [assignedCount]);

  return <BaseSidebar config={configWithBadge} footer={footer} {...props} />;
}
