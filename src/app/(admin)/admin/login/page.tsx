'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
// อย่าลืม: npm i lucide-react ถ้ายังไม่ได้ลง
import { User, Lock, Loader2, Stethoscope, ArrowRight } from 'lucide-react';
import Image from 'next/image';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ username: '', password: '' });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API Call (รอนิดนึงให้ดูเหมือนโหลด)
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setLoading(false);
    // TODO: ต่อ API Login จริงตรงนี้
    console.log('Logging in with:', formData);
    router.push('/admin/bookings'); // ล็อกอินเสร็จไปหน้า Bookings
  };

  return (
    <div className="min-h-screen w-full flex bg-white">
      
      {/* ================= LEFT SIDE: IMAGE SECTION ================= */}
      {/* ซ่อนบนมือถือ (hidden), แสดงครึ่งจอตั้งแต่ lg ขึ้นไป (lg:block lg:w-1/2) */}
      <div className="hidden lg:block relative w-0 lg:w-1/2 bg-slate-900">
        {/* 👉 เปลี่ยน URL รูปภาพของคุณตรง src ด้านล่างนี้ 👈 
          แนะนำ: รูปแนวตั้ง (Portrait) หรือ Square ที่มีความละเอียดสูง
        */}
        <Image
          src="https://images.unsplash.com/photo-1600618528240-fb9fc964b853?q=80&w=2070&auto=format&fit=crop"
          alt="Wellness Center Atmosphere"
          fill // ใช้ fill เพื่อให้รูปขยายเต็ม container แม่
          className="object-cover opacity-90" // object-cover ตัดส่วนเกิน, opacity ทำให้ภาพมืดลงนิดหน่อย
          priority // โหลดรูปนี้ก่อนเป็นอันดับแรก
        />
        
        {/* Overlay Content (ข้อความทับบนรูป) */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/40 to-transparent flex flex-col justify-end p-12 text-white">
          <div className="flex items-center gap-3 mb-4">
             <div className="p-2 bg-white/20 backdrop-blur-md rounded-xl">
                 <Stethoscope size={24} className="text-white" />
             </div>
             <h2 className="text-3xl font-bold tracking-tight">NU Wellness Center</h2>
          </div>
           <p className="text-slate-200 text-lg max-w-md">
             ระบบบริหารจัดการการนัดหมายและบริการสุขภาพ สำหรับเจ้าหน้าที่และผู้ดูแลระบบ
           </p>
        </div>
      </div>

      {/* ================= RIGHT SIDE: LOGIN FORM ================= */}
      {/* เต็มจอบนมือถือ (w-full), ครึ่งจอบน desktop (lg:w-1/2) */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 md:p-16 bg-white">
        <div className="w-full max-w-md space-y-8 animate-fade-in-up">
          
          {/* Header */}
          <div className="text-center lg:text-left">
            <h3 className="text-3xl font-bold text-slate-900 tracking-tight">
              ยินดีต้อนรับกลับ
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              เข้าสู่ระบบ Admin Panel เพื่อจัดการข้อมูล
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-6 mt-8">
            
            {/* Username */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700" htmlFor="username">
                ชื่อผู้ใช้งาน หรือ อีเมล
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <User size={20} />
                </div>
                <input
                  id="username"
                  type="text"
                  placeholder="ระบุชื่อบัญชีของคุณ"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900 placeholder:text-slate-400"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-slate-700" htmlFor="password">
                  รหัสผ่าน
                </label>
                <a href="#" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                  ลืมรหัสผ่าน?
                </a>
              </div>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <Lock size={20} />
                </div>
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900 placeholder:text-slate-400"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all hover:shadow-blue-500/40 active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 size={22} className="animate-spin" />
              ) : (
                <>
                  เข้าสู่ระบบ <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>

          {/* Demo Link (Optional) */}
          <div className="mt-6 text-center">
             <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="w-full border-t border-slate-200"></div>
                  </div>
                  <div className="relative flex justify-center">
                    <span className="px-2 bg-white text-xs text-slate-400 uppercase tracking-wider"> สำหรับทดสอบ </span>
                  </div>
            </div>
            <button type="button" className="text-slate-500 hover:text-blue-600 text-sm font-medium transition-colors flex items-center justify-center gap-1 mx-auto">
              เข้าใช้งานแบบ Demo Account
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}