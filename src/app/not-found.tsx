// src/app/not-found.tsx
import Link from "next/link";
import { ArrowLeft, Home, HeartPulse, Sparkles } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full bg-white relative overflow-hidden">
      {/* background blobs */}
      <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-teal-100 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 -right-20 h-80 w-80 rounded-full bg-emerald-100 blur-3xl" />
      <div className="pointer-events-none absolute top-10 right-10 h-28 w-28 rounded-full bg-teal-200/40" />

      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-3xl rounded-[26px] bg-white shadow-[0_22px_60px_rgba(2,6,23,0.12)] border border-slate-200 overflow-hidden">
          <div className="p-8 sm:p-10">
            {/* Brand */}
            <div className="flex items-center gap-2 mb-10">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-teal-600 to-emerald-600 shadow-sm">
                <HeartPulse className="w-4 h-4 text-white" />
              </span>
              <span className="text-lg font-semibold text-slate-900">
                NU Wellness Center
              </span>
            </div>

            {/* Content */}
            <div className="grid md:grid-cols-[1fr_auto] gap-10 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-100 text-teal-700 text-xs font-semibold">
                  <Sparkles className="w-4 h-4" />
                  Page Not Found
                </div>

                <h1 className="mt-4 text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900">
                  404
                </h1>

                <p className="mt-3 text-slate-600 leading-relaxed">
                  หน้าที่คุณกำลังหาอาจถูกย้าย ลบ หรือพิมพ์ URL ผิดไปนิดนึง
                  <br className="hidden sm:block" />
                  ลองกลับไปหน้าแรก หรือย้อนกลับไปหน้าก่อนหน้าได้เลย
                </p>

                <div className="mt-7 flex flex-wrap gap-3">
                  <Link
                    href="/"
                    className="h-11 px-5 rounded-md font-semibold text-white
                               bg-teal-600 hover:bg-teal-700
                               shadow-sm shadow-teal-500/20 transition
                               inline-flex items-center gap-2"
                  >
                    <Home className="w-4 h-4" />
                    กลับหน้าแรก
                  </Link>

                  <Link
                    href="/booking"
                    className="h-11 px-5 rounded-md font-semibold text-teal-700
                               bg-white border border-teal-200
                               hover:bg-teal-50 transition
                               inline-flex items-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    ไปหน้าจองคิว
                  </Link>
                </div>

                <p className="mt-10 text-xs text-slate-400">
                  © 2026 NU Wellness Center. All rights reserved.
                </p>
              </div>

              {/* Big decoration */}
              <div className="hidden md:flex justify-center">
                <div className="relative w-44 h-44">
                  <div className="absolute inset-0 rounded-full bg-teal-100 blur-xl" />
                  <div className="absolute inset-6 rounded-full bg-emerald-100 blur-xl" />
                  <div className="relative w-full h-full rounded-[28px] bg-white border border-teal-100 shadow-[0_16px_40px_rgba(2,6,23,0.12)] flex items-center justify-center">
                    <span className="text-5xl font-black text-teal-700">404</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Optional hint */}
            <div className="mt-8 p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-600">
              <span className="font-semibold text-slate-900">Tip:</span>{" "}
              ถ้า URL นี้ควรมีจริง ๆ ให้เช็คว่า path ถูกต้องไหม หรือ route อยู่ใน
              group/segment ถูกตำแหน่งหรือเปล่า (เช่น `(consultant)`).
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
