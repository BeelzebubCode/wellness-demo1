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

  // ✅ Force DEFAULT tenant colors (Sage Wellness from tenants.css :root)
  const defaultTenantVars = {
    ["--primary" as any]: "150 167 141", // #96A78D
    ["--primary-600" as any]: "132 150 124", // deeper sage
    ["--accent" as any]: "182 206 180", // #B6CEB4
    ["--bg-grad-1" as any]: "240 240 240", // #F0F0F0
    ["--bg-grad-2" as any]: "217 233 207", // #D9E9CF
    ["--ring" as any]: "150 167 141",
  } as React.CSSProperties;

  // ✅ demo accounts (stable list)
  const DEMO_ACCOUNTS = [
    { label: "Head Consultant (NU)", username: "head_nu", password: "wellness@nu.ac.th_123456!" },
    { label: "Head Consultant (KKU)", username: "head_kku", password: "wellness@nu.ac.th_123456!" },
    { label: "Head Consultant (CU)", username: "head_cu", password: "wellness@nu.ac.th_123456!" },

    { label: "Rector (NU)", username: "rector_nu", password: "wellness@nu.ac.th_123456!" },
    { label: "Rector (KKU)", username: "rector_kku", password: "wellness@nu.ac.th_123456!" },
    { label: "Rector (CU)", username: "rector_cu", password: "wellness@nu.ac.th_123456!" },

    { label: "Consultant (NU #1)", username: "consultant_nu_1", password: "wellness@nu.ac.th_123456!" },
    { label: "Consultant (NU #2)", username: "consultant_nu_2", password: "wellness@nu.ac.th_123456!" },
    { label: "Consultant (KKU #1)", username: "consultant_kku_1", password: "wellness@nu.ac.th_123456!" },
    { label: "Consultant (KKU #2)", username: "consultant_kku_2", password: "wellness@nu.ac.th_123456!" },
    { label: "Consultant (CU #1)", username: "consultant_cu_1", password: "wellness@nu.ac.th_123456!" },
    { label: "Consultant (CU #2)", username: "consultant_cu_2", password: "wellness@nu.ac.th_123456!" },

    { label: "stu_nu_01", username: "stu_nu_01", password: "wellness@nu.ac.th_123456!" },
    { label: "stu_nu_", username: "stu_nu_", password: "wellness@nu.ac.th_123456!" },

    { label: "Ministry Admin", username: "ministry_admin", password: "wellness@nu.ac.th_123456!" },
    { label: "Super Admin", username: "superAdmin", password: "wellness@nu.ac.th_123456!" },

    // Advisor
    { label: "Advisor (NU)", username: "advisor_nu_sci_math", password: "wellness@nu.ac.th_123456!" },
  ] as const;

  // ✅ FIX: demoKey + demoSelected (ของเดิมนายยังไม่ได้ประกาศ)
  const [demoKey, setDemoKey] = React.useState<string>(DEMO_ACCOUNTS[0].username);

  const demoSelected = React.useMemo(() => {
    return DEMO_ACCOUNTS.find((x) => x.username === demoKey) ?? DEMO_ACCOUNTS[0];
  }, [demoKey]);

  return (
    <div
      style={defaultTenantVars}
      className="min-h-screen w-full bg-white relative overflow-hidden pt-8"
    >
      {/* background blobs */}
      <div className="pointer-events-none absolute -top-24 -left-24 h-64 w-64 rounded-full bg-[rgb(var(--primary)/0.12)] blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 -right-20 h-72 w-72 rounded-full bg-[rgb(var(--accent)/0.12)] blur-3xl" />
      <div className="pointer-events-none absolute top-10 right-10 h-28 w-28 rounded-full bg-[rgb(var(--primary)/0.16)]" />

      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-5xl rounded-[26px] bg-white shadow-[0_22px_60px_rgba(2,6,23,0.12)] border border-slate-200 overflow-hidden">
          <div className="grid lg:grid-cols-2">
            {/* LEFT: form */}
            <div className="p-8 sm:p-10 lg:p-12">
              <div className="flex items-center gap-2 mb-10">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-[rgb(var(--primary))] to-[rgb(var(--accent))] shadow-sm">
                  <HeartPulse className="w-4 h-4 text-white" />
                </span>
                <span className="text-lg font-semibold text-slate-900">
                  Wellness Center
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
                               focus:outline-none focus:ring-2 focus:ring-[rgba(var(--ring),0.20)] focus:border-[rgb(var(--ring))]
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
                               focus:outline-none focus:ring-2 focus:ring-[rgba(var(--ring),0.20)] focus:border-[rgb(var(--ring))]
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
                               bg-[rgb(var(--primary))] hover:bg-[rgb(var(--primary-600))]
                               shadow-sm shadow-[rgba(var(--primary),0.20)]
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

              {/* ✅ Demo dropdown */}
              <div className="mt-10 max-w-sm">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span className="font-semibold">Demo</span>
                  <span className="text-slate-400">— เลือกบัญชีแล้วกด Fill</span>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <select
                    value={demoKey}
                    onChange={(e) => setDemoKey(e.target.value)}
                    disabled={loading}
                    className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700
                               focus:outline-none focus:ring-2 focus:ring-[rgba(var(--ring),0.20)] focus:border-[rgb(var(--ring))]
                               disabled:opacity-70"
                  >
                    <optgroup label="Rector">
                      <option value="rector_nu">Rector (NU)</option>
                      <option value="rector_kku">Rector (KKU)</option>
                      <option value="rector_cu">Rector (CU)</option>
                    </optgroup>

                    <optgroup label="Head Consultant">
                      <option value="head_nu">Head Consultant (NU)</option>
                      <option value="head_kku">Head Consultant (KKU)</option>
                      <option value="head_cu">Head Consultant (CU)</option>
                    </optgroup>

                    <optgroup label="Consultant">
                      <option value="consultant_nu_1">Consultant (NU #1)</option>
                      <option value="consultant_nu_2">Consultant (NU #2)</option>
                      <option value="consultant_kku_1">Consultant (KKU #1)</option>
                      <option value="consultant_kku_2">Consultant (KKU #2)</option>
                      <option value="consultant_cu_1">Consultant (CU #1)</option>
                      <option value="consultant_cu_2">Consultant (CU #2)</option>
                    </optgroup>

                    <optgroup label="Student">
                      <option value="stu_nu_01">stu_nu_01</option>
                      <option value="stu_nu_">stu_nu_</option>
                    </optgroup>

                    <optgroup label="Platform">
                      <option value="ministry_admin">Ministry Admin</option>
                      <option value="superAdmin">Super Admin</option>
                    </optgroup>
                    
                    <optgroup label="Advisor">
                      <option value="advisor_nu_sci_math">Advisor (NU Computer Science)</option>
                    </optgroup>
                  </select>

                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => demoFill(demoSelected.username, demoSelected.password)}
                    className="h-10 px-4 rounded-md font-semibold text-white
                               bg-[rgb(var(--primary))] hover:bg-[rgb(var(--primary-600))]
                               shadow-sm shadow-[rgba(var(--primary),0.20)]
                               transition disabled:opacity-70 disabled:cursor-not-allowed
                               inline-flex items-center gap-2 shrink-0"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    Fill
                  </button>
                </div>

                <p className="mt-8 text-xs text-slate-400">
                  © 2026 NU Wellness Center. All rights reserved.
                </p>
              </div>
            </div>

            {/* RIGHT: illustration */}
            <div className="relative hidden lg:flex items-center justify-center bg-[rgb(var(--bg-grad-1))]">
              <div className="pointer-events-none absolute -top-14 -right-14 w-48 h-48 rounded-full bg-[rgb(var(--accent)/0.18)]" />
              <div className="pointer-events-none absolute top-24 right-10 w-24 h-24 rounded-full bg-[rgb(var(--primary)/0.18)]" />
              <div className="pointer-events-none absolute bottom-10 left-10 w-28 h-28 rounded-full bg-[rgb(var(--accent)/0.14)]" />
              <div className="pointer-events-none absolute bottom-20 right-8 w-36 h-36 rounded-full bg-[rgb(var(--primary)/0.10)]" />

              <div className="relative w-[78%] max-w-md mx-auto">
                <div className="relative w-full aspect-[4/3] bg-white rounded-[24px] border border-slate-200 shadow-[0_16px_40px_rgba(2,6,23,0.12)] overflow-hidden">
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
