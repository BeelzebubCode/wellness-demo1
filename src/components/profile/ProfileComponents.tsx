"use client";

import React from "react";
import { Card, Button } from "@/components/ui";
import { User, Pencil } from "lucide-react";

export type ProfileFieldItem = {
  label: string;
  value: string;
  icon?: React.ReactNode;
};

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
      {/* overlay soft: ใช้ accent/primary ผ่าน class icon-tenant */}
      <div className="absolute inset-0 opacity-60 bg-tenant" />

      <div className="relative p-6 md:p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div className="flex items-center gap-5 min-w-0">
          <div className="relative shrink-0">
            <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center ring-4 ring-white shadow-inner">
              {/* ✅ ใช้สี tenant */}
              <User className="w-12 h-12 text-primary" />
            </div>

            {/* online dot (สีนี้โอเคเป็นกลางทุก tenant) */}
            <span className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full" />
          </div>

          <div className="min-w-0">
            <p className="text-xl font-bold text-slate-800 truncate">{name}</p>
            {roleLabel ? (
              <p className="text-sm text-slate-600">{roleLabel}</p>
            ) : null}
            {subtitle ? (
              <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
            ) : null}
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={onEdit}
          className="gap-2 rounded-full px-4 py-2 bg-white/70 backdrop-blur hover:bg-white border-primary/30"
        >
          <Pencil className="w-4 h-4 text-primary" />
          {editText}
        </Button>
      </div>
    </Card>
  );
}

export function ProfileDetailsCard({
  title = "ข้อมูลส่วนตัว",
  items,
}: {
  title?: string;
  items: ProfileFieldItem[];
}) {
  return (
    <Card className="rounded-3xl bg-white/85 backdrop-blur-xl p-6 md:p-8 shadow-md border border-white/60">
      <h2 className="text-base font-semibold text-slate-800 mb-6">{title}</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {items.map((it, idx) => (
          <ProfileField
            key={`${it.label}-${idx}`}
            label={it.label}
            value={it.value}
            icon={it.icon}
          />
        ))}
      </div>
    </Card>
  );
}

export function ProfileField({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs text-slate-500 mb-1">{label}</p>

      {/* ✅ focus ใช้ class focus-tenant จาก tenants.css */}
      <div className="flex items-center gap-2 rounded-2xl bg-white/70 backdrop-blur border border-white/60 px-4 py-3 text-sm text-slate-800 hover:bg-white transition focus-tenant">
        {icon ? <span className="text-slate-400">{icon}</span> : null}
        <span className="truncate">{value?.trim() ? value : "-"}</span>
      </div>
    </div>
  );
}
