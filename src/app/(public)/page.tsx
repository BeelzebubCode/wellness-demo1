"use client";

import Link from "next/link";
import {
  Heart,
  CalendarDays,
  ClipboardList,
  Lock,
  Users,
  Smartphone,
  Clock,
  User,
} from "lucide-react";
import AuthLikeBackground from "@/components/layout/background/AuthLikeBackground";
import { PRGrid } from "@/components/public/pr/PRGrid";
import { PRCard } from "@/components/public/pr/PRCard";
import { PR_MOCK } from "@/features/pr/mock";

const BRAND = {
  teal: "#2FA4A9",
  tealHover: "#278F93",
  mintBg: "#F7FAF9",
  mintSoft: "#E6F5F5",
  border: "#D1EAEA",
  deep: "#1F3D3D",
};

function formatThaiDateShort(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("th-TH", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export default function HomePage() {
  return (
    <div className="min-h-screen w-full bg-white relative overflow-hidden">
      {/* ✅ background blobs (เหมือนหน้า login) */}
      <AuthLikeBackground />

      {/* ✅ เนื้อหาทั้งหน้าให้ทับ background ได้ */}
      <main className="relative z-10">
        {/* ✅ กันชิด header: ปรับ pt ให้เข้ากับความสูง header ของคุณ */}
        <div className="pt-24 md:pt-28" />

        {/* ------------------------------------------------------- */}
        {/* 🟩 Hero */}
        {/* ------------------------------------------------------- */}
        <section className="bg-transparent">
          <div className="max-w-7xl mx-auto px-6">
            <div
              className="
                rounded-[32px]
                border border-[rgba(209,234,234,0.9)]
                bg-white/70 backdrop-blur
                shadow-[0_18px_55px_rgba(2,6,23,0.08)]
                overflow-hidden
              "
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10 p-8 md:p-12 items-center">
                {/* Left */}
                <div>
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/70 border border-[rgba(209,234,234,0.9)] text-[#1F3D3D] text-sm font-semibold shadow-sm">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ background: BRAND.teal }}
                    />
                    NU Wellness Center
                  </div>

                  <h1 className="text-4xl md:text-5xl font-semibold text-slate-900 leading-tight mt-5">
                    ดูแลใจคุณ <br />
                    <span
                      className="italic font-serif"
                      style={{ color: BRAND.teal }}
                    >
                      อย่างอ่อนโยน
                    </span>
                  </h1>

                  <p className="text-slate-600 mt-6 max-w-md leading-relaxed">
                    ระบบจองคิวให้คำปรึกษาสุขภาพจิตสำหรับนิสิต
                    ดูแลคุณด้วยความเข้าใจ ความเป็นส่วนตัว และความใส่ใจ
                  </p>

                  {/* CTA */}
                  <div className="mt-8 flex flex-col sm:flex-row gap-3">
                    <Link
                      href="/booking"
                      className="
                        px-7 py-3 rounded-full
                        text-white text-sm font-semibold
                        shadow-md
                        transition
                        inline-flex items-center justify-center gap-2
                      "
                      style={{ background: BRAND.teal }}
                    >
                      <CalendarDays className="w-4 h-4" />
                      จองคิวปรึกษา
                    </Link>

                    <Link
                      href="/booking/my-appointments"
                      className="
                        px-7 py-3 rounded-full
                        bg-white
                        text-sm font-semibold
                        transition
                        inline-flex items-center justify-center gap-2
                        hover:bg-[rgba(230,245,245,0.7)]
                      "
                      style={{
                        border: `1px solid ${BRAND.border}`,
                        color: BRAND.deep,
                      }}
                    >
                      <ClipboardList className="w-4 h-4" />
                      ตารางนัดของฉัน
                    </Link>
                  </div>
                </div>

                {/* Right Image */}
                <div className="relative">
                  <div
                    className="
                      rounded-3xl overflow-hidden
                      bg-white
                      border border-[rgba(209,234,234,0.9)]
                      shadow-[0_16px_45px_rgba(2,6,23,0.10)]
                    "
                  >
                    <img
                      src="/images/login-illustration.png"
                      alt="NU Wellness Center"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* spacing ต่อ section */}
            <div className="h-10 md:h-14" />
          </div>
        </section>

        {/* ------------------------------------------------------- */}
        {/* 🟪 How it Works */}
        {/* ------------------------------------------------------- */}
        <section className="bg-transparent">
          <div className="max-w-7xl mx-auto px-6 pb-20">
            <div className="text-center mb-12">
              <div
                className="
                  inline-flex items-center gap-2 px-4 py-1.5 rounded-full
                  bg-white/70 backdrop-blur
                  border
                  text-sm font-semibold shadow-sm
                "
                style={{ borderColor: BRAND.border, color: BRAND.deep }}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ background: BRAND.teal }}
                />
                ขั้นตอนการใช้งาน
              </div>

              <h2 className="text-3xl font-bold text-slate-900 mt-4 mb-2">
                วิธีใช้งาน
              </h2>
              <p className="text-slate-600">ง่าย ๆ เพียงไม่กี่ขั้นตอน</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-7">
              {[
                {
                  icon: (
                    <User className="w-6 h-6" style={{ color: BRAND.teal }} />
                  ),
                  title: "เข้าสู่ระบบ",
                  desc: "เข้าสู่ระบบด้วย LINE Account",
                  step: 1,
                },
                {
                  icon: (
                    <CalendarDays
                      className="w-6 h-6"
                      style={{ color: BRAND.teal }}
                    />
                  ),
                  title: "เลือกวันเวลา",
                  desc: "เลือกเวลาที่คุณสะดวก",
                  step: 2,
                },
                {
                  icon: (
                    <ClipboardList
                      className="w-6 h-6"
                      style={{ color: BRAND.teal }}
                    />
                  ),
                  title: "กรอกข้อมูล",
                  desc: "ระบุรายละเอียดที่ต้องการปรึกษา",
                  step: 3,
                },
                {
                  icon: (
                    <Heart className="w-6 h-6" style={{ color: BRAND.teal }} />
                  ),
                  title: "ยืนยันการจอง",
                  desc: "รับการแจ้งเตือนผ่าน LINE",
                  step: 4,
                },
              ].map((item) => (
                <div
                  key={item.step}
                  className="
                    relative
                    rounded-3xl p-7
                    bg-white/70 backdrop-blur
                    border
                    shadow-[0_14px_40px_rgba(2,6,23,0.06)]
                    hover:shadow-[0_22px_70px_rgba(47,164,169,0.16)]
                    hover:-translate-y-1
                    transition-all
                    text-center
                  "
                  style={{ borderColor: BRAND.border }}
                >
                  {/* Step Bubble */}
                  <div
                    className="
                      absolute -top-3 -right-3
                      w-10 h-10 rounded-full
                      text-white font-bold
                      flex items-center justify-center
                      shadow-md
                    "
                    style={{
                      background: `linear-gradient(135deg, ${BRAND.teal} 0%, #10B981 100%)`,
                    }}
                  >
                    {item.step}
                  </div>

                  {/* Icon */}
                  <div
                    className="w-14 h-14 rounded-2xl bg-white border shadow-sm flex items-center justify-center mx-auto mb-5"
                    style={{ borderColor: BRAND.border }}
                  >
                    {item.icon}
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 mb-2">
                    {item.title}
                  </h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
        {/* ------------------------------------------------------- */}
        {/* 📰 PR (ใช้ PRGrid ที่มีอยู่) */}
        {/* ------------------------------------------------------- */}
        <section className="bg-transparent">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div className="min-w-0">
                <div
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/70 backdrop-blur border text-xs font-semibold shadow-sm"
                  style={{ borderColor: BRAND.border, color: BRAND.deep }}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ background: BRAND.teal }}
                  />
                  ข่าวประชาสัมพันธ์
                </div>

                <h2 className="mt-3 text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                  อัปเดตล่าสุดสำหรับนิสิต
                </h2>

                <p className="mt-1 text-sm text-slate-600">
                  รวมข่าวสารและประกาศสำคัญจากมหาวิทยาลัย
                </p>
              </div>

              <Link
                href="/pr"
                className="shrink-0 inline-flex items-center gap-2 rounded-full px-4 py-2 bg-white/60 backdrop-blur border text-xs font-semibold shadow-sm hover:shadow-md transition"
                style={{ borderColor: BRAND.border, color: BRAND.deep }}
              >
                ดูทั้งหมด
                <span
                  className="text-base leading-none"
                  style={{ color: BRAND.teal }}
                >
                  ›
                </span>
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {PR_MOCK.slice(0, 3).map((it) => (
                <PRCard key={it.id} item={it} />
              ))}
            </div>

            <div className="h-14" />
          </div>
        </section>
      </main>
    </div>
  );
}
