"use client";

import { useEffect, useMemo, useState } from "react";
import AuthLikeBackground from "@/components/layout/background/AuthLikeBackground";
import {
  ProfileHeroCard,
  ProfileDetailsCard,
} from "@/components/profile/ProfileComponents";
import { Mail, Globe, Clock, Building2, User2 } from "lucide-react";

type ProfileType =
  | "STUDENT"
  | "CONSULTANT"
  | "HEAD_CONSULTANT"
  | "RECTOR"
  | "SUPER_ADMIN";

type ProfileMeDTO = {
  role: ProfileType;
  displayName: string;
  profile: {
    type: ProfileType;
    id?: number | null;

    prefix?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    nickname?: string | null;
    email?: string | null;
    phone?: string | null;

    universityId?: number | null;
    organizationName?: string | null;
  };
};

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [me, setMe] = useState<ProfileMeDTO | null>(null);

  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/v2/profile/me", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
          headers: { "Cache-Control": "no-cache" },
        });

        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json?.error ?? "โหลดโปรไฟล์ไม่สำเร็จ");
        if (!json?.data) throw new Error("รูปแบบข้อมูลไม่ถูกต้อง (data หาย)");

        if (!alive) return;
        setMe(json.data as ProfileMeDTO);
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message ?? "โหลดโปรไฟล์ไม่สำเร็จ");
        setMe(null);
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, []);

  const ui = useMemo(() => {
    const role = me?.role ?? "CONSULTANT";
    const p = me?.profile;

    // ชื่อที่โชว์บน hero
    const name = me?.displayName ?? "ผู้ใช้งาน";
    const roleLabel = roleLabelTH(role);

    // details
    const nickname = p?.nickname ?? "-";
    const email = p?.email ?? "-";
    const organization = p?.organizationName ?? "-";

    // ถ้ายังไม่ได้ทำ field language/timezone ใน backend ก็ fix ค่านี้ก่อน
    const language = "ภาษาไทย";
    const timezone = "Asia/Bangkok";

    return {
      name,
      roleLabel,
      nickname,
      email,
      organization,
      language,
      timezone,
    };
  }, [me]);

  return (
    <div className="relative w-full p-6 md:p-8 bg-transparent">
      <AuthLikeBackground />

      <div className="max-w-5xl mx-auto space-y-4 pt-8 md:pt-2">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
            โปรไฟล์
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            จัดการข้อมูลส่วนตัวและการตั้งค่าบัญชีของคุณ
          </p>
        </div>

        {/* Loading / Error */}
        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white/70 backdrop-blur p-5 text-sm text-slate-600">
            กำลังโหลดโปรไฟล์...
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50/70 backdrop-blur p-5 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        {/* HERO */}
        <ProfileHeroCard
          name={ui.name}
          roleLabel={ui.roleLabel}
          subtitle="ข้อมูลนี้ใช้สำหรับการติดต่อและแสดงผลในระบบ"
          onEdit={() => alert("TODO: เปิดหน้า/โมดัลแก้ไขโปรไฟล์")}
        />

        {/* DETAILS */}
        <ProfileDetailsCard
          title="ข้อมูลส่วนตัว"
          items={[
            { label: "ชื่อที่แสดง", value: ui.name, icon: <User2 className="w-4 h-4" /> },
            { label: "ชื่อเล่น", value: ui.nickname },
            { label: "อีเมล", value: ui.email, icon: <Mail className="w-4 h-4" /> },
            { label: "ภาษา", value: ui.language, icon: <Globe className="w-4 h-4" /> },
            { label: "เขตเวลา", value: ui.timezone, icon: <Clock className="w-4 h-4" /> },
            { label: "องค์กร", value: ui.organization, icon: <Building2 className="w-4 h-4" /> },
          ]}
        />
      </div>
    </div>
  );
}
