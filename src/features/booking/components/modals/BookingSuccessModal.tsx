'use client';

import { useRouter } from "next/navigation";
import { Modal, Button } from '@/components/ui';
import { FaBook } from "react-icons/fa";

export interface BookingSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;

  // ✅ เพิ่ม: ให้ parent override ได้ (optional)
  onViewAppointments?: () => void;
  appointmentsPath?: string; // optional เผื่ออยากเปลี่ยน path
}

export function BookingSuccessModal({
  isOpen,
  onClose,
  onViewAppointments,
  appointmentsPath = "/booking/my-appointments",
}: BookingSuccessModalProps) {
  const router = useRouter();

  const goToMyAppointments = () => {
    onClose(); // ปิด modal ก่อน

    // ✅ ถ้า parent ส่ง callback มา ให้ใช้ callback
    if (onViewAppointments) return onViewAppointments();

    // ✅ default behavior
    router.push(appointmentsPath);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      showCloseButton={false}
      closeOnOverlayClick={false}
      size="sm"
    >
      <div className="text-center py-6">
        <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg animate-bounce">
          <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-2">จองสำเร็จ!</h2>

        <p className="text-gray-500 mb-6">
          ระบบได้รับการจองของคุณแล้ว
          <br />
          กรุณารอการแจ้งผลผ่าน LINE
        </p>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 text-left">
          <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
            <span>💡</span> สิ่งที่ต้องทำ
          </h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• ตรวจสอบ LINE เพื่อรับการแจ้งผล</li>
            <li>• มาถึงก่อนเวลานัด 10 นาที</li>
            <li>• หากต้องการยกเลิก กรุณาแจ้งล่วงหน้า</li>
          </ul>
        </div>

        <div className="flex flex-col gap-3">
          <Button
            onClick={goToMyAppointments}
            variant="primary"
            size="lg"
            className="w-full bg-primary-500 hover:bg-primary-600 flex items-center justify-center gap-2"
          >
            <FaBook className="w-4 h-4" />
            ดูตารางนัดของฉัน
          </Button>

          <Button onClick={onClose} variant="ghost" size="md" className="w-full">
            กลับหน้าจองคิว
          </Button>
        </div>
      </div>
    </Modal>
  );
}
