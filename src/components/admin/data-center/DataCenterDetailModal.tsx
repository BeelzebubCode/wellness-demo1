"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import StatusBadge from "@/components/shared/StatusBadge";

interface Props {
  bookingId: number | null;
  onClose: () => void;
}

export default function DataCenterDetailModal({ bookingId, onClose }: Props) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!bookingId) return;

    setLoading(true);
    fetch(`/api/admin/data-center/${bookingId}`)
      .then(res => res.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [bookingId]);

  return (
    <Modal
        isOpen={!!bookingId}
        onClose={onClose}
        title="รายละเอียดการนัดหมาย"
    >
      {loading ? (
        <div className="p-10 flex justify-center">
          <Spinner />
        </div>
      ) : data ? (
        <div className="space-y-4 text-sm">
          <StatusBadge status={data.status} />
          <div>นักเรียน: {data.student.name}</div>
          <div>หัวข้อ: {data.problemType}</div>
          <div>
            เวลา: {data.appointment.start} – {data.appointment.end}
          </div>
        </div>
      ) : (
        <div className="p-6 text-center text-gray-400">
          ไม่พบข้อมูล
        </div>
      )}
    </Modal>
  );
}
