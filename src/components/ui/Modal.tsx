"use client";

import React, { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/cn";

type ModalPropsBase = {
  title?: string;
  description?: string;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  children: ReactNode;

  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  className?: string;
  contentClassName?: string;
  titleSize?: "sm" | "md" | "lg";
};

type ModalPropsIsOpen = ModalPropsBase & {
  isOpen: boolean;
  onClose: () => void;
  open?: never;
  onOpenChange?: never;
};

type ModalPropsOpen = ModalPropsBase & {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isOpen?: never;
  onClose?: never;
};

export type ModalProps = ModalPropsIsOpen | ModalPropsOpen;

function isLegacyModalProps(p: ModalProps): p is ModalPropsIsOpen {
  return (p as ModalPropsIsOpen).isOpen !== undefined;
}

export function Modal(props: ModalProps) {
  const [mounted, setMounted] = useState(false);
  const isOpen = isLegacyModalProps(props) ? props.isOpen : props.open;

  const close = () => {
    if (isLegacyModalProps(props)) return props.onClose();
    return props.onOpenChange(false);
  };

  useEffect(() => setMounted(true), []);

  // ✅ FIX: ปิด scrollbar ทั้ง html และ body
  useEffect(() => {
    if (!mounted) return;

    const html = document.documentElement;
    const body = document.body;

    if (isOpen) {
      body.style.overflow = "hidden";
      html.style.overflow = "hidden";
    } else {
      body.style.overflow = "";
      html.style.overflow = "";
    }

    return () => {
      body.style.overflow = "";
      html.style.overflow = "";
    };
  }, [isOpen, mounted]);

  if (!mounted || !isOpen) return null;

  const {
    title,
    size = "md",
    children,
    showCloseButton = true,
    closeOnOverlayClick = true,
    className,
    contentClassName,
    titleSize = "md",
  } = props;

  const sizeStyles: Record<NonNullable<ModalPropsBase["size"]>, string> = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    full: "max-w-5xl",
  };

  const titleStyles: Record<NonNullable<ModalPropsBase["titleSize"]>, string> = {
    sm: "text-base font-semibold",
    md: "text-lg font-semibold",
    lg: "text-xl font-bold",
  };

  const handleOverlayClick: React.MouseEventHandler<HTMLDivElement> = (e) => {
    if (e.target === e.currentTarget && closeOnOverlayClick) close();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-hidden"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-label={title ?? "Modal"}
    >
      {/* overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" />

      {/* content container */}
      <div
        className={cn(
          "relative w-full bg-white rounded-2xl shadow-xl overflow-hidden",
          "flex flex-col max-h-[90vh]",
          "animate-in zoom-in-95 fade-in duration-200",
          sizeStyles[size],
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between px-6 h-14 border-b border-gray-100 shrink-0">
            <div className="flex items-center min-w-0">
              {title && (
                <h2
                  className={cn(
                    "text-gray-900 truncate font-black tracking-tight",
                    titleStyles[titleSize]
                  )}
                >
                  {title}
                </h2>
              )}
            </div>

            {showCloseButton && (
              <button
                type="button"
                onClick={close}
                aria-label="ปิด"
                className="flex items-center justify-center w-10 h-10 rounded-xl text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 shrink-0"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* ✅ BODY SCROLL ONLY HERE */}
        <div
          className={cn(
            "p-5 flex-1 overflow-y-auto",
            contentClassName
          )}
        >
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}

export function ModalFooter({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-end gap-3 border-t border-gray-100 pt-4",
        className
      )}
    >
      {children}
    </div>
  );
}

export function ModalBody({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("", className)}>{children}</div>;
}
