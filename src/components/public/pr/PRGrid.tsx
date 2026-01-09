"use client";

import { PRCard } from "./PRCard";
import type { PRItem } from "@/features/pr/types";

export function PRGrid({ items }: { items: PRItem[] }) {
  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">
            ข่าวประชาสัมพันธ์
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            อัปเดตประกาศและข่าวสารล่าสุดจากหน่วยงาน
          </p>
        </div>
        <a
          href="/public/pr"
          className="text-xs font-semibold text-slate-500 hover:text-primary-700"
        >
          ดูทั้งหมด →
        </a>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((it) => (
          <PRCard key={it.id} item={it} />
        ))}
      </div>
    </section>
  );
}
