"use client";

import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/cn";
import type { PRItem } from "@/features/pr/types";

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
        "group block overflow-hidden rounded-2xl",
        "border border-slate-200 bg-white",
        "shadow-sm hover:shadow-md transition-all"
      )}
    >
      {/* Cover */}
      <div className="relative aspect-[16/9] bg-slate-100">
        {item.coverImage ? (
          <Image
            src={item.coverImage}
            alt={item.title}
            fill
            className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            priority={false}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-sm">
            No image
          </div>
        )}

        {/* subtle overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/12 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      {/* Content */}
      <div className="p-4">
        <p className="text-xs text-slate-500">{formatThaiDate(item.publishedAt)}</p>

        <h3 className="mt-1 text-sm sm:text-base font-extrabold text-slate-900 line-clamp-2 group-hover:text-primary-700 transition-colors">
          {item.title}
        </h3>

        {item.excerpt && (
          <p className="mt-2 text-xs sm:text-sm text-slate-600 line-clamp-2">
            {item.excerpt}
          </p>
        )}

        <div className="mt-3 text-xs font-semibold text-primary-700">
          Read More →
        </div>
      </div>
    </Link>
  );
}
