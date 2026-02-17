// src/features/dashboard/dean/components/FacultyHeaderBanner.tsx
"use client";

import React from "react";
import Image from "next/image";

export interface HeaderBadgeItem {
  icon: React.ReactNode;
  label: string;
}

interface Props {
  facultyName: string;
  universityName: string;
  logoUrl?: string;
  badges: HeaderBadgeItem[];
  statusLabel?: string;
}

export function FacultyHeaderBanner({
  facultyName,
  universityName,
  logoUrl,
  badges,
  statusLabel = "ONLINE"
}: Props) {
  return (
    <div className="bg-[#0b0f1a] text-white p-8 relative overflow-hidden">
      {/* Subtle Background Pattern/Effect */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />

      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-8 relative z-10">
        {/* Logo Container */}
        <div className="relative">
          <div className="w-24 h-24 bg-white rounded-xl flex items-center justify-center p-2 shadow-2xl relative overflow-hidden">
            <Image
              src={logoUrl || "/images/logo/CU_logo.png"}
              alt="Logo"
              fill
              className="object-contain"
              sizes="96px"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "https://www.chula.ac.th/wp-content/uploads/2018/01/chula-logo-600.png";
              }}
            />
          </div>

        </div>

        {/* Info Section */}
        <div className="text-center md:text-left space-y-2">
          <div className="flex flex-col items-center md:items-start">
            <h1 className="text-3xl md:text-4xl font-black tracking-tight drop-shadow-lg leading-none z-10">{facultyName}</h1>
            <p className="text-base md:text-lg font-bold text-[rgb(var(--primary))] -mt-3 md:-mt-5 relative z-0 leading-none filter drop-shadow-sm">{universityName}</p>
          </div>
          <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-12">
            {badges.map((badge, index) => (
              <HeaderBadge key={index} icon={badge.icon} label={badge.label} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function HeaderBadge({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 bg-[#1e293b] text-slate-300 px-4 py-2 rounded-xl text-[11px] font-bold border border-slate-700/50 hover:bg-[#2d3b52] hover:text-white transition-all cursor-default shadow-sm group">
      <span className="text-primary group-hover:text-primary transition-colors">{icon}</span>
      <span>{label}</span>
    </div>
  );
}
