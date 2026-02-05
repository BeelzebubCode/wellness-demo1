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
    <div className="h-screen w-full bg-slate-900 flex flex-col overflow-hidden">
      {/* Professional Header - Dark Theme */}
      <header className="flex items-center justify-between px-6 py-3 bg-slate-950 border-b border-slate-800 shadow-xl z-20">
        
        {/* Left: Branding & Nav */}
        <div className="flex items-center gap-6">
           <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-white font-bold text-sm tracking-wide">Ministry of Higher Education</div>
                <div className="text-slate-400 text-xs">Mental Health Dashboard</div>
              </div>
           </div>

           <div className="w-px h-8 bg-slate-700" />

           <nav className="flex items-center gap-1">
              {MINISTRY_NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-2
                    ${item.href === "/ministry" 
                      ? "bg-indigo-600 text-white shadow-lg" 
                      : "text-slate-300 hover:text-white hover:bg-slate-800"
                    }
                  `}
                >
                  <item.icon className="w-3.5 h-3.5" />
                  {item.label}
                </Link>
              ))}
           </nav>
        </div>

        {/* Right: Logout */}
        <div className="flex items-center gap-4">
            <button 
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-red-400 hover:bg-red-950/50 hover:text-red-300 transition-colors border border-red-900/50 hover:border-red-700"
            >
                <LogOut className="w-3.5 h-3.5" />
                ออกจากระบบ
            </button>
        </div>
      </header>

      {/* Fullscreen Map */}
      <div className="flex-1 w-full">
        <ThailandMap />
      </div>
    </div>
  );
}
