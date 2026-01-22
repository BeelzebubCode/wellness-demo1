// components/shared/BrandLogo.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
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
  tenantCode?: TenantCode | string | null; // optional override
  title?: string; // optional override
  logoSrc?: string; // optional override
  alt?: string; // optional override
};

function getTenantFromDom(): string | null {
  if (typeof document === "undefined") return null;
  return document.documentElement?.dataset?.tenant ?? null; // html[data-tenant="..."]
}

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
  // ✅ if tenantCode not provided -> auto read from html[data-tenant]
  const [domTenant, setDomTenant] = useState<string | null>(() => getTenantFromDom());

  useEffect(() => {
    // initial sync
    setDomTenant(getTenantFromDom());

    // watch html[data-tenant] changes
    const el = document.documentElement;

    const obs = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === "attributes" && m.attributeName === "data-tenant") {
          setDomTenant(getTenantFromDom());
          break;
        }
      }
    });

    obs.observe(el, { attributes: true, attributeFilter: ["data-tenant"] });
    return () => obs.disconnect();
  }, []);

  const resolvedCode = useMemo(() => {
    const raw =
      typeof tenantCode === "string"
        ? tenantCode
        : tenantCode ?? domTenant ?? null;

    return normalizeTenant(raw);
  }, [tenantCode, domTenant]);

  const tenant = TENANTS[resolvedCode] ?? TENANTS.DEFAULT;

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
          <div
            className={cn(
              "font-semibold tracking-tight text-[22px] truncate text-[rgb(var(--fg))]",
              textClassName,
            )}
          >
            {resolvedTitle}
          </div>

          {subtitle && (
            <div
              className={cn(
                "text-[13px] truncate text-[rgb(var(--muted))]",
                textClassName,
              )}
            >
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
