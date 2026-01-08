// ==========================================
// 📌 Booking Component: BookingSuccessModal
// ==========================================

'use client';

import { Modal, Button } from '@/components/ui';

export interface BookingSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onViewAppointments?: () => void;
}

export function BookingSuccessModal({
  isOpen,
  onClose,
  onViewAppointments,
}: BookingSuccessModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      showCloseButton={false}
      closeOnOverlayClick={false}
      size="sm"
    >
      <div className="text-center py-6">
        {/* Success Icon */}
        <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg animate-bounce">
          <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          จองสำเร็จ! 🎉
        </h2>

        {/* Description */}
        <p className="text-gray-500 mb-6">
          ระบบได้รับการจองของคุณแล้ว
          <br />
          กรุณารอการแจ้งผลผ่าน LINE
        </p>

        {/* Info Box */}
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

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <Button
            onClick={onViewAppointments || onClose}
            variant="primary"
            size="lg"
            className="w-full bg-primary-500 hover:bg-primary-600"
          >
            📋 ดูตารางนัดของฉัน
          </Button>
          
          <Button
            onClick={onClose}
            variant="ghost"
            size="md"
            className="w-full"
          >
            กลับหน้าจองคิว
          </Button>
        </div>
      </div>
    </Modal>
  );
}
