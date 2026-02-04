// src/features/consultant/my-jobs/components/StatWidget.tsx

"use client";

import React from "react";

export function StatWidget({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: number;
  icon: any;
  theme?: string; // เผื่อของเดิมส่งมา
}) {
  return (
    <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group cursor-default">
      <div className="flex items-start justify-between">
        <div className="relative z-10">
          <p className="text-xs font-semibold text-slate-400 mb-0.5">{title}</p>
          <h4 className="text-2xl font-black text-slate-800 tracking-tight">{value}</h4>
        </div>

        <div className="p-2.5 rounded-lg icon-tenant border border-slate-200">
          <Icon className="w-5 h-5 text-primary" />
        </div>
      </div>
    </div>
  );
}
