// src/features/head-consultant/exception-requests/hooks/useExceptionReview.ts
"use client";

import { useState } from "react";
import { reviewExceptionRequest } from "../api/requests";
import { useToast } from "@/contexts/ToastContext";

export function useExceptionReview(onSuccess?: () => void) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { success, error } = useToast();

  const doReview = async (id: number, action: "APPROVE" | "REJECT", decisionNote?: string) => {
    setIsSubmitting(true);
    try {
      await reviewExceptionRequest(id, action, decisionNote);
      success(`ดำเนินการ ${action === "APPROVE" ? "อนุมัติ" : "ปฏิเสธ"} เรียบร้อยแล้ว`);
      onSuccess?.();
    } catch (e: any) {
      error(e.message || "ไม่สามารถดำเนินการได้");
      throw e;
    } finally {
      setIsSubmitting(false);
    }
  };

  return { doReview, isSubmitting };
}
