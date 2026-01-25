// components/super-admin/ai-kb/AiKbUploadModal.tsx
"use client";

import { useMemo, useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { useUniversities } from "@/features/ai-kb/hooks/useUniversities";
import { FileDropzone } from "@/components/ui/FileDropzone";

type UploadScope = "GLOBAL" | "TENANT";

export type AiKbUploadInput = {
  scope: UploadScope;
  universityId: number | null;
  file: File;
};

export default function AiKbUploadModal(props: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  isUploading?: boolean;
  onUpload: (input: AiKbUploadInput) => Promise<void> | void;
}) {
  const { open, onOpenChange, isUploading = false, onUpload } = props;

  const [scope, setScope] = useState<UploadScope>("GLOBAL");
  const { items: universities, loading: uniLoading } = useUniversities();
  const [universityId, setUniversityId] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    if (!open) {
      setScope("GLOBAL");
      setUniversityId("");
      setFile(null);
    }
  }, [open]);

  const canSubmit = useMemo(() => {
    if (!file) return false;
    if (scope === "TENANT" && !universityId) return false;
    return true;
  }, [file, scope, universityId]);

  async function submit() {
    if (!file) return;
    const uniId = scope === "GLOBAL" ? null : Number(universityId);
    await onUpload({ scope, universityId: uniId, file });
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="เพิ่มเอกสารใหม่ (AI KB)"
      description="อัปโหลดเอกสารเพื่อสร้าง Knowledge Base ใหม่"
    >
      <div className="space-y-5 p-1">
        {/* 1. ส่วนตั้งค่า */}
        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Scope การใช้งาน</label>
            <Select
              value={scope}
              onValueChange={(v) => {
                setScope(v as any);
                setUniversityId("");
              }}
              options={[
                { value: "GLOBAL", label: "Global (ใช้ได้ทุกมหาลัย)" },
                { value: "TENANT", label: "Tenant (เฉพาะมหาลัย)" },
              ]}
            />
          </div>

          {scope === "TENANT" && (
             <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2">
                <label className="text-xs font-semibold text-slate-700">เลือกมหาวิทยาลัย</label>
                <Select
                  value={universityId}
                  onValueChange={(v) => setUniversityId(v)}
                  options={[
                    { value: "", label: uniLoading ? "กำลังโหลด..." : "-- กรุณาเลือก --" },
                    ...universities.map((u) => ({ value: String(u.id), label: u.label })),
                  ]}
                />
             </div>
          )}
        </div>

        {/* 2. เส้นคั่น */}
        <div className="h-px bg-slate-100 my-2" />

        {/* 3. ส่วนไฟล์ */}
        <FileDropzone 
          label="ไฟล์เอกสารต้นฉบับ"
          value={file}
          onChange={setFile}
        />

        {/* 4. ปุ่ม Action */}
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isUploading}>
            ยกเลิก
          </Button>
          <Button onClick={submit} disabled={!canSubmit || isUploading} isLoading={isUploading}>
            อัปโหลดเอกสาร
          </Button>
        </div>
      </div>
    </Modal>
  );
}