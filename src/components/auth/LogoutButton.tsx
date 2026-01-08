"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogOut } from "lucide-react";

import { logout } from "@/features/auth/logout";
import { Button, Modal, ModalFooter } from "@/components/ui";

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
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const onConfirm = async () => {
    setLoading(true);
    try {
      await logout();
      window.dispatchEvent(new Event("auth-changed"));

      router.replace(redirectTo);
      router.refresh(); // ✅ ให้ layout/hook รีอ่านใหม่
    } finally {
      setLoading(false);
      setIsOpen(false);
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
