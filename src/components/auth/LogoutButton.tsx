"use client";

import { useState } from "react";
import Image from "next/image";
import { LogOut } from "lucide-react";
import { logout } from "@/features/auth/logout";
import { Modal } from "@/components/ui";
import { useNotificationContext } from "@/components/notification/NotificationProvider";
import { clearTenantTheme } from "@/lib/tenant/client";

type Props = {
  redirectTo?: string;
  label?: string;
  className?: string;
  iconOnly?: boolean;
};

export default function LogoutButton({
  redirectTo = "/login",
  label = "ออก",
  className,
  iconOnly = false,
}: Props) {
  const { push } = useNotificationContext();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const onConfirm = async () => {
    if (loading) return;
    setLoading(true);

    try {
      await logout();

      localStorage.removeItem("token");
      localStorage.removeItem("auth_user");
      clearTenantTheme();

      // ✅ กัน toast "กรุณาเข้าสู่ระบบ" ซ้อนตอน redirect ไปหน้า login
      try { sessionStorage.setItem("suppress_login_toast_once", "1"); } catch { }

      // ✅ redirect ทันทีไม่ต้องรอ — stay on same host
      setIsOpen(false);
      window.location.href = `${window.location.origin}${redirectTo}`;
    } catch (err) {
      console.error(err);
      push({
        type: "error",
        title: "ออกจากระบบไม่สำเร็จ",
        message: "กรุณาลองใหม่อีกครั้ง",
        duration: 2000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={className}
        title="ออกจากระบบ"
      >
        <LogOut className="w-4 h-4" />
        {!iconOnly && (
          <span className="hidden lg:inline text-xs font-semibold">
            {label}
          </span>
        )}
      </button>

      {/* Modal */}
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} size="md">
        <div className="flex flex-col items-center text-center px-6 py-8">
          <div className="mb-6 relative w-40 h-32">
            <Image
              src="/images/logout-illustration.jpg"
              alt="Logout"
              width={160}
              height={128}
              className="w-auto h-auto"
            />
          </div>

          {/* Title */}
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            ยืนยันออกจากระบบหรือไม่?
          </h2>

          {/* Description */}
          <p className="text-sm text-gray-500 max-w-sm mb-6">
            คุณสามารถเข้าสู่ระบบใหม่ได้ทุกเมื่อ
          </p>

          {/* Actions */}
          <div className="flex gap-4">
            {/* Cancel */}
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              disabled={loading}
              className="
                px-6 py-2 rounded-full
                border border-gray-300
                text-gray-700 bg-white
                text-sm font-semibold
                hover:bg-gray-100
                transition
                disabled:opacity-50
              "
            >
              ยกเลิก
            </button>

            {/* Logout */}
            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className="
                px-6 py-2 rounded-full
                border border-gray-300
                text-gray-700 bg-white
                text-sm font-semibold
                transition
                hover:bg-red-50
                hover:text-red-600
                hover:border-red-300
                disabled:opacity-50
              "
            >
              {loading ? "กำลังออก..." : "ออกจากระบบ"}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
