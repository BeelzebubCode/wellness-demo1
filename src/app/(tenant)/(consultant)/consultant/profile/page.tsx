"use client";

import { Card, Button } from "@/components/ui";
import { User, Mail, Globe, Clock, Pencil, Building2 } from "lucide-react";

export default function ConsultantProfilePage() {
  return (
    <div className="relative w-full p-6 md:p-8 bg-transparent">
      {/* ================= TRUE PAGE BACKGROUND ================= */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        {/* BASE */}
        <div className="absolute inset-0 bg-gradient-to-br from-teal-50 via-white to-emerald-50" />

        {/* GLOW */}
        <div className="absolute -top-48 -left-48 w-[560px] h-[560px] rounded-full bg-teal-300/35 blur-3xl" />
        <div className="absolute top-24 -right-48 w-[480px] h-[480px] rounded-full bg-sky-300/35 blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-[640px] h-[360px] rounded-full bg-emerald-300/25 blur-3xl" />

        {/* NOISE */}
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"120\" height=\"120\" viewBox=\"0 0 120 120\"><filter id=\"n\"><feTurbulence type=\"fractalNoise\" baseFrequency=\"0.8\" numOctaves=\"4\"/></filter><rect width=\"120\" height=\"120\" filter=\"url(%23n)\"/></svg>')",
          }}
        />

        {/* VIGNETTE */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-transparent to-white/60" />
      </div>

      {/* ================= CONTENT ================= */}
      <div className="max-w-5xl mx-auto space-y-4 pt-8 md:pt-2">
        {/* TITLE */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
            โปรไฟล์ผู้ให้คำปรึกษา
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            จัดการข้อมูลส่วนตัวและการตั้งค่าบัญชีของคุณ
          </p>
        </div>

        {/* HERO */}
        <Card className="relative overflow-hidden rounded-3xl bg-white/80 backdrop-blur-xl shadow-lg border border-white/60">
          <div className="absolute inset-0 bg-gradient-to-r from-teal-100/60 via-sky-100/50 to-emerald-100/60" />

          <div className="relative p-6 md:p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center ring-4 ring-white shadow-inner">
                  <User className="w-12 h-12 text-teal-600" />
                </div>
                <span className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full" />
              </div>

              <div>
                <p className="text-xl font-bold text-gray-800">
                  ผู้ให้คำปรึกษา
                </p>
                <p className="text-sm text-gray-600">Consultant</p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="gap-2 rounded-full px-4 py-2 bg-white/70 backdrop-blur hover:bg-white"
            >
              <Pencil className="w-4 h-4" />
              แก้ไขโปรไฟล์
            </Button>
          </div>
        </Card>

        {/* DETAILS */}
        <Card className="rounded-3xl bg-white/85 backdrop-blur-xl p-6 md:p-8 shadow-md border border-white/60">
          <h2 className="text-base font-semibold text-gray-800 mb-6">
            ข้อมูลส่วนตัว
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ProfileField label="ชื่อ - นามสกุล" value="ผู้ให้คำปรึกษา" />
            <ProfileField label="ชื่อเล่น" value="-" />
            <ProfileField
              label="อีเมล"
              value="consultant@email.com"
              icon={<Mail className="w-4 h-4" />}
            />
            <ProfileField
              label="ภาษา"
              value="ภาษาไทย"
              icon={<Globe className="w-4 h-4" />}
            />
            <ProfileField
              label="เขตเวลา"
              value="Asia/Bangkok"
              icon={<Clock className="w-4 h-4" />}
            />
            <ProfileField
              label="องค์กร"
              value="กองกิจการนิสิต"
              icon={<Building2 className="w-4 h-4" />}
            />
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ================= FIELD ================= */
function ProfileField({
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
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <div className="flex items-center gap-2 rounded-2xl bg-white/70 backdrop-blur border border-white/60 px-4 py-3 text-sm text-gray-800 hover:bg-white transition">
        {icon && <span className="text-gray-400">{icon}</span>}
        {value}
      </div>
    </div>
  );
}
