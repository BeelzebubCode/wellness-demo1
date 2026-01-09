"use client";

import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/cn";

type BrandLogoProps = {
  href?: string;
  size?: number; // px
  showText?: boolean;
  variant?: "default" | "white";
  className?: string;
  textClassName?: string;
  subtitle?: string;

  // ✅ เพิ่ม: ใช้คุม class ของรูป (เช่น rounded-full, p-1)
  imgClassName?: string;

  // ✅ เพิ่ม: กัน Link ซ้อน Link (ใช้ใน Header)
  asLink?: boolean;
};

export function BrandLogo({
  href = "/",
  asLink = true,
  size = 48,
  showText = true,
  variant = "default",
  className,
  textClassName,
  subtitle,
  imgClassName,
}: BrandLogoProps) {
  const src =
    variant === "white"
      ? "/images/Brand_wellness_center1.png"
      : "/images/Brand_wellness_center1.png";

  const content = (
    <div className={cn("flex items-center gap-4 select-none", className)}>
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <Image
          src={src}
          alt="NU Wellness"
          fill
          sizes={`${size}px`}
          priority
          className={cn("object-contain", imgClassName)}
        />
      </div>

      {showText && (
        <div className="leading-tight min-w-0">
          <div className={cn("font-semibold tracking-tight text-[22px] truncate", textClassName)}>
            NU Wellness Center
          </div>

          {subtitle && (
            <div className={cn("text-[13px] text-slate-500 truncate", textClassName)}>
              {subtitle}
            </div>
          )}
        </div>
      )}
    </div>
  );

  // ✅ ไม่ให้เกิด <Link> ซ้อน <Link>
  if (!asLink) return content;

  return (
    <Link href={href} aria-label="NU Wellness">
      {content}
    </Link>
  );
}
