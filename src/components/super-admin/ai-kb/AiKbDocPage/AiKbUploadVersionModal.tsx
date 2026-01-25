// components/super-admin/ai-kb/AiKbDocPage/AiKbUploadVersionModal.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { cn } from "@/lib/cn";
import { FileDropzone } from "@/components/ui/FileDropzone";

export function AiKbUploadVersionModal(props: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  isUploading?: boolean;
  onUpload: (input: { file: File; contentType?: "MARKDOWN" | "JSON" }) => Promise<void> | void;
}) {
  const { open, onOpenChange, isUploading, onUpload } = props;

  const [contentType, setContentType] = useState<"AUTO" | "MARKDOWN" | "JSON">("AUTO");
  const [file, setFile] = useState<File | null>(null);

  const canSubmit = useMemo(() => !!file && !isUploading, [file, isUploading]);

  useEffect(() => {
    if (!open) {
      setFile(null);
      setContentType("AUTO");
    }
  }, [open]);

  return (
    <Modal open={open} onOpenChange={onOpenChange} title="อัปโหลดเวอร์ชันใหม่">
      <div className="space-y-5 p-1">
        
        {/* 1. ส่วนตั้งค่า (ย้ายขึ้นมาบนสุด) */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700">ประเภทเนื้อหา (Content Type)</label>
          <Select
            value={contentType}
            onValueChange={(v) => setContentType(v as any)}
            options={[
              { value: "AUTO", label: "Auto Detect (แนะนำ)" },
              { value: "MARKDOWN", label: "Markdown" },
              { value: "JSON", label: "JSON" },
            ]}
          />
          <p className="text-[10px] text-slate-400">
             * ระบบจะตรวจสอบจากนามสกุลไฟล์ หากเลือก Auto
          </p>
        </div>

        {/* 2. เส้นคั่น */}
        <div className="h-px bg-slate-100 my-2" />

        {/* 3. ส่วนไฟล์ (ย้ายลงมาล่าง + เพิ่ม Label) */}
        <FileDropzone
            label="ไฟล์เวอร์ชันใหม่"
            value={file}
            onChange={setFile}
            helperText="รองรับ .md, .json, .txt (ไฟล์จะถูกแปลงเป็นเวอร์ชันใหม่)"
        />

        {/* 4. ปุ่ม Action */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isUploading}>
            ยกเลิก
          </Button>

          <Button
            disabled={!canSubmit}
            className={cn(isUploading && "cursor-not-allowed opacity-70")}
            onClick={async () => {
              if (!file) return;
              try {
                await onUpload({
                  file,
                  contentType: contentType === "AUTO" ? undefined : contentType,
                });
                setFile(null);
                setContentType("AUTO");
              } catch {
                // error handled by parent
              }
            }}
          >
            {isUploading ? "กำลังอัปโหลด..." : "ยืนยันอัปโหลด"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}