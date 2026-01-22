// components/auth/LogoutButton.tsx
"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { logout } from "@/features/auth/logout";
import { Button, Modal, ModalFooter } from "@/components/ui";
import { useNotificationContext } from "@/components/notification/NotificationProvider";

type Props = {
  redirectTo?: string; // default "/login"
  label?: string;
  className?: string;
  iconOnly?: boolean;
  confirmTitle?: string;
  confirmDescription?: string;
  buttonVariant?: "ghost" | "primary" | "danger";
};

function getCentralOriginFromHost() {
  const protocol = window.location.protocol;
  const hostname = window.location.hostname.toLowerCase();
  const port = window.location.port;

  // localhost / ip -> ไม่มี central domain ให้ตัด
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return window.location.origin;
  }

  const parts = hostname.split(".");

  // tenant.root.tld -> ตัด tenant ออก = root.tld
  // kku.wellness.local -> wellness.local
  // nu.wellness.local  -> wellness.local
  const baseDomain = parts.length >= 3 ? parts.slice(1).join(".") : hostname;

  return `${protocol}//${baseDomain}${port ? `:${port}` : ""}`;
}

function newToastId() {
  const c: any = globalThis.crypto;
  return c?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function LogoutButton({
  redirectTo = "/login",
  label = "ออก",
  className,
  iconOnly = false,
  confirmTitle = "ยืนยันออกจากระบบ",
  confirmDescription = "ต้องการออกจากระบบใช่ไหม?",
  buttonVariant = "danger",
}: Props) {
  const { push } = useNotificationContext();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const onConfirm = async () => {
    if (loading) return;
    setLoading(true);

    try {
      await logout(); // ✅ ต้อง include cookies ในฟังก์ชันนี้ (ดูไฟล์ล่าง)

      try {
        localStorage.removeItem("token");
        localStorage.removeItem("auth_user");
      } catch {}

      window.dispatchEvent(new Event("auth-changed"));
      setIsOpen(false);

      // ✅ ไปโดเมนกลาง (wellness.local)
      const central = getCentralOriginFromHost();
      const url = new URL(`${central}${redirectTo}`);

      // ✅ toast
      url.searchParams.set("toast", "logout");
      url.searchParams.set("toastId", newToastId());

      // ✅ tenant กลับ DEFAULT
      url.searchParams.set("tenant", "DEFAULT");

      window.location.assign(url.toString());
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
        {!iconOnly && <span className="hidden lg:inline text-base font-semibold">{label}</span>}
      </button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={confirmTitle}
        description={confirmDescription}
        size="sm"
      >
        <ModalFooter className="mt-2 grid grid-cols-2 gap-3">
          <Button className="w-full" variant="ghost" onClick={() => setIsOpen(false)} disabled={loading}>
            ยกเลิก
          </Button>

          <Button className="w-full" variant={buttonVariant} onClick={onConfirm} disabled={loading}>
            {loading ? "กำลังออก..." : "ออกจากระบบ"}
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
}
