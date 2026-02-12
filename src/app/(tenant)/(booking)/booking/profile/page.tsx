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
  | {
    status: "success";
    dataTh: ProfileMeDTO; // ข้อมูลหลัก (TH)
    dataEn: ProfileMeDTO | null; // ข้อมูล EN (optional)
  };

function safe(s?: string | null) {
  const t = (s ?? "").trim();
  return t ? t : "-";
}

function isMeaningful(v?: string | null) {
  const t = (v ?? "").trim();
  return !!t && t !== "-";
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

// แปลง enum/code ให้เป็น label อ่านง่าย
function genderLabel(code?: string | null) {
  const v = String(code ?? "").trim();
  if (!v) return "-";
  const map: Record<string, string> = {
    MALE: "ชาย",
    FEMALE: "หญิง",
    OTHER: "อื่น ๆ",
    UNDISCLOSED: "ไม่ระบุ",
    NOT_SPECIFIED: "ไม่ระบุ",
    LGBTQ_PLUS: "LGBTQ+",
    LGBTQPLUS: "LGBTQ+",
  };
  return map[v] ?? v; // ถ้าไม่รู้จัก ก็โชว์ raw
}

function SoftCard({ children, className }: { children: React.ReactNode; className?: string }) {
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

function FieldRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <p className="text-[12px] font-bold text-slate-500">{label}</p>
      <p className="text-[13px] font-semibold text-slate-800 text-right leading-snug">{value}</p>
    </div>
  );
}

async function fetchMe(lang: "th" | "en") {
  const res = await fetch(
    `/api/v2/profile/me?include=university,academic,addresses&lang=${lang}`,
    { credentials: "include", cache: "no-store" }
  );

  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.error ?? "โหลดโปรไฟล์ไม่สำเร็จ");

  const dto = (json?.data ?? null) as ProfileMeDTO | null;
  if (!dto) throw new Error("ไม่พบข้อมูลโปรไฟล์");
  return dto;
}

export default function StudentProfilePage() {
  const [state, setState] = useState<LoadState>({ status: "idle" });

  useEffect(() => {
    let alive = true;

    async function load() {
      setState({ status: "loading" });
      try {
        // ✅ ดึง TH เป็นหลัก + ดึง EN เพื่อโชว์ฟิลด์ (EN) ให้ครบ
        const [th, en] = await Promise.all([
          fetchMe("th"),
          fetchMe("en").catch(() => null), // EN optional
        ]);

        if (!alive) return;
        setState({ status: "success", dataTh: th, dataEn: en });
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

  const dtoTh = state.status === "success" ? state.dataTh : null;
  const dtoEn = state.status === "success" ? state.dataEn : null;

  const pTh = dtoTh?.profile ?? null;
  const pEn = dtoEn?.profile ?? null;

  const isStudent = dtoTh?.role === "STUDENT";

  const subtitle = useMemo(() => {
    if (!dtoTh?.profile) return "";
    const uni = dtoTh.profile.universityName ? `• ${dtoTh.profile.universityName}` : "";
    const roleLabel = dtoTh.role === "STUDENT" ? "ผู้รับบริการ" : dtoTh.role;
    return `${roleLabel} ${uni}`.trim();
  }, [dtoTh]);

  // -------------------------
  // PERSONAL (ครบ)
  // -------------------------
  const personalItems: ProfileFieldItem[] = useMemo(() => {
    if (!dtoTh || !pTh) return [];

    const items: ProfileFieldItem[] = [
      // Row 1: ชื่อที่แสดง | คำนำหน้า
      { label: "ชื่อที่แสดง", value: safe(dtoTh.displayName), icon: <User className="w-4 h-4" /> },
      { label: "คำนำหน้า", value: safe(pTh.prefix), icon: <User className="w-4 h-4" /> },

      // Row 2: ชื่อ (TH) | นามสกุล (TH)
      { label: "ชื่อ", value: safe(pTh.firstName), icon: <User className="w-4 h-4" /> },
      { label: "นามสกุล", value: safe(pTh.lastName), icon: <User className="w-4 h-4" /> },
    ];

    // Row 3: ชื่อ (EN) | นามสกุล (EN)
    if (pEn && (isMeaningful(pEn.firstName) || isMeaningful(pEn.lastName))) {
      items.push(
        { label: "ชื่อ (EN)", value: safe(pEn.firstName), icon: <User className="w-4 h-4" /> },
        { label: "นามสกุล (EN)", value: safe(pEn.lastName), icon: <User className="w-4 h-4" /> },
      );
    }

    // Row 4: ชื่อเล่น (TH) | ชื่อเล่น (EN)
    if (pEn && isMeaningful(pEn.nickname)) {
      items.push(
        { label: "ชื่อเล่น", value: safe(pTh.nickname), icon: <Bookmark className="w-4 h-4" /> },
        { label: "ชื่อเล่น (EN)", value: safe(pEn.nickname), icon: <Bookmark className="w-4 h-4" /> },
      );
    } else {
      items.push(
        { label: "ชื่อเล่น", value: safe(pTh.nickname), icon: <Bookmark className="w-4 h-4" /> },
      );
    }

    if (isStudent) {
      items.push(
        // Row: เพศ | วันเกิด
        { label: "เพศ", value: genderLabel(pTh.gender), icon: <Shield className="w-4 h-4" /> },
        { label: "วันเกิด", value: formatThaiDateShort(pTh.birthday), icon: <Cake className="w-4 h-4" /> },
        // Row: สัญชาติ | ศาสนา
        { label: "สัญชาติ", value: safe(pTh.nationality), icon: <IdCard className="w-4 h-4" /> },
        { label: "ศาสนา", value: safe(pTh.religion), icon: <Briefcase className="w-4 h-4" /> },
        // Row: กรุ๊ปเลือด
        { label: "กรุ๊ปเลือด", value: safe(pTh.bloodGroup), icon: <Shield className="w-4 h-4" /> },
      );
    }

    return items;
  }, [dtoTh, pTh, pEn, isStudent]);

  // -------------------------
  // CONTACT (ครบ)
  // -------------------------
  const contactItems: ProfileFieldItem[] = useMemo(() => {
    if (!pTh) return [];
    const items: ProfileFieldItem[] = [
      { label: "อีเมล", value: safe(pTh.email), icon: <Mail className="w-4 h-4" /> },
      { label: "เบอร์โทร", value: safe(pTh.phone), icon: <Phone className="w-4 h-4" /> },
      { label: "มหาวิทยาลัย", value: safe(pTh.universityName), icon: <Building2 className="w-4 h-4" /> },
    ];
    return items;
  }, [pTh]);

  // -------------------------
  // ACADEMIC (ครบ)
  // -------------------------
  const academicItems: ProfileFieldItem[] = useMemo(() => {
    if (!pTh) return [];
    return [
      { label: "หลักสูตร/โปรแกรม", value: safe(pTh.program), icon: <GraduationCap className="w-4 h-4" /> },
      { label: "ระดับการศึกษา", value: safe(pTh.degree), icon: <GraduationCap className="w-4 h-4" /> },
      { label: "ชื่อระดับ (เต็ม)", value: safe(pTh.degreeName), icon: <GraduationCap className="w-4 h-4" /> },
      { label: "ปีที่เข้าศึกษา", value: pTh.admitAcademicYear?.toString() ?? "-", icon: <Bookmark className="w-4 h-4" /> },

      { label: "คณะ", value: safe(pTh.facultyName), icon: <Building2 className="w-4 h-4" /> },
      { label: "คณะ (EN)", value: safe(pTh.facultyNameEn), icon: <Building2 className="w-4 h-4" /> },
      { label: "ภาควิชา/สาขา", value: safe(pTh.departmentName), icon: <Building2 className="w-4 h-4" /> },
      { label: "ภาควิชา/สาขา (EN)", value: safe(pTh.departmentNameEn), icon: <Building2 className="w-4 h-4" /> },

      { label: "อาจารย์ที่ปรึกษา", value: safe(pTh.advisorName), icon: <User className="w-4 h-4" /> },
    ];
  }, [pTh]);

  const addresses = useMemo(() => {
    const arr = pTh?.addresses ?? [];
    return arr.slice().sort((a, b) => a.type.localeCompare(b.type));
  }, [pTh?.addresses]);

  const hasAcademic =
    !!pTh &&
    (pTh.program != null ||
      pTh.degree != null ||
      pTh.degreeName != null ||
      pTh.facultyName != null ||
      pTh.departmentName != null ||
      pTh.admitAcademicYear != null ||
      pTh.advisorName != null);

  const hasAddresses = addresses.length > 0;

  return (
    <div className="min-h-screen bg-tenant text-slate-900 relative overflow-hidden">
      <main className="relative z-10 max-w-[1200px] mx-auto px-4 md:px-6 py-8 space-y-6 pb-24">
        {/* HERO */}
        <ProfileHeroCard
          name={dtoTh?.displayName ?? "โปรไฟล์"}
          roleLabel={dtoTh?.role === "STUDENT" ? "ผู้รับบริการ" : dtoTh?.role}
          subtitle={subtitle}
          onEdit={() => alert("TODO: เปิดหน้าแก้ไขโปรไฟล์")}
          editText="แก้ไขโปรไฟล์"
        />

        {/* LOADING */}
        {state.status === "loading" || state.status === "idle" ? (
          <SoftCard className="p-6 md:p-8">
            <div className="flex items-center gap-3 text-slate-600">
              <Loader2 className="w-5 h-5 animate-spin text-[rgb(var(--primary))]" />
              <p className="text-sm font-semibold">กำลังโหลดข้อมูลโปรไฟล์...</p>
            </div>
          </SoftCard>
        ) : null}

        {/* ERROR */}
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
        {state.status === "success" && dtoTh && pTh ? (
          <div className="space-y-6">
            {/* PERSONAL */}
            <ProfileSection
              title="ข้อมูลส่วนตัว"
              badge="Personal"
              subtitle="ข้อมูลพื้นฐานจากฐานข้อมูล"
              rightSlot={null}
            >
              <ProfileDetailsCard title="" items={personalItems} noCard />
            </ProfileSection>

            {/* CONTACT */}
            <ProfileSection
              title="ข้อมูลติดต่อ"
              badge="Contact"
              subtitle="ข้อมูลสำหรับการติดต่อและยืนยันตัวตน"
            >
              <ProfileDetailsCard title="" items={contactItems} noCard />
            </ProfileSection>

            {/* ACADEMIC */}
            {isStudent ? (
              hasAcademic ? (
                <ProfileSection
                  title="ข้อมูลการศึกษา"
                  badge="Academic"
                  subtitle="ข้อมูลการศึกษาในระบบ"
                >
                  <ProfileDetailsCard title="" items={academicItems} noCard />
                </ProfileSection>
              ) : (
                <SoftCard className="p-6 md:p-8">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200/60 shadow-sm flex items-center justify-center">
                      <GraduationCap className="w-5 h-5 text-slate-500" />
                    </div>
                    <div>
                      <p className="text-sm font-extrabold text-slate-800">ข้อมูลการศึกษา</p>
                      <p className="text-sm text-slate-500 mt-0.5">ยังไม่มีข้อมูลการศึกษาในระบบ</p>
                    </div>
                  </div>
                </SoftCard>
              )
            ) : null}

            {/* ADDRESSES */}
            {isStudent ? (
              hasAddresses ? (
                <SoftCard className="p-6 md:p-8">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-lg font-extrabold text-slate-800">ที่อยู่</p>
                      <p className="text-sm text-slate-500">ข้อมูลที่อยู่จากฐานข้อมูล</p>
                    </div>
                  </div>

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
                </SoftCard>
              ) : (
                <SoftCard className="p-6 md:p-8">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200/60 shadow-sm flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-slate-500" />
                    </div>
                    <div>
                      <p className="text-sm font-extrabold text-slate-800">ที่อยู่</p>
                      <p className="text-sm text-slate-500 mt-0.5">ยังไม่มีข้อมูลที่อยู่ในระบบ</p>
                    </div>
                  </div>
                </SoftCard>
              )
            ) : null}
          </div>
        ) : null}
      </main>
    </div>
  );
}
