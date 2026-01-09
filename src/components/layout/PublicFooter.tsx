// components/layout/PublicFooter.tsx
"use client";

import Link from "next/link";
import { APP_CONFIG } from "@/lib/constants";
import { Mail, Phone, ShieldCheck, ExternalLink, Info, Newspaper } from "lucide-react";
import { GoogleMapEmbed } from "@/components/shared/GoogleMapEmbed";
import { BrandLogo } from "@/components/shared";

export function PublicFooter() {
  const mapHref =
    "https://www.google.com/maps/place/%E0%B8%81%E0%B8%AD%E0%B8%87%E0%B8%81%E0%B8%B4%E0%B8%88%E0%B8%81%E0%B8%B2%E0%B8%A3%E0%B8%99%E0%B8%B4%E0%B8%AA%E0%B8%B4%E0%B8%95+%E0%B8%A1%E0%B8%AB%E0%B8%B2%E0%B8%A7%E0%B8%B4%E0%B8%97%E0%B8%A2%E0%B8%B2%E0%B8%A5%E0%B8%B1%E0%B8%A2%E0%B8%99%E0%B9%80%E0%B8%A3%E0%B8%A8%E0%B8%A7%E0%B8%A3/@16.7389639,100.1965445,1929m/data=!3m1!1e3!4m14!1m7!3m6!1s0x30dfbf000e930d5f:0xa1dfb0c145e366e1!2z4LiB4Lit4LiH4LiB4Li04LiI4LiB4Liy4Lij4LiZ4Li04Liq4Li04LiVIOC4oeC4q-C4suC4p-C4tOC4l-C4ouC4suC4peC4seC4ouC4meC5gOC4o-C4qOC4p-C4ow!8m2!3d16.7370109!4d100.1998084!16s%2Fg%2F11vwygs5rd!3m5!1s0x30dfbf000e930d5f:0xa1dfb0c145e366e1!8m2!3d16.7370109!4d100.1998084!16s%2Fg%2F11vwygs5rd?entry=ttu&g_ep=EgoyMDI2MDEwNi4wIKXMDSoASAFQAw%3D%3D";

  return (
    <footer className="relative mt-12">
      {/* BG */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary-600 via-teal-500 to-cyan-500 opacity-95" />
      <div className="absolute inset-0 backdrop-blur-md" />

      <div className="relative">
        <div className="max-w-7xl mx-auto px-4 py-10 sm:py-12">
          {/* ✅ Top Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 text-white/90 items-stretch">
            {/* Left: Brand */}
            <div className="lg:col-span-4 flex flex-col justify-center">
              <div className="flex items-start justify-center lg:justify-start">
                <BrandLogo
                  asLink
                  href="/"
                  size={44}
                  showText
                  subtitle="Student Portal"
                  variant="white"
                  className="gap-3"
                  textClassName="text-white"
                  imgClassName="drop-shadow-sm"
                />
              </div>

              <p className="mt-3 text-white/80 text-sm leading-relaxed text-center lg:text-left">
                ระบบบริการให้คำปรึกษาสำหรับนิสิตมหาวิทยาลัยนเรศวร ใช้งานง่าย ปลอดภัย และเป็นส่วนตัว
              </p>

              {/* Quick links (กันโล่ง + ดูโปร) */}
              <div className="mt-5 flex flex-wrap justify-center lg:justify-start gap-2">
                <Link
                  href="/about"
                  className="inline-flex items-center gap-2 rounded-full bg-white/10 hover:bg-white/15 border border-white/15 px-3 py-1.5 text-xs font-semibold transition"
                >
                  <Info className="w-4 h-4" />
                  เกี่ยวกับเรา
                </Link>

                <Link
                  href="/pr"
                  className="inline-flex items-center gap-2 rounded-full bg-white/10 hover:bg-white/15 border border-white/15 px-3 py-1.5 text-xs font-semibold transition"
                >
                  <Newspaper className="w-4 h-4" />
                  ประชาสัมพันธ์
                </Link>

                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 rounded-full bg-white text-slate-900 hover:bg-slate-100 px-3 py-1.5 text-xs font-extrabold shadow-sm transition"
                >
                  เข้าสู่ระบบ
                  <ExternalLink className="w-4 h-4" />
                </Link>
              </div>

              <p className="mt-5 text-xs text-white/70 text-center lg:text-left">
                © {new Date().getFullYear()} {APP_CONFIG.name}. All rights reserved.
              </p>
            </div>

            {/* Middle: Contact */}
            <div className="lg:col-span-3 flex flex-col justify-center">
              <div className="rounded-2xl bg-white/10 border border-white/15 backdrop-blur-xl p-5">
                <p className="font-extrabold text-sm text-white/95">ติดต่อเรา</p>

                <div className="mt-3 space-y-2.5">
                  <a
                    href="tel:055961273"
                    className="flex items-center justify-center lg:justify-start gap-2 text-white/85 text-sm hover:text-white transition"
                  >
                    <Phone className="w-4 h-4" />
                    055-961-273
                  </a>

                  <a
                    href="mailto:support@wellness.nu.ac.th"
                    className="flex items-center justify-center lg:justify-start gap-2 text-white/85 text-sm hover:text-white transition"
                  >
                    <Mail className="w-4 h-4" />
                    support@wellness.nu.ac.th
                  </a>

                  <a
                    href={mapHref}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex items-center justify-center lg:justify-start gap-2 text-xs font-semibold text-white/85 hover:text-white transition"
                  >
                    เปิดแผนที่ Google Maps
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>

            {/* Right: Map */}
            <div className="lg:col-span-5 flex flex-col justify-center">
              <GoogleMapEmbed
                title="ศูนย์สุขภาวะนิสิต มหาวิทยาลัยนเรศวร"
                subtitle="Naresuan University Wellness Center"
                href={mapHref}
                // ✅ ถ้ารูปอยู่ public/maps/wellness-map.png ให้ใช้แบบนี้ (ไม่ใช่ /images/...)
                imageSrc="/images/maps/wellness-map.png"
                // ✅ สูงขึ้น + สมดุลกับฝั่งซ้าย
                heightClassName="h-[240px] sm:h-[280px] lg:h-[320px]"
              />
            </div>
          </div>

          {/* Divider */}
          <div className="mt-10 border-t border-white/20" />

          {/* Bottom */}
          <div className="pt-6 text-center">
            <p className="inline-flex items-center gap-2 text-white/70 text-xs tracking-wide">
              <ShieldCheck size={14} className="text-white/80" />
              ข้อมูลของคุณได้รับการปกป้องตามนโยบายความเป็นส่วนตัวของมหาวิทยาลัย
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
