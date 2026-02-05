// src/features/consultant/my-jobs/components/StatWidget.tsx

"use client";

import React from "react";

const THEME_STYLES = {
  "gradient-blue": {
    container: "bg-gradient-to-br from-blue-50 via-white to-blue-50/50 border-blue-100/60 hover:border-blue-200",
    icon: "bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30",
    value: "text-blue-700",
  },
  "gradient-amber": {
    container: "bg-gradient-to-br from-amber-50 via-white to-amber-50/50 border-amber-100/60 hover:border-amber-200",
    icon: "bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/30",
    value: "text-amber-700",
  },
  "gradient-purple": {
    container: "bg-gradient-to-br from-purple-50 via-white to-purple-50/50 border-purple-100/60 hover:border-purple-200",
    icon: "bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-500/30",
    value: "text-purple-700",
  },
  "gradient-green": {
    container: "bg-gradient-to-br from-emerald-50 via-white to-emerald-50/50 border-emerald-100/60 hover:border-emerald-200",
    icon: "bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/30",
    value: "text-emerald-700",
  },
  tenant: {
    container: "bg-white border-slate-100 hover:border-primary/30",
    icon: "icon-tenant border border-slate-200",
    value: "text-slate-800",
  },
};

export function StatWidget({
  title,
  value,
  icon: Icon,
  theme = "tenant",
}: {
  title: string;
  value: number;
  icon: any;
  theme?: keyof typeof THEME_STYLES;
}) {
  const styles = THEME_STYLES[theme] || THEME_STYLES.tenant;

  return (
    <div className={`relative overflow-hidden p-5 rounded-2xl border shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group cursor-default ${styles.container}`}>
      {/* Hover glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      
      <div className="relative flex items-start justify-between">
        <div className="relative z-10">
          <p className="text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">{title}</p>
          <h4 className={`text-3xl font-black tracking-tight ${styles.value} transition-transform duration-300 group-hover:scale-105`}>
            {value}
          </h4>
        </div>

        <div className={`p-3 rounded-xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 ${styles.icon}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
