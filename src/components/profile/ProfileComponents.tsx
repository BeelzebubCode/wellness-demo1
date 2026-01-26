"use client";

import React from "react";
import { Card, Button } from "@/components/ui";
import { User, Pencil } from "lucide-react";

export type ProfileValue = string | string[];

export type ProfileFieldItem = {
  label: string;
  value: ProfileValue;
  icon?: React.ReactNode;
  asChips?: boolean;
  joinWith?: string;
};

function isEmptyValue(v: ProfileValue) {
  if (Array.isArray(v)) return v.length === 0;
  return !v?.toString().trim();
}

function normalizeValue(v: ProfileValue, joinWith = ", ") {
  if (Array.isArray(v)) return v.join(joinWith);
  return (v ?? "").toString();
}

export function ProfileDetailsCard({
  title,
  items,
  noCard = false,
}: {
  title: string;
  items: ProfileFieldItem[];
  noCard?: boolean;
}) {
  const inner = (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-semibold text-slate-900">{title}</p>
      </div>
      <ProfileGrid items={items} />
    </div>
  );

  // ✅ ใช้ใน ProfileSection → ไม่ต้องห่อ Card ซ้ำ
  if (noCard) return inner;

  // ✅ ใช้เดี่ยว ๆ (เช่น หน้าอื่น)
  return (
    <Card
      className="
        rounded-3xl
        bg-white/85 backdrop-blur-xl
        border border-white/60
        shadow-[0_10px_30px_rgba(15,23,42,0.06)]
        px-6 md:px-8 py-5
      "
    >
      {inner}
    </Card>
  );
}

/* =========================
   NEW: Section wrapper
========================= */
export function ProfileSection({
  title,
  subtitle,
  badge,
  rightSlot,
  children,
}: {
  title: string;
  subtitle?: string;
  badge?: string;
  rightSlot?: React.ReactNode;
  children: React.ReactNode;
}) {


  return (
    <Card
      className="
        rounded-3xl
        bg-white/85 backdrop-blur-xl
        border border-white/60
        shadow-[0_10px_30px_rgba(15,23,42,0.06)]
        overflow-hidden
      "
    >
      {/* header strip */}
      <div className="relative px-6 md:px-8 pt-6 pb-4 overflow-hidden rounded-t-3xl">
        {/* พื้นหลังหัว segment ให้มน */}
        <div className="absolute inset-0 bg-tenant opacity-100" />

        {/* optional: เพิ่ม gradient ให้ดู soft ขึ้น */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/40 via-transparent to-white/20" />

        <div className="relative flex items-start justify-between gap-3">
          {/* content เดิม */}

          <div>
            <div className="flex items-baseline gap-2">
              <h2 className="text-base font-semibold text-slate-900 leading-none">
                {title}
              </h2>

              {badge ? (
                <span
                  className="
                  inline-flex items-center
                  text-[11px] font-medium
                  px-5 py-[5px]
                  rounded-full
                  bg-white/70 border border-primary/20
                  text-primary
                  leading-none
                  translate-y-[-2px]
                "
                >
                  {badge}
                </span>
              ) : null}
            </div>
            {subtitle ? (
              <p className="text-xs text-slate-600 mt-1">{subtitle}</p>
            ) : null}
          </div>

          {rightSlot ? <div className="shrink-0">{rightSlot}</div> : null}
        </div>
      </div>

      <div className="px-6 md:px-8 pb-6 md:pb-8 pt-4">
        {children}
      </div>
    </Card>
  );
}

/* =========================
   Hero
========================= */
export function ProfileHeroCard({
  name,
  roleLabel,
  subtitle,
  onEdit,
  editText = "แก้ไขโปรไฟล์",
}: {
  name: string;
  roleLabel?: string;
  subtitle?: string;
  onEdit?: () => void;
  editText?: string;
}) {
  return (
    <Card className="relative overflow-hidden rounded-3xl bg-white/80 backdrop-blur-xl shadow-lg border border-white/60">
      <div className="absolute inset-0 opacity-70 bg-tenant" />

      <div className="relative p-6 md:p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div className="flex items-center gap-5 min-w-0">
          <div className="relative shrink-0">
            <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center ring-4 ring-white shadow-inner">
              <User className="w-12 h-12 text-primary" />
            </div>
            <span className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full" />
          </div>

          <div className="min-w-0">
            <p className="text-xl font-bold text-slate-900 truncate">{name}</p>
            {roleLabel ? <p className="text-sm text-slate-700">{roleLabel}</p> : null}
            {subtitle ? <p className="text-xs text-slate-600 mt-1">{subtitle}</p> : null}
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={onEdit}
          className="
            gap-2 rounded-full px-4 py-2
            bg-white/80 backdrop-blur hover:bg-white
            border-primary/30
          "
        >
          <Pencil className="w-4 h-4 text-primary" />
          {editText}
        </Button>
      </div>
    </Card>
  );
}

/* =========================
   Fields
========================= */
export function ProfileGrid({ items }: { items: ProfileFieldItem[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
      {items.map((it, idx) => (
        <ProfileField
          key={`${it.label}-${idx}`}
          label={it.label}
          value={it.value}
          icon={it.icon}
          asChips={it.asChips}
          joinWith={it.joinWith}
        />
      ))}
    </div>
  );
}

export function ProfileField({
  label,
  value,
  icon,
  asChips,
  joinWith = ", ",
}: {
  label: string;
  value: ProfileValue;
  icon?: React.ReactNode;
  asChips?: boolean;
  joinWith?: string;
}) {
  const empty = isEmptyValue(value);

  const renderValue = () => {
    if (empty) return <span className="text-slate-500">-</span>;

    if (Array.isArray(value) || asChips) {
      const arr = Array.isArray(value)
        ? value
        : normalizeValue(value, joinWith)
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);

      return (
        <div className="flex flex-wrap gap-2">
          {arr.map((t, i) => (
            <span
              key={`${label}-chip-${i}`}
              className="
                inline-flex items-center
                rounded-full px-3 py-1 text-xs
                bg-primary/5 border border-primary/20
                text-slate-800
              "
              title={t}
            >
              {t}
            </span>
          ))}
        </div>
      );
    }

    const str = normalizeValue(value, joinWith);
    return (
      <span className="truncate" title={str}>
        {str.trim() ? str : "-"}
      </span>
    );
  };

  return (
    <div className="group">
      <p className="text-xs font-medium text-slate-600 mb-2">{label}</p>

      {/* ✅ มนขึ้น + ความสูงบาลานซ์ + text พอดีกับ icon */}
      <div
        className="
          flex items-center gap-3
          rounded-[18px]
          bg-white
          border border-slate-200
          shadow-[0_1px_0_rgba(15,23,42,0.04)]
          px-4 py-3
          text-[15px] text-slate-900
          leading-[22px]
          min-h-[62px]
          transition
          hover:shadow-[0_10px_25px_rgba(15,23,42,0.10)]
          hover:border-primary/30
          focus-tenant
        "
      >
        {icon ? (
          <span
            className="
              w-7 h-7 shrink-0
              rounded-[8px]
              bg-primary/5
              border border-primary/15
              flex items-center justify-center
              text-primary
              transition
              group-hover:border-primary/25
              group-hover:bg-primary/10
            "
          >
            {/* ทำให้ svg ขนาดนิ่ง ๆ */}
            <span className="[&>svg]:w-5 [&>svg]:h-5">{icon}</span>
          </span>
        ) : null}

        {/* ✅ ข้อความอยู่กลางกับไอคอน + ไม่ล้น */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center min-h-[22px]">{renderValue()}</div>
        </div>
      </div>
    </div>
  );
}
