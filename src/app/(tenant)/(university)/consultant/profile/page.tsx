"use client";

import { useMemo } from "react";
import AuthLikeBackground from "@/components/layout/background/AuthLikeBackground";
import {
  ProfileHeroCard,
  ProfileSection,
  ProfileGrid,
} from "@/components/profile/ProfileComponents";
import {
  Mail,
  Globe,
  Clock,
  Building2,
  User2,
  GraduationCap,
  BadgeCheck,
  Sparkles,
  Phone,
} from "lucide-react";
import { useMyProfile } from "@/features/profile/hooks/useMyProfile";
import type { ProfileType } from "@/features/profile/types";

function roleLabelTH(role: ProfileType) {
  switch (role) {
    case "CONSULTANT":
      return "ผู้ให้คำปรึกษา";
    case "HEAD_CONSULTANT":
      return "หัวหน้าผู้ให้คำปรึกษา";
    case "RECTOR":
      return "ผู้บริหาร";
    case "SUPER_ADMIN":
      return "ผู้ดูแลระบบ";
    case "STUDENT":
    default:
      return "นิสิต";
  }
}

export default function ConsultantProfilePage() {
  const { loading, error, me, refetch } = useMyProfile({
    organization: true,
    university: true,
    languages: true,
    specializations: true,
  });

  const ui = useMemo(() => {
    const role = (me?.role ?? "CONSULTANT") as ProfileType;
    const p = me?.profile;

    const name = me?.displayName ?? "ผู้ใช้งาน";
    const roleLabel = roleLabelTH(role);

    const nickname = p?.nickname ?? "-";
    const email = p?.email ?? "-";
    const phone = p?.phone ?? "-";

    const organization = p?.organizationName ?? "-";
    const university = p?.universityName ?? "-";

    const languages =
      (p?.languages ?? []).map((l) =>
        `${l.code}${l.fluencyLevel ? ` (${l.fluencyLevel})` : ""}`
      );

    const specializations = p?.specializations ?? [];

    const timezone = "Asia/Bangkok";

    return {
      name,
      roleLabel,
      nickname,
      email,
      phone,
      organization,
      university,
      languages,
      specializations,
      timezone,
    };
  }, [me]);

  return (
    <div className="relative w-full p-6 md:p-8 bg-transparent">
      <AuthLikeBackground />

      <div className="max-w-5xl mx-auto space-y-4 pt-8 md:pt-2">

        {/* 1) OVERVIEW */}
        <ProfileHeroCard
          name={ui.name}
          roleLabel={ui.roleLabel}
          subtitle="ข้อมูลนี้ใช้สำหรับการติดต่อและแสดงผลในระบบ"
          onEdit={() => alert("TODO: เปิดหน้า/โมดัลแก้ไขโปรไฟล์")}
        />

        {/* 2) PERSONAL INFO */}
        <ProfileSection
          title="ข้อมูลติดต่อ"
          subtitle="ข้อมูลที่ใช้สำหรับการติดต่อและยืนยันตัวตน"
          badge="Personal"
        >
          <ProfileGrid
            items={[
              { label: "ชื่อที่แสดง", value: ui.name, icon: <User2 className="w-4 h-4" /> },
              { label: "ชื่อเล่น", value: ui.nickname, icon: <Sparkles className="w-4 h-4" /> },
              { label: "อีเมล", value: ui.email, icon: <Mail className="w-4 h-4" /> },
              { label: "เบอร์โทร", value: ui.phone, icon: <Phone className="w-4 h-4" /> },
            ]}
          />
        </ProfileSection>

        {/* 3) PROFESSIONAL */}
        <ProfileSection
          title="ข้อมูลวิชาชีพ"
          subtitle="ใช้สำหรับจับคู่ผู้รับบริการ และแสดงผลในระบบจองคิว"
          badge="Professional"
        >
          <ProfileGrid
            items={[
              { label: "ภาษา", value: ui.languages, icon: <Globe className="w-4 h-4" /> },
              {
                label: "ความเชี่ยวชาญ",
                value: ui.specializations,
                icon: <BadgeCheck className="w-4 h-4" />,
              },
              { label: "เขตเวลา", value: ui.timezone, icon: <Clock className="w-4 h-4" /> },
              { label: "องค์กร", value: ui.organization, icon: <Building2 className="w-4 h-4" /> },
              { label: "มหาวิทยาลัย", value: ui.university, icon: <GraduationCap className="w-4 h-4" /> },
            ]}
          />
        </ProfileSection>
      </div>
    </div>
  );
}
