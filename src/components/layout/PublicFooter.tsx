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
    "https://www.google.com/maps/place/%E0%B8%81%E0%B8%AD%E0%B8%87%E0%B8%81%E0%B8%B4%E0%B8%88%E0%B8%81%E0%B8%B2%E0%B8%A3%E0%B8%99%E0%B8%B4%E0%B8%AA%E0%B8%B4%E0%B8%95+%E0%B8%A1%E0%B8%AB%E0%B8%B2%E0%B8%A7%E0%B8%B4%E0%B8%97%E0%B8%A2%E0%B8%B2%E0%B8%A5%E0%B8%B1%E0%B8%A2%E0%B8%99%E0%B9%80%E0%B8%A3%E0%B8%A7%E0%B8%A3";

  return (
    <footer className="relative w-full bg-white/60 backdrop-blur-md">
      {/* Background elements if needed, but keeping it clean for compatibility */}

      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 items-start">

          {/* Column 1: Brand & Actions */}
          <div className="flex flex-col space-y-4">
            <BrandLogo
              asLink
              href="/"
              size={40}
              showText
              subtitle="Student Portal"
              variant="default"
              className="gap-3"
              textClassName="text-[rgb(var(--fg))]"
            />

            <p className="text-sm text-[rgb(var(--muted))] leading-relaxed font-medium max-w-xs">
              ระบบบริการให้คำปรึกษาสำหรับนิสิตมหาวิทยาลัยนเรศวร ใช้งานง่าย ปลอดภัย และเป็นส่วนตัว
            </p>

            <div className="flex flex-wrap gap-2 pt-2">
              <Link
                href="/about"
                className="inline-flex items-center px-4 py-2 rounded-full border border-slate-200 bg-white text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition shadow-sm gap-1.5"
              >
                <Info size={14} className="text-slate-400" /> เกี่ยวกับเรา
              </Link>
              <Link
                href="/pr"
                className="inline-flex items-center px-4 py-2 rounded-full border border-slate-200 bg-white text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition shadow-sm gap-1.5"
              >
                <Newspaper size={14} className="text-slate-400" /> ประชาสัมพันธ์
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center px-4 py-2 rounded-full bg-[rgb(var(--primary))] text-xs font-bold text-white hover:bg-[rgb(var(--primary-600))] transition shadow-sm shadow-[rgba(var(--primary),0.2)] gap-1.5"
              >
                เข้าสู่ระบบ <ExternalLink size={14} />
              </Link>
            </div>

            <p className="text-xs text-slate-400 mt-4 leading-relaxed font-medium">
              © {new Date().getFullYear()} {APP_CONFIG.name}. All rights reserved.
            </p>
          </div>

          {/* Column 2: Contact Card */}
          <div className="bg-white/80 rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4 h-full">
            <h4 className="text-base font-bold text-slate-800 flex items-center gap-2">
              ติดต่อเรา
            </h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-3 text-slate-600">
                <span className="p-1.5 rounded-full bg-[rgba(var(--primary),0.1)] text-[rgb(var(--primary))]">
                  <Phone size={14} />
                </span>
                <span className="font-semibold">055-961-273</span>
              </li>
              <li className="flex items-center gap-3 text-slate-600">
                <span className="p-1.5 rounded-full bg-[rgba(var(--primary),0.1)] text-[rgb(var(--primary))]">
                  <Mail size={14} />
                </span>
                <span className="font-semibold">support@wellness.nu.ac.th</span>
              </li>
              <li className="flex items-center gap-3 text-slate-600 group cursor-pointer hover:text-[rgb(var(--primary))] transition">
                <a href={mapHref} target="_blank" rel="noreferrer" className="flex items-center gap-3 w-full">
                  <span className="p-1.5 rounded-full bg-[rgba(var(--primary),0.1)] text-[rgb(var(--primary))] group-hover:bg-[rgb(var(--primary))] group-hover:text-white transition">
                    <MapPin size={14} />
                  </span>
                  <span className="font-bold underline decoration-slate-300 underline-offset-4 decoration-2 group-hover:decoration-[rgb(var(--primary))]">เปิดแผนที่ Google Maps</span>
                  <ExternalLink size={12} className="opacity-50 group-hover:opacity-100 transition ml-auto" />
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Map Image */}
          <div className="relative group overflow-hidden rounded-2xl border border-slate-200 shadow-sm h-full min-h-[200px]">
            <GoogleMapEmbed
              title="ศูนย์สุขภาวะนิสิต มหาวิทยาลัยนเรศวร"
              subtitle="Naresuan University Wellness Center"
              href={mapHref}
              imageSrc="/images/maps/wellness-map.png"
              heightClassName="h-full w-full absolute inset-0 object-cover"
            />
            {/* Optional overlay if GoogleMapEmbed doesn't handle customized look - but keeping it simple as per component use */}
          </div>

        </div>
      </div>
    </footer>
  );
}
