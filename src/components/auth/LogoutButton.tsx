"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogOut } from "lucide-react";

import { logout } from "@/features/auth/logout";
import { Button, Modal, ModalFooter } from "@/components/ui";
import { useNotificationContext } from "@/components/notification/NotificationProvider"; // ✅ เพิ่ม

type Props = {
  redirectTo?: string;
  label?: string;
  className?: string;
  iconOnly?: boolean;

  // modal text
  confirmTitle?: string;
  confirmDescription?: string;

  // button style
  buttonVariant?: "ghost" | "primary" | "danger";
};

export default function LogoutButton({
  redirectTo = "/login",
  label = "ออก",
  className,
  iconOnly = false,

  confirmTitle = "ยืนยันออกจากระบบ",
  confirmDescription = "ต้องการออกจากระบบใช่ไหม?",

  buttonVariant = "danger",
}: Props) {
  const router = useRouter();
  const { push } = useNotificationContext(); // ✅ เพิ่ม
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const onConfirm = async () => {
    setLoading(true);
    try {
      // ✅ กัน toast “กรุณาเข้าสู่ระบบ” หลัง logout (1 ครั้ง)
      sessionStorage.setItem("suppress_login_toast_once", "1");

      await logout();

      // ✅ ถ้ายังมีของเก่าค้างไว้ ก็ลบกันเหนียวได้ (ไม่ผิด)
      localStorage.removeItem("token");
      localStorage.removeItem("auth_user");

      window.dispatchEvent(new Event("auth-changed"));

      push({
        type: "success",
        title: "ออกจากระบบสำเร็จ",
        message: "แล้วพบกันใหม่ 👋",
        duration: 1500,
      });

      setIsOpen(false);

      router.replace(redirectTo);
      // router.refresh(); // ❌ แนะนำตัดออก
    } catch (err) {
      console.error(err);

      push({
        type: "error",
        title: "ออกจากระบบไม่สำเร็จ",
        message: "ลองใหม่อีกครั้ง หรือเช็กการเชื่อมต่อ",
        duration: 2000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={className}
        title="ออกจากระบบ"
      >
        <LogOut className="w-6 h-6" />
        {!iconOnly && (
          <span className="hidden lg:inline text-base font-semibold">
            {label}
          </span>
        )}
      </button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={confirmTitle}
        description={confirmDescription}
        size="sm"
      >
        <ModalFooter className="mt-2 grid grid-cols-2 gap-3">
          <Button
            className="w-full"
            variant="ghost"
            onClick={() => setIsOpen(false)}
            disabled={loading}
          >
            ยกเลิก
          </Button>

          <Button
            className="w-full"
            variant={buttonVariant}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "กำลังออก..." : "ออกจากระบบ"}
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
}
