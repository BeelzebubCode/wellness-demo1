"use client";

import React from "react";
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
} from "lucide-react";
import { useLogin } from "@/features/auth/login/useLogin";

export default function LoginPage() {
  const {
    loading,
    error,
    showPassword,
    formData,
    setFormData,
    setShowPassword,
    demoFill,
    login,
  } = useLogin();

  return (
    <div className="min-h-screen w-full bg-white relative overflow-hidden pt-8">
      {/* background blobs */}
      <div className="pointer-events-none absolute -top-24 -left-24 h-64 w-64 rounded-full bg-teal-100 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 -right-20 h-72 w-72 rounded-full bg-emerald-100 blur-3xl" />
      <div className="pointer-events-none absolute top-10 right-10 h-28 w-28 rounded-full bg-teal-200/40" />

      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-5xl rounded-[26px] bg-white shadow-[0_22px_60px_rgba(2,6,23,0.12)] border border-slate-200 overflow-hidden">
          <div className="grid lg:grid-cols-2">
            {/* LEFT: form */}
            <div className="p-8 sm:p-10 lg:p-12">
              <div className="flex items-center gap-2 mb-10">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-teal-600 to-emerald-600 shadow-sm">
                  <HeartPulse className="w-4 h-4 text-white" />
                </span>
                <span className="text-lg font-semibold text-slate-900">
                  NU Wellness Center
                </span>
              </div>

              {error && (
                <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 mt-0.5" />
                  <p className="text-sm text-red-700 font-semibold">{error}</p>
                </div>
              )}

              <form onSubmit={login} className="space-y-4 max-w-sm">
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

              <div className="mt-10 max-w-sm">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span className="font-semibold">Demo</span>
                  <span className="text-slate-400">— กดเพื่อกรอกอัตโนมัติ</span>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => demoFill("head", "wellness@nu.ac.th_123456!")}
                    className="px-3 py-1.5 text-xs font-semibold rounded-md border border-slate-200 bg-white
                               hover:bg-slate-50 transition"
                  >
                    Head Consultant
                  </button>
                  <button
                    type="button"
                    onClick={() => demoFill("consultant1", "wellness@nu.ac.th_123456!")}
                    className="px-3 py-1.5 text-xs font-semibold rounded-md border border-slate-200 bg-white
                               hover:bg-slate-50 transition"
                  >
                    Consultant
                  </button>
                  <button
                    type="button"
                    onClick={() => demoFill("student1", "wellness@nu.ac.th_123456!")}
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

            {/* RIGHT: illustration */}
            <div className="relative hidden lg:flex items-center justify-center bg-teal-50">
              <div className="pointer-events-none absolute -top-14 -right-14 w-48 h-48 rounded-full bg-emerald-200/45" />
              <div className="pointer-events-none absolute top-24 right-10 w-24 h-24 rounded-full bg-teal-200/55" />
              <div className="pointer-events-none absolute bottom-10 left-10 w-28 h-28 rounded-full bg-emerald-200/35" />
              <div className="pointer-events-none absolute bottom-20 right-8 w-36 h-36 rounded-full bg-teal-200/25" />

              <div className="relative w-[78%] max-w-md mx-auto">
                <div className="relative w-full aspect-[4/3] bg-white rounded-[24px] border border-teal-100 shadow-[0_16px_40px_rgba(2,6,23,0.12)] overflow-hidden">
                  <div className="absolute inset-0 animate-shimmer bg-shimmer" />
                  <div className="relative z-10 flex h-full w-full items-center justify-center">
                    <img
                      src="/images/login-illustration.png"
                      alt="login illustration"
                      className="w-[86%] max-h-[86%] object-contain rounded-[15px] drop-shadow-[0_14px_28px_rgba(2,6,23,0.12)]"
                    />
                  </div>
                </div>
              </div>
            </div>
            {/* /RIGHT */}
          </div>
        </div>
      </div>
    </div>
  );
}
