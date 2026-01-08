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
};

export function BrandLogo({
  href = "/",
  size = 48, //ขนาด BrandLogo
  showText = true,
  variant = "default",
  className,
  textClassName,
  subtitle,
}: BrandLogoProps) {
  const src =
    variant === "white"
      ? "/images/Brand_wellness_center1.png"
      : "/brand/nu-wellness-logo.png";

  return (
    <Link
      href={href}
      className={cn("flex items-center gap-4 select-none", className)}
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
          <div
            className={cn(
              "font-semibold tracking-tight text-[22px]",
              textClassName
            )}
          >
            NU Wellness Center
          </div>

          {subtitle && (
            <div
              className={cn(
                "text-[13px] text-slate-500",
                textClassName
              )}
            >
              {subtitle}
            </div>
          )}
        </div>
      )}
    </Link>
  );
}
