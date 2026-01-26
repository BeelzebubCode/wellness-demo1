// src/app/(tenant)/(booking)/booking/profile/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  User,
  Mail,
  Phone,
  Cake,
  IdCard,
  GraduationCap,
  Building2,
  MapPin,
  Bookmark,
  Shield,
  Loader2,
  AlertCircle,
  Home,
  Briefcase,
} from "lucide-react";

import type { ProfileMeDTO, StudentAddressType } from "@/features/profile/types";
import {
  ProfileHeroCard,
  ProfileDetailsCard,
  type ProfileFieldItem,
  ProfileSection,
} from "@/components/profile/ProfileComponents";

type LoadState =
  | { status: "idle" | "loading" }
  | { status: "error"; message: string }
  | { status: "success"; data: ProfileMeDTO };

function safe(s?: string | null) {
  const t = (s ?? "").trim();
  return t ? t : "-";
}

function formatThaiDateShort(iso?: string | null) {
  if (!iso) return "-";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return "-";
  }
}

function formatAddressType(t: StudentAddressType) {
  return t === "CURRENT" ? "ที่อยู่ปัจจุบัน" : "ที่อยู่ตามทะเบียนบ้าน";
}

function getAddressIcon(t: StudentAddressType) {
  return t === "CURRENT" ? <Home className="w-4 h-4" /> : <MapPin className="w-4 h-4" />;
}

function joinParts(parts: (string | null | undefined)[]) {
  const arr = parts.map((x) => (x ?? "").trim()).filter(Boolean);
  return arr.length ? arr.join(", ") : "-";
}

function SectionHeader({
  title,
  badge,
  subtitle,
  icon,
}: {
  title: string;
  badge?: string;
  subtitle?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-start gap-3 min-w-0">
        {icon ? (
          <div className="mt-0.5 w-10 h-10 rounded-2xl bg-white/70 border border-white/60 shadow-sm backdrop-blur flex items-center justify-center shrink-0">
            <div className="w-7 h-7 rounded-xl icon-tenant flex items-center justify-center">
              {icon}
            </div>
          </div>
        ) : null}

        <div className="min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-lg md:text-xl font-extrabold text-slate-800 tracking-tight">
              {title}
            </h2>

            {badge ? (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-[12px] font-bold border border-[rgba(var(--ring),0.25)] bg-white/60 backdrop-blur">
                <span className="text-[rgb(var(--primary))]">{badge}</span>
              </span>
            ) : null}
          </div>

          {subtitle ? (
            <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function SoftCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={[
        "rounded-3xl bg-white/80 backdrop-blur-xl border border-white/60 shadow-[0_10px_30px_rgba(0,0,0,0.06)]",
        className ?? "",
      ].join(" ")}
    >
      {children}
    </div>
  );
}

export default function StudentProfilePage() {
  const [state, setState] = useState<LoadState>({ status: "idle" });

  useEffect(() => {
    let alive = true;

    async function load() {
      setState({ status: "loading" });
      try {
        const res = await fetch(
          "/api/v2/profile/me?include=university,academic,addresses",
          { credentials: "include", cache: "no-store" }
        );
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json?.error ?? "โหลดโปรไฟล์ไม่สำเร็จ");
        const dto = (json?.data ?? null) as ProfileMeDTO | null;
        if (!dto) throw new Error("ไม่พบข้อมูลโปรไฟล์");
        if (!alive) return;
        setState({ status: "success", data: dto });
      } catch (e: any) {
        if (!alive) return;
        setState({ status: "error", message: e?.message ?? "โหลดโปรไฟล์ไม่สำเร็จ" });
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, []);

  const dto = state.status === "success" ? state.data : null;
  const p = dto?.profile;

  const subtitle = useMemo(() => {
    if (!dto?.profile) return "";
    const uni = dto.profile.universityName ? `• ${dto.profile.universityName}` : "";
    const role = dto.role === "STUDENT" ? "ผู้รับบริการ" : dto.role;
    return `${role} ${uni}`.trim();
  }, [dto]);

  const personalItems: ProfileFieldItem[] = useMemo(() => {
    if (!p) return [];
    return [
      { label: "ชื่อที่แสดง", value: dto?.displayName ?? "-", icon: <User className="w-4 h-4" /> },
      { label: "ชื่อเล่น", value: safe(p.nickname), icon: <Bookmark className="w-4 h-4" /> },
      { label: "เพศ", value: safe(p.gender), icon: <Shield className="w-4 h-4" /> },
      { label: "วันเกิด", value: formatThaiDateShort(p.birthday), icon: <Cake className="w-4 h-4" /> },
      { label: "สัญชาติ", value: safe(p.nationality), icon: <IdCard className="w-4 h-4" /> },
      { label: "ศาสนา", value: safe(p.religion), icon: <Briefcase className="w-4 h-4" /> },
      { label: "กรุ๊ปเลือด", value: safe(p.bloodGroup), icon: <Shield className="w-4 h-4" /> },
    ];
  }, [p, dto?.displayName]);

  const contactItems: ProfileFieldItem[] = useMemo(() => {
    if (!p) return [];
    return [
      { label: "อีเมล", value: safe(p.email), icon: <Mail className="w-4 h-4" /> },
      { label: "เบอร์โทร", value: safe(p.phone), icon: <Phone className="w-4 h-4" /> },
      { label: "มหาวิทยาลัย", value: safe(p.universityName), icon: <Building2 className="w-4 h-4" /> },
    ];
  }, [p]);

  const academicItems: ProfileFieldItem[] = useMemo(() => {
    if (!p) return [];
    return [
      { label: "หลักสูตร/โปรแกรม", value: safe(p.program), icon: <GraduationCap className="w-4 h-4" /> },
      { label: "ระดับการศึกษา", value: safe(p.degree), icon: <GraduationCap className="w-4 h-4" /> },
      { label: "ชื่อระดับ (เต็ม)", value: safe(p.degreeName), icon: <GraduationCap className="w-4 h-4" /> },
      { label: "ปีที่เข้าศึกษา", value: p.admitAcademicYear?.toString() ?? "-", icon: <Bookmark className="w-4 h-4" /> },

      { label: "คณะ", value: safe(p.facultyName), icon: <Building2 className="w-4 h-4" /> },
      { label: "คณะ (EN)", value: safe(p.facultyNameEn), icon: <Building2 className="w-4 h-4" /> },

      { label: "ภาควิชา/สาขา", value: safe(p.departmentName), icon: <Building2 className="w-4 h-4" /> },
      { label: "ภาควิชา/สาขา (EN)", value: safe(p.departmentNameEn), icon: <Building2 className="w-4 h-4" /> },

      { label: "อาจารย์ที่ปรึกษา", value: safe(p.advisorName), icon: <User className="w-4 h-4" /> },
    ];
  }, [p]);

  const addresses = useMemo(() => {
    const arr = p?.addresses ?? [];
    const sorted = arr.slice().sort((a, b) => a.type.localeCompare(b.type));
    return sorted;
  }, [p?.addresses]);

  return (
    <div className="min-h-screen bg-tenant text-slate-900 relative overflow-hidden">
      <main className="relative z-10 max-w-[1200px] mx-auto px-4 md:px-6 py-8 space-y-6 pb-24">
        {/* HERO */}
        <ProfileHeroCard
          name={dto?.displayName ?? "โปรไฟล์"}
          roleLabel={dto?.role === "STUDENT" ? "ผู้รับบริการ" : dto?.role}
          subtitle={subtitle}
          onEdit={() => alert("TODO: เปิดหน้าแก้ไขโปรไฟล์")}
          editText="แก้ไขโปรไฟล์"
        />

        {/* LOADING / ERROR */}
        {state.status === "loading" || state.status === "idle" ? (
          <SoftCard className="p-6 md:p-8">
            <div className="flex items-center gap-3 text-slate-600">
              <Loader2 className="w-5 h-5 animate-spin text-[rgb(var(--primary))]" />
              <p className="text-sm font-semibold">กำลังโหลดข้อมูลโปรไฟล์...</p>
            </div>
          </SoftCard>
        ) : null}

        {state.status === "error" ? (
          <SoftCard className="p-6 md:p-8">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/70 border border-white/60 flex items-center justify-center shrink-0">
                <div className="w-7 h-7 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <AlertCircle className="w-4 h-4" />
                </div>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-extrabold text-slate-800">โหลดไม่สำเร็จ</p>
                <p className="text-sm text-slate-500 mt-1">{state.message}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-3 inline-flex items-center justify-center h-9 px-4 rounded-xl btn-tenant text-sm font-bold shadow-sm outline-none focus-tenant"
                >
                  ลองใหม่
                </button>
              </div>
            </div>
          </SoftCard>
        ) : null}

        {/* CONTENT */}
        {state.status === "success" ? (
          <div className="space-y-6">
            {/* SEGMENT: PERSONAL */}
            <ProfileSection
              title="ข้อมูลส่วนตัว"
              badge="Personal"
              subtitle="ข้อมูลพื้นฐานสำหรับแสดงผลในระบบ"
              rightSlot={null}
            >
              <ProfileDetailsCard title="" items={personalItems} noCard />
            </ProfileSection>

            {/* SEGMENT: CONTACT */}
            <ProfileSection
              title="ข้อมูลติดต่อ"
              badge="Contact"
              subtitle="ข้อมูลที่ใช้สำหรับการติดต่อและยืนยันตัวตน"
            >
              <ProfileDetailsCard title="" items={contactItems} noCard />
            </ProfileSection>

            {/* SEGMENT: ACADEMIC */}
            <ProfileSection
              title="ข้อมูลการศึกษา"
              badge="Academic"
              subtitle="ใช้สำหรับจับคู่บริการ และแสดงผลในระบบ"
            >
              <ProfileDetailsCard title="" items={academicItems} noCard />
            </ProfileSection>
            
            {/* SEGMENT: ADDRESSES */}
            <div className="space-y-3">
              <SoftCard className="p-6 md:p-8">
                {addresses.length === 0 ? (
                  <div className="text-sm text-slate-500">ยังไม่มีข้อมูลที่อยู่</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {addresses.map((a, idx) => (
                      <div
                        key={`${a.type}-${idx}`}
                        className="rounded-3xl bg-white/70 backdrop-blur border border-slate-200/60 shadow-sm overflow-hidden"
                      >
                        <div className="px-4 py-3 border-b border-slate-200/60 bg-white/60">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="w-9 h-9 rounded-2xl bg-white border border-slate-200/60 shadow-sm flex items-center justify-center shrink-0">
                                <div className="w-7 h-7 rounded-xl icon-tenant flex items-center justify-center">
                                  {getAddressIcon(a.type)}
                                </div>
                              </div>
                              <p className="font-extrabold text-slate-800 truncate">
                                {formatAddressType(a.type)}
                              </p>
                            </div>

                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-white border border-[rgba(var(--ring),0.22)] text-[rgb(var(--primary))]">
                              {a.type}
                            </span>
                          </div>
                        </div>

                        <div className="p-4 space-y-3">
                          <FieldRow label="รายละเอียด" value={safe(a.detail)} />
                          <FieldRow label="ตำบล/แขวง" value={safe(a.subDistrict)} />
                          <FieldRow label="อำเภอ/เขต" value={safe(a.district)} />
                          <FieldRow label="จังหวัด" value={safe(a.provinceName)} />
                          <FieldRow label="รหัสไปรษณีย์" value={safe(a.postalCode)} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </SoftCard>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}

function FieldRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <p className="text-[12px] font-bold text-slate-500">{label}</p>
      <p className="text-[13px] font-semibold text-slate-800 text-right leading-snug">
        {value}
      </p>
    </div>
  );
}
