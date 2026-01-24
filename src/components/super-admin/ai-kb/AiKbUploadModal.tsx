"use client";

import { useMemo, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { useUniversities } from "@/features/ai-kb/hooks/useUniversities";

type UploadScope = "GLOBAL" | "TENANT";

export type AiKbUploadInput = {
  scope: UploadScope;
  universityId: number | null; // GLOBAL => null
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
  const [universityId, setUniversityId] = useState<string>(""); // value เป็น string id

  const [file, setFile] = useState<File | null>(null);

  const canSubmit = useMemo(() => {
    if (!file) return false;
    if (scope === "TENANT" && !universityId) return false;
    return true;
  }, [file, scope, universityId]);

  function reset() {
    setScope("GLOBAL");
    setUniversityId("");
    setFile(null);
  }

  async function submit() {
    if (!file) return;
    const uniId = scope === "GLOBAL" ? null : Number(universityId);
    await onUpload({ scope, universityId: uniId, file });
    reset();
  }

  return (
    <Modal
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
      title="อัปโหลดเอกสาร AI KB"
      description="เลือกไฟล์แล้วอัปโหลดได้เลย (ระบบจะใช้ชื่อไฟล์เป็นชื่อเอกสาร)"
      size="full"
    >
      <div className="space-y-3">
        <Card className="p-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
            <div className="md:col-span-4">
              <Select
                value={scope}
                onValueChange={(v) => setScope(v as any)}
                options={[
                  { value: "GLOBAL", label: "Scope: Global" },
                  { value: "TENANT", label: "Scope: Tenant" },
                ]}
              />
            </div>

            {scope === "TENANT" ? (
              <div className="md:col-span-8">
                <Select
                  value={universityId}
                  onValueChange={(v) => setUniversityId(v)}
                  options={[
                    {
                      value: "",
                      label: uniLoading
                        ? "กำลังโหลดรายชื่อมหาลัย..."
                        : "เลือกมหาลัย",
                    },
                    ...universities.map((u) => ({
                      value: String(u.id),
                      label: u.label,
                    })),
                  ]}
                />
              </div>
            ) : (
              <div className="md:col-span-8 text-sm text-slate-600 flex items-center">
                Global: ใช้ได้ทุกมหาลัย
              </div>
            )}
          </div>
        </Card>

        <Card className="p-3">
          <div className="text-sm font-medium text-slate-900">ไฟล์เอกสาร</div>
          <div className="mt-1 text-xs text-slate-500">
            รองรับ .md / .markdown / .txt / .json
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <input
              type="file"
              accept=".md,.markdown,.txt,.json"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />

            {file ? (
              <div className="text-sm text-slate-700">
                เลือกแล้ว: <span className="font-mono">{file.name}</span>
              </div>
            ) : null}
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isUploading}
            >
              ยกเลิก
            </Button>
            <Button onClick={submit} disabled={!canSubmit || isUploading}>
              {isUploading ? "กำลังอัปโหลด..." : "อัปโหลด"}
            </Button>
          </div>
        </Card>
      </div>
    </Modal>
  );
}
