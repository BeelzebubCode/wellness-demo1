// src/components/layout/ConsultantHeader.tsx

'use client';

import { useRouter } from 'next/navigation';
import { Menu, LogOut, User, Bell, Stethoscope } from 'lucide-react'; 
import { cn } from '@/lib/cn';
import { logout } from '@/features/auth/logout'; 

export interface ConsultantHeaderProps {
  consultantName?: string;
  roleText?: string; 
  // ✅ แก้เป็น Optional (?) จะได้ไม่แดงถ้าลืมส่ง
  onMenuClick?: () => void; 
  className?: string;
}

// ✅ ยังคง export function ไว้เหมือนเดิม (เผื่อใครอยากใช้แบบ { })
export function ConsultantHeader({ 
  consultantName, 
  roleText, 
  onMenuClick,
  className 
}: ConsultantHeaderProps) {
  const router = useRouter();

  const handleLogout = async () => {
    // eslint-disable-next-line no-restricted-globals
    if (!confirm('ต้องการออกจากระบบ?')) return;

    await logout();
    router.replace('/login');
  };

  return (
    <header className={cn(
      "bg-white sticky top-0 z-30 border-b border-slate-200 shadow-sm px-6 h-20 flex items-center justify-between font-sans",
      className
    )}>
      
      {/* --- Left: Menu & Brand --- */}
      <div className="flex items-center gap-4">
        <button 
          // ✅ เช็คก่อนเรียกใช้ (ถ้า onMenuClick มีค่า ค่อยทำ)
          onClick={() => onMenuClick?.()}
          className="p-3 -ml-3 text-slate-500 hover:bg-slate-100 hover:text-teal-700 rounded-xl lg:hidden active:scale-95 transition-all"
          aria-label="เมนูหลัก"
        >
          <Menu className="w-8 h-8" />
        </button>

        {/* Brand Name (Mobile/Tablet) */}
        <div className="flex items-center gap-2 lg:hidden">
            <div className="bg-teal-600 p-1.5 rounded-lg">
                <Stethoscope className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-teal-900">NU Wellness</h1>
        </div>
      </div>

      {/* --- Right: Profile & Actions --- */}
      <div className="flex items-center gap-4 lg:gap-6">
        
        {/* Notification Bell (Optional) */}
        <button className="relative p-2 text-slate-400 hover:bg-slate-50 rounded-full transition-colors hidden sm:block">
            <Bell className="w-6 h-6" />
        </button>

        {/* User Info (Desktop) */}
        <div className="hidden sm:flex flex-col items-end mr-1">
          <p className="text-base font-bold text-slate-800 leading-tight mb-0.5">
            {consultantName || 'ผู้ให้คำปรึกษา'}
          </p>
          <p className="text-xs text-teal-600 font-medium bg-teal-50 px-2 py-0.5 rounded-full inline-block">
            {roleText || 'Consultant'}
          </p>
        </div>
        
        {/* Avatar Circle */}
        <div className="w-11 h-11 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center border-2 border-teal-100 shadow-sm">
          <User className="w-6 h-6" />
        </div>

        {/* Separator */}
        <div className="h-8 w-px bg-slate-200 mx-1 hidden sm:block"></div>

        {/* Logout Button */}
        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 group"
          title="ออกจากระบบ"
        >
          <LogOut className="w-6 h-6 group-hover:-translate-x-0.5 transition-transform" />
          <span className="hidden lg:inline text-sm font-semibold">ออก</span>
        </button>
      </div>
    </header>
  );
}

// ✅ เพิ่มบรรทัดนี้: เพื่อให้หน้าอื่น Import แบบไม่มี { } ได้!
export default ConsultantHeader;