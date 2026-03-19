// components/layout/header/AdminHeader.tsx
"use client";

import { Menu, User } from "lucide-react";
import LogoutButton from "@/components/auth/LogoutButton";
import { NotificationBell } from "@/components/notification/NotificationBell";

export interface AdminHeaderProps {
  adminName?: string;
  adminRole?: string;
  onMenuClick: () => void;
}

export function AdminHeader({
  adminName,
  adminRole,
  onMenuClick,
}: AdminHeaderProps) {
  return (
    <header className="bg-white sticky top-0 z-30 border-b border-gray-200 shadow-sm px-6 h-20 flex items-center justify-between">
      {/* Left */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onMenuClick}
          className="p-3 -ml-3 text-gray-600 hover:bg-gray-100 rounded-xl md:hidden active:scale-95 transition"
          aria-label="เมนูหลัก"
        >
          <Menu className="w-6 h-6" />
        </button>

        <h1 className="text-sm font-semibold text-primary-700 md:hidden">
          NU Wellness
        </h1>
      </div>

      {/* Right */}
      <div className="flex items-center gap-4 lg:gap-6">
        <NotificationBell />

        <div className="hidden sm:flex flex-col items-end mr-2">
          <p className="text-xs font-semibold text-gray-800 leading-none">
            {adminName || "Head Consultant"}
          </p>
          <p className="text-xs text-gray-500 font-medium">
            {adminRole || "หัวหน้าผู้ให้คำปรึกษา"}
          </p>
        </div>

        <div className="w-12 h-12 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center border-2 border-primary-200">
          <User className="w-7 h-7" />
        </div>

        <div className="h-8 w-px bg-gray-300 mx-1 hidden sm:block" />

        <LogoutButton
          redirectTo="/login"
          label="ออก"
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full
                    text-xs font-semibold
                    text-red-600
                    border border-red-200/60
                    hover:bg-red-50 transition"
        />
      </div>
    </header>
  );
}

export default AdminHeader;
