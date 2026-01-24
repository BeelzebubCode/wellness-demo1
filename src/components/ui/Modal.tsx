"use client";

import React, { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/cn";

/**
 * รองรับ 2 style:
 * 1) isOpen + onClose (ของเดิม)
 * 2) open + onOpenChange (แบบ shadcn / headless)
 */
type ModalPropsBase = {
  title?: string;
  description?: string;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  children: ReactNode;
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
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

// ✅ Type guard ช่วยให้ TS มั่นใจ 100%
function isLegacyModalProps(p: ModalProps): p is ModalPropsIsOpen {
  return (p as ModalPropsIsOpen).isOpen !== undefined;
  // หรือจะใช้: return "isOpen" in p;
  // แต่แบบนี้ชัวร์กว่าเวลา TS จู้จี้กับ optional never
}

export function Modal(props: ModalProps) {
  const [mounted, setMounted] = useState(false);

  const isOpen = isLegacyModalProps(props) ? props.isOpen : props.open;

  const close = () => {
    if (isLegacyModalProps(props)) return props.onClose();
    return props.onOpenChange(false);
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    document.body.style.overflow = isOpen ? "hidden" : "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen, mounted]);

  if (!mounted || !isOpen) return null;

  const {
    title,
    description,
    size = "md",
    children,
    showCloseButton = true,
    closeOnOverlayClick = true,
  } = props;

  const sizeStyles = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    full: "max-w-4xl",
  };

  const handleOverlayClick: React.MouseEventHandler<HTMLDivElement> = (e) => {
    if (e.target === e.currentTarget && closeOnOverlayClick) {
      close();
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      onClick={handleOverlayClick}
    >
      {/* overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" />

      {/* content */}
      <div
        className={cn(
          "relative w-full rounded-2xl bg-white shadow-2xl",
          "animate-in zoom-in-95 fade-in duration-200",
          sizeStyles[size],
        )}
      >
        {(title || showCloseButton) && (
          <div className="flex items-start justify-between p-6 pb-0">
            <div>
              {title && (
                <h2 className="text-xl font-bold text-gray-900">{title}</h2>
              )}
              {description && (
                <p className="mt-1 text-sm text-gray-500">{description}</p>
              )}
            </div>

            {showCloseButton && (
              <button
                onClick={close}
                className="ml-4 rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              >
                <svg
                  className="h-5 w-5"
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

        <div className="p-6">{children}</div>
      </div>
    </div>,
    document.body,
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
        className,
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
