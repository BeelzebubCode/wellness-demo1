// src/features/consultant/shifts/components/BorrowPeriodBadge.tsx

import { Clock, CheckCircle, XCircle } from "lucide-react";
import type { ShiftBorrowPeriod } from "../types";

interface BorrowPeriodBadgeProps {
  borrowPeriod: ShiftBorrowPeriod;
}

export function BorrowPeriodBadge({ borrowPeriod }: BorrowPeriodBadgeProps) {
  const getStatusIcon = () => {
    switch (borrowPeriod.status) {
      case "ACTIVE":
        return <Clock className="h-4 w-4" />;
      case "RETURNED":
        return <CheckCircle className="h-4 w-4" />;
      case "CANCELLED":
        return <XCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getStatusColor = () => {
    switch (borrowPeriod.status) {
      case "ACTIVE":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "RETURNED":
        return "bg-green-100 text-green-800 border-green-200";
      case "CANCELLED":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusText = () => {
    switch (borrowPeriod.status) {
      case "ACTIVE":
        return "กำลังยืม";
      case "RETURNED":
        return "คืนแล้ว";
      case "CANCELLED":
        return "ยกเลิก";
      default:
        return borrowPeriod.status;
    }
  };

  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg border ${getStatusColor()}`}>
      <div className="flex-shrink-0">{getStatusIcon()}</div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm truncate">
          {borrowPeriod.borrowedToUniversity.nameTh}
        </div>
        <div className="text-xs opacity-80 flex items-center gap-1">
          {new Date(borrowPeriod.startDate).toLocaleDateString("th-TH", {
            day: "numeric",
            month: "short",
          })}
          {" "}-{" "}
          {new Date(borrowPeriod.endDate).toLocaleDateString("th-TH", {
            day: "numeric",
            month: "short",
          })}
        </div>
      </div>
      <div className="flex-shrink-0 text-xs font-medium">{getStatusText()}</div>
    </div>
  );
}
