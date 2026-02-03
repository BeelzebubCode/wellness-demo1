"use client";

import { Modal, Button } from "@/components/ui";

export function BookingFeedbackModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="ประเมินความพึงพอใจ" size="md">
      <div className="text-sm text-gray-600">
        (Coming soon) ฟอร์มประเมินความพึงพอใจ
      </div>

      <div className="mt-4">
        <Button variant="secondary" onClick={onClose} className="w-full">
          ปิด
        </Button>
      </div>
    </Modal>
  );
}
