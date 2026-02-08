// src/features/dashboard/ministry/components/MinistryMapDashboard.tsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { MINISTRY_NAV } from "@/lib/constants/ministry-nav";
import { LogOut, Shield } from "lucide-react";
import dynamic from "next/dynamic";

const ThailandMap = dynamic(
  () => import("./map/ThailandMap").then((mod) => ({ default: mod.ThailandMap })),
  { ssr: false }
);

export function MinistryMapDashboard() {
  const router = useRouter();

  const handleLogout = () => {
    router.push("/login");
  };

  return (
    <div className="h-screen w-full bg-gray-50 flex flex-col overflow-hidden">
      {/* Modern Minimal Header - White Theme */}
      <header className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200 shadow-sm z-20 animate-fadeIn">
        
        {/* Left: Branding & Nav */}
        <div className="flex items-center gap-6">
           {/* Logo - Minimal Black Circle */}
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center shadow-md hover:shadow-lg transition-shadow">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-gray-900 font-bold text-sm tracking-tight">กระทรวงการอุดมศึกษา</div>
                <div className="text-gray-500 text-xs">แดชบอร์ดสุขภาพจิตนักศึกษา</div>
              </div>
           </div>

           <div className="w-px h-8 bg-gray-200" />

           {/* Nav - Minimal Tabs */}
           <nav className="flex items-center gap-2">
              {MINISTRY_NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    px-4 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-2
                    hover:shadow-sm
                    ${item.href === "/ministry" 
                      ? "bg-gray-900 text-white shadow-md" 
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }
                  `}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              ))}
           </nav>
        </div>

        {/* Right: Logout - Minimal */}
        <div className="flex items-center gap-4">
            <button 
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-all"
            >
                <LogOut className="w-4 h-4" />
                ออกจากระบบ
            </button>
        </div>
      </header>

      {/* Fullscreen Map */}
      <div className="flex-1 w-full">
        <ThailandMap />
      </div>

      {/* Global Animations */}
      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out;
        }

        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .animate-slideInRight {
          animation: slideInRight 0.3s ease-out both;
        }
      `}</style>
    </div>
  );
}
