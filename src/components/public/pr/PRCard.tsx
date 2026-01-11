"use client";

import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/cn";
import type { PRItem } from "@/features/pr/types";
import { CalendarDays, ArrowUpRight, ExternalLink } from "lucide-react";

function formatThaiDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("th-TH", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export function PRCard({ item }: { item: PRItem }) {
  const link = item.href ?? `/pr/${item.slug}`;
  const isExternal = !!item.href;

  return (
    <Link
      href={link}
      target={isExternal ? "_blank" : undefined}
      rel={isExternal ? "noreferrer" : undefined}
      className={cn(
        "group block overflow-hidden rounded-3xl",
        "border bg-white/70 backdrop-blur",
        "shadow-[0_14px_40px_rgba(2,6,23,0.06)]",
        "hover:shadow-[0_22px_70px_rgba(47,164,169,0.14)]",
        "hover:-translate-y-1 transition-all duration-300"
      )}
      style={{ borderColor: "rgba(209,234,234,0.9)" }}
    >
      {/* รูป: ไม่กินพื้นที่เกิน */}
      <div className="relative h-[180px] sm:h-[190px] bg-slate-100">
        {item.coverImage ? (
          <Image
            src={item.coverImage}
            alt={item.title}
            fill
            className="object-cover group-hover:scale-[1.02] transition-transform duration-500"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center text-slate-400 text-sm">
            No image
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-black/0 to-transparent" />

        {/* Date badge */}
        <div className="absolute left-4 top-4">
          <span className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 bg-white/75 backdrop-blur border border-white/60 text-xs font-semibold text-slate-800 shadow-sm">
            <CalendarDays className="w-4 h-4 text-primary-600" />
            {formatThaiDate(item.publishedAt)}
          </span>
        </div>

        {isExternal && (
          <div className="absolute right-4 top-4">
            <span className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 bg-white/75 backdrop-blur border border-white/60 text-xs font-semibold text-slate-800 shadow-sm">
              <ExternalLink className="w-4 h-4" />
              ลิงก์ภายนอก
            </span>
          </div>
        )}
      </div>

      {/* เนื้อหา: กระชับ */}
      <div className="p-4 sm:p-5">
        <h3 className="text-base sm:text-lg font-extrabold text-slate-900 leading-snug line-clamp-2 group-hover:text-primary-700 transition-colors">
          {item.title}
        </h3>

        {/* หน้า Home ให้สั้น 1 บรรทัด ไม่รก */}
        {item.excerpt && (
          <p className="mt-2 text-sm text-slate-600 leading-relaxed line-clamp-1">
            {item.excerpt}
          </p>
        )}

        <div className="mt-4 flex items-center justify-between">
          <span className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 bg-primary-50/70 border border-primary-100 text-xs font-extrabold text-primary-700">
            อ่านต่อ
            <ArrowUpRight className="w-4 h-4" />
          </span>
          <span className="text-xs text-slate-400 group-hover:text-slate-500 transition">
            คลิกเพื่อเปิด
          </span>
        </div>
      </div>
    </Link>
  );
}
