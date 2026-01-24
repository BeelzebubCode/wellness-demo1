"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { cn } from "@/lib/cn";

type CreateInput = {
  universityId: number | null;
  key: string;
  title: string;
  category?: string | null;
  urlHint?: string | null;
  contentType: "MARKDOWN" | "JSON";
  markdown?: string;
  json?: any;
};

export default function AiKbCreateModal(props: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreate: (input: CreateInput) => Promise<void> | void;
}) {
  const { open, onOpenChange, onCreate } = props;

  const [form, setForm] = useState({
    universityId: "GLOBAL", // GLOBAL | number string
    key: "",
    title: "",
    category: "",
    urlHint: "",
    contentType: "MARKDOWN" as "MARKDOWN" | "JSON",
    markdown: "",
  });

  async function submit() {
    const uniId = form.universityId === "GLOBAL" ? null : Number(form.universityId);

    await onCreate({
      universityId: uniId,
      key: form.key.trim(),
      title: form.title.trim(),
      category: form.category.trim() || null,
      urlHint: form.urlHint.trim() || null,
      contentType: form.contentType,
      markdown: form.contentType === "MARKDOWN" ? form.markdown : undefined,
      json: form.contentType === "JSON" ? {} : undefined,
    });

    // reset
    setForm({
      universityId: "GLOBAL",
      key: "",
      title: "",
      category: "",
      urlHint: "",
      contentType: "MARKDOWN",
      markdown: "",
    });
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="เพิ่มเอกสาร AI"
      description="สร้าง Document + Version (DRAFT)"
    >
      <div className="space-y-3">
        <Select
          value={form.universityId}
          onValueChange={(v) => setForm((p) => ({ ...p, universityId: v }))}
          options={[
            { value: "GLOBAL", label: "Scope: Global (ทุกมหาลัย)" },
            // ถ้าอยาก list มหาลัยจริง: ค่อยต่อ endpoint universities แล้วส่ง options เข้ามา
          ]}
        />

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Input
            value={form.key}
            onChange={(e) => setForm((p) => ({ ...p, key: e.target.value }))}
            placeholder="document_key เช่น booking-howto"
          />
          <Input
            value={form.category}
            onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
            placeholder="category (optional) เช่น HELP / POLICY"
          />
        </div>

        <Input
          value={form.title}
          onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
          placeholder="title เช่น วิธีจองคิวสำหรับนิสิต"
        />

        <Input
          value={form.urlHint}
          onChange={(e) => setForm((p) => ({ ...p, urlHint: e.target.value }))}
          placeholder="url_hint (optional) เช่น /help/booking"
        />

        <Select
          value={form.contentType}
          onValueChange={(v) => setForm((p) => ({ ...p, contentType: v as any }))}
          options={[
            { value: "MARKDOWN", label: "Content Type: Markdown" },
            { value: "JSON", label: "Content Type: JSON" },
          ]}
        />

        {form.contentType === "MARKDOWN" ? (
          <textarea
            className={cn(
              "min-h-[180px] w-full rounded-xl border border-slate-200 bg-white p-3 text-sm",
              "focus:outline-none focus:ring-2 focus:ring-slate-200",
            )}
            value={form.markdown}
            onChange={(e) => setForm((p) => ({ ...p, markdown: e.target.value }))}
            placeholder="เขียน markdown สำหรับ version แรก (DRAFT)"
          />
        ) : (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
            JSON editor ยังไม่ได้ทำ (จะส่ง {} ไปก่อน)
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            ยกเลิก
          </Button>
          <Button onClick={submit}>สร้างเอกสาร</Button>
        </div>
      </div>
    </Modal>
  );
}
