"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Lock,
  Loader2,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  HeartPulse,
  Megaphone,
} from "lucide-react";
import { useNotificationContext } from "@/components/notification/NotificationProvider";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ username: "", password: "" });
  const { push } = useNotificationContext();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/v2/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
        credentials: "include",
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // ❌ ไม่จำเป็นแล้วถ้าใช้ cookie-based
        // if (data.token) localStorage.setItem("token", data.token);

        // ✅ เก็บ user ไว้ใช้กับ UI (optional)
        localStorage.setItem(
          "auth_user",
          JSON.stringify({
            name:
              data.account?.name || data.account?.username || formData.username,
            role: data.account?.role || null,
            homeUniversityId: data.account?.homeUniversityId ?? null,
            allowedUniversityIds: data.account?.allowedUniversityIds ?? [],
          }),
        );

        window.dispatchEvent(new Event("auth-changed"));

        const role = data.account?.role;

        push({
          type: "success",
          title: "เข้าสู่ระบบสำเร็จ",
          message: `ยินดีต้อนรับ ${data.account?.username}`,
          duration: 1500,
        });

        // ✅ map role ตาม schema ใหม่
        const nextPath =
          role === "SUPER_ADMIN" || role === "RECTOR"
            ? "/admin/data-center"
            : role === "HEAD_CONSULTANT"
              ? "/admin/data-center" // หรือจะเปลี่ยนเป็นหน้าหัวหน้าที่ปรึกษาโดยเฉพาะก็ได้
              : role === "CONSULTANT"
                ? "/consultant/my-jobs"
                : role === "STUDENT"
                  ? "/booking"
                  : "/";

        router.replace(nextPath);
        router.refresh();
        return;
      }

      setError(data.error || "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
    } catch (err) {
      console.error(err);
      setError("Connection Error");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoFill = (username: string, password: string) => {
    setFormData({ username, password });
  };

  return (
    <div className="min-h-screen w-full bg-white relative overflow-hidden pt-8">
      {/* background blobs (คล้ายรูปตัวอย่าง แต่โทนระบบ teal/mint) */}
      <div className="pointer-events-none absolute -top-24 -left-24 h-64 w-64 rounded-full bg-teal-100 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 -right-20 h-72 w-72 rounded-full bg-emerald-100 blur-3xl" />
      <div className="pointer-events-none absolute top-10 right-10 h-28 w-28 rounded-full bg-teal-200/40" />

      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-10">
        {/* Main Card */}
        <div className="w-full max-w-5xl rounded-[26px] bg-white shadow-[0_22px_60px_rgba(2,6,23,0.12)] border border-slate-200 overflow-hidden">
          <div className="grid lg:grid-cols-2">
            {/* ================= LEFT: form ================= */}
            <div className="p-8 sm:p-10 lg:p-12">
              {/* Logo/Brand (สไตล์ HermesPay แต่เป็น NU Wellness) */}
              <div className="flex items-center gap-2 mb-10">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-teal-600 to-emerald-600 shadow-sm">
                  <HeartPulse className="w-4 h-4 text-white" />
                </span>
                <span className="text-lg font-semibold text-slate-900">
                  NU Wellness Center
                </span>
              </div>

              {/* Error */}
              {error && (
                <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 mt-0.5" />
                  <p className="text-sm text-red-700 font-semibold">{error}</p>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4 max-w-sm">
                {/* Username */}
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <User size={18} />
                  </span>
                  <input
                    type="text"
                    placeholder="Name"
                    autoComplete="username"
                    className="w-full h-11 pl-10 pr-3 rounded-md border border-slate-200 bg-white
                               text-slate-900 placeholder:text-slate-400
                               focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500
                               transition"
                    value={formData.username}
                    onChange={(e) =>
                      setFormData({ ...formData, username: e.target.value })
                    }
                    required
                    disabled={loading}
                  />
                </div>

                {/* Password */}
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <Lock size={18} />
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    autoComplete="current-password"
                    className="w-full h-11 pl-10 pr-10 rounded-md border border-slate-200 bg-white
                               text-slate-900 placeholder:text-slate-400
                               focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500
                               transition"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                    tabIndex={-1}
                    aria-label="toggle password"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {/* Row: forgot + login button (เหมือนรูป) */}
                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    className="text-sm text-slate-500 hover:text-slate-700 transition"
                    disabled={loading}
                  >
                    Forgot Password?
                  </button>

                  <button
                    type="submit"
                    disabled={loading}
                    className="h-10 px-6 rounded-md font-semibold text-white
                               bg-teal-600 hover:bg-teal-700
                               shadow-sm shadow-teal-500/20
                               transition disabled:opacity-70 disabled:cursor-not-allowed
                               inline-flex items-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Loading
                      </>
                    ) : (
                      <>
                        Login <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Demo buttons (ยังอยู่เหมือนเดิม แต่จัดให้กลืนกับ UI) */}
              <div className="mt-10 max-w-sm">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span className="font-semibold">Demo</span>
                  <span className="text-slate-400">— กดเพื่อกรอกอัตโนมัติ</span>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      handleDemoFill("head", "wellness@nu.ac.th_123456!")
                    }
                    className="px-3 py-1.5 text-xs font-semibold rounded-md border border-slate-200 bg-white
                               hover:bg-slate-50 transition"
                  >
                    Head Consultant
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleDemoFill("consultant1", "wellness@nu.ac.th_123456!")
                    }
                    className="px-3 py-1.5 text-xs font-semibold rounded-md border border-slate-200 bg-white
                               hover:bg-slate-50 transition"
                  >
                    Consultant
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleDemoFill("student1", "wellness@nu.ac.th_123456!")
                    }
                    className="px-3 py-1.5 text-xs font-semibold rounded-md border border-slate-200 bg-white
                               hover:bg-slate-50 transition"
                  >
                    Student
                  </button>
                </div>

                <p className="mt-8 text-xs text-slate-400">
                  © 2026 NU Wellness Center. All rights reserved.
                </p>
              </div>
            </div>

            {/* ================= RIGHT: illustration area ================= */}
            <div className="relative hidden lg:flex items-center justify-center bg-teal-50">
              {/* วงกลม/ลวดลายแบบในรูป */}
              <div className="pointer-events-none absolute -top-14 -right-14 w-48 h-48 rounded-full bg-emerald-200/45" />
              <div className="pointer-events-none absolute top-24 right-10 w-24 h-24 rounded-full bg-teal-200/55" />
              <div className="pointer-events-none absolute bottom-10 left-10 w-28 h-28 rounded-full bg-emerald-200/35" />
              <div className="pointer-events-none absolute bottom-20 right-8 w-36 h-36 rounded-full bg-teal-200/25" />

              {/* เส้นคลื่นๆ */}
              <div className="pointer-events-none absolute top-8 left-10 text-teal-400/60 select-none">
                <svg width="70" height="30" viewBox="0 0 70 30" fill="none">
                  <path
                    d="M2 15c8-10 16 10 24 0s16-10 24 0 16 10 18 0"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>

              {/* TODO: ใส่รูปทีหลัง */}
              <div className="relative w-[78%] max-w-md mx-auto">
                <div
                  className="
                    relative
                    w-full
                    aspect-[4/3]
                    bg-white
                    rounded-[24px]
                    border border-teal-100
                    shadow-[0_16px_40px_rgba(2,6,23,0.12)]
                    overflow-hidden
                  "
                >
                  {/* shimmer background */}
                  <div className="absolute inset-0 animate-shimmer bg-shimmer" />

                  {/* image */}
                  <div className="relative z-10 flex h-full w-full items-center justify-center">
                    <img
                      src="/images/login-illustration.png"
                      alt="login illustration"
                      className="
                        w-[86%]
                        max-h-[86%]
                        object-contain
                        rounded-[15px]
                        drop-shadow-[0_14px_28px_rgba(2,6,23,0.12)]
                        animate-pop-in
                      "
                    />
                  </div>
                </div>
              </div>

              {/* จุดกลมๆ */}
              <div className="pointer-events-none absolute top-1/2 right-14 w-2 h-2 rounded-full bg-teal-500/60" />
              <div className="pointer-events-none absolute top-[58%] right-20 w-1.5 h-1.5 rounded-full bg-emerald-500/55" />

              {/* วงแหวนขวา */}
              <div className="pointer-events-none absolute right-6 top-1/2 -translate-y-1/2 opacity-40">
                <svg width="90" height="90" viewBox="0 0 90 90" fill="none">
                  <circle
                    cx="45"
                    cy="45"
                    r="22"
                    stroke="#0EA5A4"
                    strokeWidth="2"
                    opacity="0.35"
                  />
                  <circle
                    cx="45"
                    cy="45"
                    r="32"
                    stroke="#0EA5A4"
                    strokeWidth="2"
                    opacity="0.22"
                  />
                  <circle
                    cx="45"
                    cy="45"
                    r="42"
                    stroke="#0EA5A4"
                    strokeWidth="2"
                    opacity="0.14"
                  />
                </svg>
              </div>
            </div>

            {/* Mobile illustration */}
            <div className="lg:hidden bg-teal-50 border-t border-slate-200 p-4">
              <div
                className="
                  relative
                  w-full
                  aspect-[16/9]
                  bg-white
                  rounded-[20px]
                  border border-teal-100
                  shadow-[0_14px_32px_rgba(2,6,23,0.12)]
                  overflow-hidden
                "
              >
                {/* shimmer background */}
                <div className="absolute inset-0 animate-shimmer bg-shimmer" />

                {/* image */}
                <div className="relative z-10 flex h-full w-full items-center justify-center">
                  <img
                    src="/images/login-illustration.png"
                    alt="login illustration"
                    className="
                      w-full
                      h-full
                      object-cover
                      animate-pop-in
                    "
                  />
                </div>
              </div>
            </div>
            {/* /mobile */}
          </div>
        </div>
      </div>
    </div>
  );
}
