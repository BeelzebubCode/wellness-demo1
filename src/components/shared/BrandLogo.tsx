// src/components/shared/BrandLogo.tsx
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
  subtitle?: string; // optional: "Student Portal"
};

export function BrandLogo({
  href = "/",
  size = 36,
  showText = true,
  variant = "default",
  className,
  textClassName,
  subtitle,
}: BrandLogoProps) {
  const src =
    variant === "white"
      ? "/brand/nu-wellness-logo-white.png"
      : "/brand/nu-wellness-logo.png";

  return (
    <Link
      href={href}
      className={cn("flex items-center gap-3 select-none", className)}
      aria-label="NU Wellness"
    >
      <div
        className="relative shrink-0"
        style={{ width: size, height: size }}
      >
        <Image
          src={src}
          alt="NU Wellness"
          fill
          sizes={`${size}px`}
          priority
          className="object-contain"
        />
      </div>

      {showText && (
        <div className="leading-tight">
          <div className={cn("font-semibold text-[16px]", textClassName)}>
            NU Wellness
          </div>
          {subtitle ? (
            <div className={cn("text-[12px] text-slate-500", textClassName)}>
              {subtitle}
            </div>
          ) : null}
        </div>
      )}
    </Link>
  );
}
