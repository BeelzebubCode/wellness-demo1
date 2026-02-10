// src/app/not-found.tsx
"use client";

import Link from "next/link";
import { ArrowLeft, Home, HeartPulse } from "lucide-react";
import { useEffect, useState } from "react";
import { authApi } from "@/features/auth/api";

export default function NotFound() {
  const [homeHref, setHomeHref] = useState("/");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function determineHome() {
      // 1. Helper to read cookies
      const getCookie = (name: string) => {
        const matches = document.cookie.match(new RegExp(
          "(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
        ));
        return matches ? decodeURIComponent(matches[1]) : undefined;
      };

      const token = getCookie("auth_token");
      if (!token) {
        setLoading(false);
        return; // Guest -> "/"
      }

      try {
        // 2. Fetch User Role
        const { valid, account } = await authApi.me();
        if (!valid || !account) {
            setLoading(false);
            return;
        }

        // 3. Get Tenant Code
        const tenantCode = getCookie("tenant_code") || "DEFAULT";
        const role = account.role;

        // 4. Determine Path based on Role
        let path = "/";

        switch (role) {
          case "MINISTRY":
            path = "/ministry";
            break;
          case "SUPER_ADMIN":
            path = "/super-admin";
            break;
          case "STUDENT":
            path = "/"; // Public Dashboard (Booking)
            break;
          case "CONSULTANT":
            path = `/${tenantCode}/consultant`;
            break;
          case "HEAD_CONSULTANT":
            path = `/${tenantCode}/head-consultant`;
            break;
          case "ADVISOR":
            path = `/${tenantCode}/advisor`;
            break;
          case "RECTOR":
            path = `/${tenantCode}/rector`;
            break;
          default:
            path = "/";
        }

        setHomeHref(path);
      } catch (error) {
        console.error("Failed to determine home path:", error);
      } finally {
        setLoading(false);
      }
    }

    determineHome();
  }, []);

  return (
    <div className="min-h-screen w-full bg-slate-50/50 relative flex flex-col items-center justify-center p-4 sm:p-6 overflow-hidden font-sans">
      
      {/* --- Background Decor (ปรับตำแหน่งให้กระจายตัวสำหรับ Card แนวนอน) --- */}
      <div className="pointer-events-none absolute top-[-10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-gradient-to-br from-teal-100/40 to-emerald-100/40 blur-[80px] opacity-70" />
      <div className="pointer-events-none absolute bottom-[-10%] right-[-10%] h-[500px] w-[500px] rounded-full bg-gradient-to-tl from-rose-100/40 to-orange-100/40 blur-[80px] opacity-70" />
      
      {/* --- Main Glass Card Content --- */}
      {/* ปรับ max-w-2xl -> max-w-5xl เพื่อให้กว้างเป็นสี่เหลี่ยมผืนผ้าบน PC */}
      <div className="relative z-10 w-full max-w-5xl bg-white/60 backdrop-blur-xl border border-white/80 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.05)] rounded-[2.5rem] p-8 sm:p-12 transition-all hover:shadow-[0_25px_60px_-12px_rgba(0,0,0,0.08)]">
        
        <div className="flex flex-col lg:flex-row items-center justify-between gap-10 lg:gap-16">
          
          {/* ส่วนที่ 1: Graphic (ด้านซ้ายบน PC, ด้านบนสุดบนมือถือ) */}
          <div className="w-full lg:w-1/2 flex justify-center lg:justify-end">
            <div className="relative flex items-center justify-center gap-2 sm:gap-5">
              <span className="text-[100px] sm:text-[140px] lg:text-[160px] leading-none font-black text-teal-300 drop-shadow-sm font-mono transform -rotate-6 select-none">
                4
              </span>
              
              {/* Cute Donut Element */}
              <div className="relative w-24 h-24 sm:w-32 sm:h-32 lg:w-36 lg:h-36 shrink-0 animate-bounce-slow">
                <div className="absolute inset-0 rounded-full bg-[#ffcbb9] border-[5px] border-white shadow-lg flex items-center justify-center overflow-hidden">
                   <div className="flex flex-col items-center mt-3 opacity-80">
                      <div className="flex gap-3 mb-2">
                        <div className="w-3 h-3 bg-slate-700 rounded-full" />
                        <div className="w-3 h-3 bg-slate-700 rounded-full" />
                      </div>
                      <div className="w-4 h-2 border-t-[3px] border-slate-700 rounded-full" />
                   </div>
                   <div className="absolute top-4 left-6 w-2 h-4 bg-teal-400 rounded-full rotate-45 opacity-60" />
                   <div className="absolute top-3 right-8 w-2 h-4 bg-yellow-400 rounded-full -rotate-12 opacity-60" />
                   <div className="absolute bottom-6 left-10 w-4 h-2 bg-pink-400 rounded-full opacity-60" />
                </div>
                <div className="absolute -top-1 -right-1 w-8 h-8 bg-white rounded-full" />
                <div className="absolute top-4 -right-2 w-5 h-5 bg-white rounded-full" />
              </div>

              <span className="text-[100px] sm:text-[140px] lg:text-[160px] leading-none font-black text-teal-300 drop-shadow-sm font-mono transform rotate-6 select-none">
                4
              </span>
            </div>
          </div>

          {/* ส่วนที่ 2: Content (ด้านขวาบน PC, ด้านล่างบนมือถือ) */}
          <div className="w-full lg:w-1/2 flex flex-col items-center lg:items-start text-center lg:text-left space-y-6">
            
            {/* Brand Badge */}
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white border border-teal-100 shadow-sm animate-fade-in-up">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-teal-100 text-teal-600">
                <HeartPulse className="w-3.5 h-3.5" />
              </span>
              <span className="text-sm font-bold text-slate-600 tracking-wide uppercase">
                NU Wellness Center
              </span>
            </div>

            {/* Text Content */}
            <div className="space-y-3">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-800 tracking-tight">
                อ้าว! ไม่พบหน้านี้
              </h1>
              <p className="text-slate-500 text-lg leading-relaxed font-medium">
                ลิงก์อาจจะผิด หรือหน้านี้อาจถูกลบไปแล้ว
                <br className="hidden lg:block" />
                ลองกลับไปเริ่มต้นใหม่ที่หน้าแรกนะครับ
              </p>
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto pt-2">
              <Link
                href={homeHref}
                className="group h-12 px-8 rounded-full font-bold text-white shadow-[0_4px_14px_0_rgba(255,158,136,0.39)]
                           bg-gradient-to-r from-[#ff9e88] to-[#ff8a70] hover:scale-105 hover:shadow-[0_6px_20px_rgba(255,158,136,0.23)]
                           transition-all duration-300 flex items-center justify-center gap-2"
              >
                <Home className="w-4 h-4" />
                <span>{loading ? "กำลังโหลด..." : "กลับหน้าหลัก"}</span>
              </Link>

              <Link
                href="/booking"
                className="h-12 px-8 rounded-full font-bold text-teal-700 bg-teal-50/50 border border-teal-100
                           hover:bg-teal-100/80 hover:border-teal-200 hover:text-teal-800 hover:-translate-y-0.5
                           transition-all duration-300 flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>ไปหน้าจองคิว</span>
              </Link>
            </div>
          </div>

        </div>

        {/* Footer (อยู่ด้านล่างสุดของการ์ด เต็มความกว้าง) */}
        <div className="border-t border-slate-100 pt-6 mt-10 lg:mt-12 text-center lg:text-right">
            <p className="text-xs text-slate-400 font-medium">
            © 2026 NU Wellness Center. All rights reserved.
            </p>
        </div>

      </div>

      {/* Dev Tip */}
      <div className="mt-8 opacity-60 hover:opacity-100 transition-opacity">
        <div className="inline-block py-2 px-4 rounded-xl bg-white/40 border border-white/60 text-[11px] text-slate-500 backdrop-blur-sm">
          <strong className="text-teal-600">Note:</strong> ตรวจสอบ URL อีกครั้งนะครับ
        </div>
      </div>

    </div>
  );
}