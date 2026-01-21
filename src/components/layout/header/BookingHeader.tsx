// components/layout/header/BookingHeader.tsx
"use client";

import { Menu, User } from "lucide-react";
import LogoutButton from "@/components/auth/LogoutButton";

export interface BookingHeaderProps {
  userName?: string;
  userRole?: string;
  onMenuClick: () => void;
}

export function BookingHeader({
  userName,
  userRole,
  onMenuClick,
}: BookingHeaderProps) {
  return (
    <header className="bg-white sticky top-0 z-30 border-b border-gray-200 shadow-sm px-6 h-20 flex items-center justify-between">
      {/* Left: Menu & Title */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="p-3 -ml-3 text-gray-600 hover:bg-gray-100 rounded-xl md:hidden active:scale-95 transition-all"
          aria-label="เมนูหลัก"
        >
          <Menu className="w-8 h-8" />
        </button>

        <h1 className="text-xl font-bold text-primary-700 md:hidden">
          NU Wellness
        </h1>
      </div>

      {/* Right: User Profile & Actions */}
      <div className="flex items-center gap-4 lg:gap-6">
        {/* User Info (Desktop) */}
        <div className="hidden sm:flex flex-col items-end mr-2">
          <p className="text-lg font-bold text-gray-800 leading-none mb-1">
            {userName || "นักศึกษา"}
          </p>
          <p className="text-sm text-gray-500 font-medium">
            {userRole || "Student"}
          </p>
        </div>

        {/* Avatar Circle */}
        <div className="w-12 h-12 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center border-2 border-primary-200">
          <User className="w-7 h-7" />
        </div>

        <div className="h-8 w-px bg-gray-300 mx-1 hidden sm:block" />

        {/* Logout Button */}
        <LogoutButton
          redirectTo="/login"
          className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors border border-transparent hover:border-red-100"
          label="ออก"
        />
      </div>
    </header>
  );
}

export default BookingHeader;
