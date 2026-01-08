// ==========================================
// 📌 UI Component: Modal (Fixed Full Screen)
// ==========================================

'use client';

import { Fragment, type ReactNode, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/cn';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  children: ReactNode;
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  size = 'md',
  children,
  showCloseButton = true,
  closeOnOverlayClick = true,
}: ModalProps) {
  // 1. ตรวจสอบว่า Component รันบน Client แล้วหรือยัง
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // ล็อคการ Scroll ของ Body เมื่อเปิด Modal
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // คืนค่าเมื่อ Component ถูกทำลาย
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // ถ้ายังไม่ Mount หรือไม่ได้เปิด Modal ให้ return null
  if (!mounted || !isOpen) return null;

  const sizeStyles = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: 'max-w-4xl',
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && closeOnOverlayClick) {
      onClose();
    }
  };

  // 2. ใช้ createPortal ย้าย Modal ไปที่ document.body
  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      onClick={handleOverlayClick}
    >
      {/* Overlay สีดำ */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" />

      {/* Modal Content */}
      <div
        className={cn(
          'relative w-full bg-white rounded-2xl shadow-2xl',
          'animate-in zoom-in-95 fade-in duration-200',
          sizeStyles[size]
        )}
      >
        {/* Header */}
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
                onClick={onClose}
                className="ml-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className="p-6">{children}</div>
      </div>
    </div>,
    document.body // 👈 จุดสำคัญ: สั่งให้ไปแปะที่ body โดยตรง
  );
}

// ----- Modal Footer -----
export interface ModalFooterProps {
  children: ReactNode;
  className?: string;
}

export function ModalFooter({ children, className }: ModalFooterProps) {
  return (
    <div className={cn('flex items-center justify-end gap-3 pt-4 border-t border-gray-100', className)}>
      {children}
    </div>
  );
}

// ----- Modal Body -----
export interface ModalBodyProps {
  children: ReactNode;
  className?: string;
}

export function ModalBody({ children, className }: ModalBodyProps) {
  return <div className={cn('', className)}>{children}</div>;
}