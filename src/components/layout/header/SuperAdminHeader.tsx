// components/layout/header/SuperAdminHeader.tsx
"use client";

import { User } from "lucide-react";
import LogoutButton from "@/components/auth/LogoutButton";

export interface SuperAdminHeaderProps {
  adminName?: string;
  adminRole?: string; // SUPER_ADMIN
}

export function SuperAdminHeader({
  adminName,
  adminRole,
}: SuperAdminHeaderProps) {
  return (
    <header className="bg-white sticky top-0 z-30 border-b border-slate-200 shadow-sm px-6 h-20 flex items-center justify-end">
      {/* Right only (เหมือน BookingHeader แต่ตัดซ้ายทิ้ง) */}
      <div className="flex items-center gap-4 lg:gap-6">
        <div className="hidden sm:flex flex-col items-end mr-2">
          <p className="text-xs font-semibold text-slate-800 leading-none">
            {adminName || "Super Admin"}
          </p>
          <p className="text-xs text-slate-500 font-medium">
            {adminRole || "SUPER_ADMIN"}
          </p>
        </div>

        <div className="w-12 h-12 bg-slate-100 text-slate-700 rounded-full flex items-center justify-center border-2 border-slate-200">
          <User className="w-7 h-7" />
        </div>

        <div className="h-8 w-px bg-slate-300 mx-1 hidden sm:block" />

        <LogoutButton
          redirectTo="/login"
          label="ออก"
          className="
            inline-flex items-center gap-1.5
            px-3 py-2
            rounded-full
            text-xs font-semibold
            text-rose-600
            border border-rose-200/60
            hover:bg-rose-50
            transition
          "
        />
      </div>
    </header>
  );
}

export default SuperAdminHeader;
