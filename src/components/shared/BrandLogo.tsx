// components/shared/BrandLogo.tsx (หรือ path ที่นายใช้)
"use client";

import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/cn";
import { TENANTS, normalizeTenant, type TenantCode } from "@/config/tenants";

type BrandLogoProps = {
  href?: string;
  size?: number; // px
  showText?: boolean;
  variant?: "default" | "white";
  className?: string;
  textClassName?: string;
  subtitle?: string;

  imgClassName?: string;
  asLink?: boolean;
  tenantCode?: TenantCode | string | null;
  title?: string;
  logoSrc?: string;
  alt?: string;
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

  tenantCode,
  title,
  logoSrc,
  alt,
}: BrandLogoProps) {
  const code = normalizeTenant(typeof tenantCode === "string" ? tenantCode : tenantCode ?? null);
  const tenant = TENANTS[code] ?? TENANTS.DEFAULT;

  // ✅ default จาก tenant (override ได้)
  const resolvedTitle = title ?? tenant.brandName;
  const resolvedAlt = alt ?? resolvedTitle;

  // ✅ logo (override ได้)
  const resolvedLogo =
    logoSrc ??
    tenant.logo ??
    (variant === "white"
      ? "/images/Brand_wellness_center1.png"
      : "/images/Brand_wellness_center1.png");

  const content = (
    <div className={cn("flex items-center gap-4 select-none", className)}>
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <Image
          src={resolvedLogo}
          alt={resolvedAlt}
          fill
          sizes={`${size}px`}
          priority
          className={cn("object-contain", imgClassName)}
        />
      </div>

      {showText && (
        <div className="leading-tight min-w-0">
          <div className={cn("font-semibold tracking-tight text-[22px] truncate", textClassName)}>
            {resolvedTitle}
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

  if (!asLink) return content;

  return (
    <Link href={href} aria-label={resolvedAlt}>
      {content}
    </Link>
  );
}
