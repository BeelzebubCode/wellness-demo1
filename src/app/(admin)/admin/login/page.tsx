'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  User, 
  Lock, 
  Loader2, 
  Heart, 
  ArrowRight, 
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  Shield
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ username: '', password: '' });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST', 
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
        }),
        credentials: 'include', 
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // login สำเร็จ → ไปหน้า admin
        window.location.href = '/admin';
      } else {
        setError(data.error || 'เข้าสู่ระบบไม่สำเร็จ');
        setLoading(false);
      }

    } catch (err) {
      console.error(err);
      setError('Connection Error');
      setLoading(false);
    }
  };


  const handleDemoLogin = () => {
    setFormData({ username: 'admin', password: 'admin123' });
  };

  return (
    <div className="min-h-screen w-full flex">
      {/* ================= LEFT SIDE ================= */}
      <div className="hidden lg:flex relative w-1/2 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#grid)"/>
          </svg>
        </div>

        {/* Floating Elements */}
        <div className="absolute top-20 left-20 w-32 h-32 bg-white/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-40 right-20 w-48 h-48 bg-cyan-300/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-emerald-300/20 rounded-full blur-2xl animate-pulse" />
        
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20 text-white">
          {/* Logo */}
          <div className="flex items-center gap-4 mb-8">
            <div className="p-4 bg-white/20 backdrop-blur-xl rounded-2xl shadow-xl">
              <Heart className="w-10 h-10 text-white" fill="currentColor" />
            </div>
            <div>
              <h1 className="text-3xl xl:text-4xl font-bold tracking-tight">
                NU Wellness
              </h1>
              <p className="text-emerald-100 text-sm">Center Management System</p>
            </div>
          </div>

          {/* Main Message */}
          <div className="space-y-6 max-w-lg">
            <h2 className="text-4xl xl:text-5xl font-bold leading-tight">
              ดูแลสุขภาพใจ
              <br />
              <span className="text-emerald-200">นิสิตทุกคน</span>
            </h2>
            <p className="text-lg text-emerald-100/90 leading-relaxed">
              ระบบบริหารจัดการการนัดหมายให้คำปรึกษาด้านสุขภาพจิต 
              สำหรับเจ้าหน้าที่และผู้ให้คำปรึกษา
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 mt-12 pt-8 border-t border-white/20">
            <div>
              <p className="text-3xl font-bold">500+</p>
              <p className="text-emerald-200 text-sm">นิสิตที่ใช้บริการ</p>
            </div>
            <div>
              <p className="text-3xl font-bold">15</p>
              <p className="text-emerald-200 text-sm">ผู้เชี่ยวชาญ</p>
            </div>
            <div>
              <p className="text-3xl font-bold">98%</p>
              <p className="text-emerald-200 text-sm">ความพึงพอใจ</p>
            </div>
          </div>
        </div>
      </div>

      {/* ================= RIGHT SIDE: LOGIN FORM ================= */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-10 md:p-16 bg-slate-50">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-10">
            <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg">
              <Heart className="w-7 h-7 text-white" fill="currentColor" />
            </div>
            <span className="text-2xl font-bold text-slate-800">NU Wellness</span>
          </div>

          {/* Header */}
          <div className="text-center lg:text-left mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium mb-4">
              <Shield className="w-4 h-4" />
              Admin Portal
            </div>
            <h3 className="text-3xl font-bold text-slate-900 tracking-tight">
              ยินดีต้อนรับกลับ
            </h3>
            <p className="mt-2 text-slate-500">
              เข้าสู่ระบบเพื่อจัดการการนัดหมาย
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 animate-pulse">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-700 text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Username */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700" htmlFor="username">
                ชื่อผู้ใช้งาน
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors">
                  <User size={20} />
                </div>
                <input
                  id="username"
                  type="text"
                  placeholder="ระบุชื่อบัญชีของคุณ"
                  autoComplete="username"
                  className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-900 placeholder:text-slate-400 shadow-sm"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700" htmlFor="password">
                รหัสผ่าน
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors">
                  <Lock size={20} />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full pl-12 pr-12 py-3.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-900 placeholder:text-slate-400 shadow-sm"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/25 transition-all hover:shadow-emerald-500/40 active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 size={22} className="animate-spin" />
                  <span>กำลังเข้าสู่ระบบ...</span>
                </>
              ) : (
                <>
                  เข้าสู่ระบบ <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>

          {/* Demo Account Section */}
          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="px-4 bg-slate-50 text-xs text-slate-400 uppercase tracking-wider">
                  ทดสอบระบบ
                </span>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-100 rounded-lg flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-amber-800">Demo Account</p>
                  <p className="text-xs text-amber-700 mt-1">
                    Username: <code className="px-1.5 py-0.5 bg-amber-100 rounded font-mono">admin</code>
                    {' • '}
                    Password: <code className="px-1.5 py-0.5 bg-amber-100 rounded font-mono">admin123</code>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDemoLogin}
                  disabled={loading}
                  className="px-3 py-1.5 text-xs font-semibold text-amber-700 hover:text-amber-800 bg-amber-100 hover:bg-amber-200 rounded-lg transition-colors flex-shrink-0 disabled:opacity-50"
                >
                  ใช้งาน
                </button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <p className="mt-8 text-center text-xs text-slate-400">
            © 2024 NU Wellness Center. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}