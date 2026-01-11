// components/layout/PublicFooter.tsx
"use client";

import Link from "next/link";
import { APP_CONFIG } from "@/lib/constants";
import {
  Mail,
  Phone,
  ShieldCheck,
  ExternalLink,
  Info,
  Newspaper,
  MapPin,
} from "lucide-react";
import { GoogleMapEmbed } from "@/components/shared/GoogleMapEmbed";
import { BrandLogo } from "@/components/shared";
import AuthLikeBackground from "@/components/layout/background/AuthLikeBackground";

export function PublicFooter() {
  const mapHref =
    "https://www.google.com/maps/place/%E0%B8%81%E0%B8%AD%E0%B8%87%E0%B8%81%E0%B8%B4%E0%B8%88%E0%B8%81%E0%B8%B2%E0%B8%A3%E0%B8%99%E0%B8%B4%E0%B8%AA%E0%B8%B4%E0%B8%95+%E0%B8%A1%E0%B8%AB%E0%B8%B2%E0%B8%A7%E0%B8%B4%E0%B8%97%E0%B8%A2%E0%B8%B2%E0%B8%A5%E0%B8%B1%E0%B8%A2%E0%B8%99%E0%B9%80%E0%B8%A3%E0%B8%A8%E0%B8%A7%E0%B8%A3";

  return (
    <footer className="relative overflow-hidden">
      {/* ✅ ใช้ background เดียวกับหน้า login / หน้าแรก */}
      <div className="absolute inset-0 -z-10 opacity-80">
        <AuthLikeBackground />
      </div>

      {/* ✅ glass layer เหมือน header */}
      <div className="absolute inset-0 bg-white/35 backdrop-blur-xl" />
      <div className="absolute inset-x-0 top-0 h-px bg-[#D1EAEA]/70" />

      <div className="relative">
        <div className="max-w-7xl mx-auto px-4 py-14">
          {/* ===== Top Grid ===== */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
            {/* Brand */}
            <div className="lg:col-span-4">
              <BrandLogo
                asLink
                href="/"
                size={44}
                showText
                subtitle="Student Portal"
                variant="default"
                className="gap-3"
                textClassName="text-slate-900"
              />

              <p className="mt-3 text-slate-600 text-sm leading-relaxed">
                ระบบบริการให้คำปรึกษาสำหรับนิสิตมหาวิทยาลัยนเรศวร
                ใช้งานง่าย ปลอดภัย และเป็นส่วนตัว
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                <Link
                  href="/about"
                  className="inline-flex items-center gap-2 rounded-full
                             bg-white/55 hover:bg-white/75
                             border border-[#D1EAEA]/70
                             px-3 py-2 text-xs font-semibold text-[#1F3D3D] transition"
                >
                  <Info className="w-4 h-4 text-[#2FA4A9]" />
                  เกี่ยวกับเรา
                </Link>

                <Link
                  href="/pr"
                  className="inline-flex items-center gap-2 rounded-full
                             bg-white/55 hover:bg-white/75
                             border border-[#D1EAEA]/70
                             px-3 py-2 text-xs font-semibold text-[#1F3D3D] transition"
                >
                  <Newspaper className="w-4 h-4 text-[#2FA4A9]" />
                  ประชาสัมพันธ์
                </Link>

                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 rounded-full
                             bg-[#2FA4A9] hover:bg-[#278F93]
                             text-white px-3 py-2 text-xs font-extrabold
                             shadow-sm transition"
                >
                  เข้าสู่ระบบ
                  <ExternalLink className="w-4 h-4" />
                </Link>
              </div>

              <p className="mt-6 text-xs text-slate-500">
                © {new Date().getFullYear()} {APP_CONFIG.name}. All rights reserved.
              </p>
            </div>

            {/* Contact */}
            <div className="lg:col-span-3">
              <div className="rounded-2xl bg-white/55 border border-[#D1EAEA]/70 p-5">
                <p className="font-extrabold text-sm text-slate-900">ติดต่อเรา</p>

                <div className="mt-3 space-y-2.5">
                  <a
                    href="tel:055961273"
                    className="flex items-center gap-2 text-slate-700 text-sm"
                  >
                    <Phone className="w-4 h-4 text-[#2FA4A9]" />
                    055-961-273
                  </a>

                  <a
                    href="mailto:support@wellness.nu.ac.th"
                    className="flex items-center gap-2 text-slate-700 text-sm"
                  >
                    <Mail className="w-4 h-4 text-[#2FA4A9]" />
                    support@wellness.nu.ac.th
                  </a>

                  <a
                    href={mapHref}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700"
                  >
                    <MapPin className="w-4 h-4 text-[#2FA4A9]" />
                    เปิดแผนที่ Google Maps
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>

            {/* Map */}
            <div className="lg:col-span-5">
              <div className="rounded-2xl overflow-hidden border border-[#D1EAEA]/70 bg-white/55">
                <GoogleMapEmbed
                  title="ศูนย์สุขภาวะนิสิต มหาวิทยาลัยนเรศวร"
                  subtitle="Naresuan University Wellness Center"
                  href={mapHref}
                  imageSrc="/images/maps/wellness-map.png"
                  heightClassName="h-[240px] sm:h-[280px] lg:h-[320px]"
                />
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="mt-10 border-t border-[#D1EAEA]/70" />

          {/* Bottom */}
          <div className="pt-6 text-center">
            <p className="inline-flex items-center gap-2 text-slate-600 text-xs">
              <ShieldCheck size={14} className="text-[#2FA4A9]" />
              ข้อมูลของคุณได้รับการปกป้องตามนโยบายความเป็นส่วนตัวของมหาวิทยาลัย
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
