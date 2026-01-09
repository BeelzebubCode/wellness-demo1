// components/shared/GoogleMapEmbed.tsx
"use client";

import Image from "next/image";
import { ExternalLink, MapPin } from "lucide-react";
import { cn } from "@/lib/cn";

type GoogleMapEmbedProps = {
  title: string;
  subtitle?: string;
  href: string;
  imageSrc: string;
  heightClassName?: string;
};

export function GoogleMapEmbed({
  title,
  subtitle,
  href,
  imageSrc,
  heightClassName = "h-[240px] sm:h-[280px]",
}: GoogleMapEmbedProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group block"
      aria-label={`เปิด Google Maps: ${title}`}
    >
      <div
        className={cn(
          "relative w-full overflow-hidden rounded-2xl",
          "border border-white/20 shadow-lg",
          heightClassName
        )}
      >
        {/* Map Image */}
        <Image
          src={imageSrc}
          alt={title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, 400px"
        />

        {/* Dark gradient for readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

        {/* Floating info */}
        <div className="absolute bottom-3 left-3 right-3">
          <div
            className={cn(
              "flex items-start gap-3 rounded-xl px-4 py-3",
              "bg-white/90 backdrop-blur-md shadow-md"
            )}
          >
            <div className="mt-0.5 text-primary-600">
              <MapPin className="w-5 h-5" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-extrabold text-slate-900 truncate">
                {title}
              </p>
              {subtitle && (
                <p className="text-xs text-slate-600 truncate">
                  {subtitle}
                </p>
              )}
            </div>

            <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-primary-600 transition-colors" />
          </div>
        </div>
      </div>
    </a>
  );
}
