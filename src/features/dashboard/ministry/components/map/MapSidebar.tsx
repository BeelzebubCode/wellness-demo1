// src/features/dashboard/ministry/components/map/MapSidebar.tsx
"use client";

import { ReactNode } from "react";

type MapSidebarProps = {
  position: "left" | "right";
  children: ReactNode;
  className?: string;
};

export function MapSidebar({ position, children, className = "" }: MapSidebarProps) {
  const baseClasses = "h-full bg-white/95 backdrop-blur-xl shadow-2xl overflow-y-auto";
  const positionClasses = position === "left" 
    ? "border-r border-gray-200" 
    : "border-l border-gray-200";
  
  return (
    <aside className={`${baseClasses} ${positionClasses} ${className}`}>
      <div className="h-full">
        {children}
      </div>
    </aside>
  );
}
