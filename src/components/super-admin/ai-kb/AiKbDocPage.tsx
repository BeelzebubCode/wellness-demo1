"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { cn } from "@/lib/cn";
import { useNotification } from "@/components/notification/useNotification";
import { aiKbApi } from "@/features/ai-kb/api";
import type { AiKbDoc, AiKbVersion } from "@/features/ai-kb/types";
import { useAiKbMutations } from "@/features/ai-kb/hooks/useAiKbMutations";

function scopeLabel(universityId: number | null | undefined) {
  return universityId == null ? "Global" : "Tenant";
}

export default function AiKbDocPage({ docId }: { docId: number }) {
  const router = useRouter();
  const notify = useNotification();

  const [doc, setDoc] = useState<AiKbDoc | null>(null);
  const [versions, setVersions] = useState<AiKbVersion[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedVersionId, setSelectedVersionId] = useState<number | null>(null);

  const [createType, setCreateType] = useState<"MARKDOWN" | "JSON">("MARKDOWN");
  const [createMd, setCreateMd] = useState("");

  const mut = useAiKbMutations({
    onMutated: async () => {
      await load();
    },
  });

  const sorted = useMemo(
    () => [...versions].sort((a, b) => b.versionNo - a.versionNo),
    [versions],
  );

  const selected = useMemo(() => {
    if (!selectedVersionId) return sorted[0] ?? null;
    return sorted.find((v) => v.id === selectedVersionId) ?? sorted[0] ?? null;
  }, [sorted, selectedVersionId]);

  async function load() {
    setLoading(true);
    try {
      // ✅ แนะนำให้มี endpoint getDocument(id) ถ้ายังไม่มี ให้เพิ่ม (ดูข้อ 3)
      const d = await aiKbApi.getDocument(docId);
      setDoc(d.doc);

      const v = await aiKbApi.listVersions(docId);
      const list = v.versions ?? [];
      setVersions(list);
      setSelectedVersionId((prev) => prev ?? (list[0]?.id ?? null));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docId]);

  async function createVersion() {
    if (!doc) return;
    try {
      await mut.createVersion(doc.id, {
        contentType: createType,
        markdown: createType === "MARKDOWN" ? createMd : undefined,
        json: createType === "JSON" ? {} : undefined,
      });
      setCreateMd("");
      notify.success("สร้างเวอร์ชันใหม่แล้ว");
    } catch (e: any) {
      notify.error(e?.message ?? "สร้างเวอร์ชันไม่สำเร็จ");
    }
  }

  async function publish(versionId: number) {
    try {
      await mut.publishVersion(versionId);
      notify.success("Publish แล้ว");
    } catch (e: any) {
      notify.error(e?.message ?? "Publish ไม่สำเร็จ");
    }
  }

  if (loading) {
    return <div className="p-6 text-sm text-slate-600">กำลังโหลด...</div>;
  }

  if (!doc) {
    return (
      <div className="p-6">
        <div className="text-sm text-rose-600">ไม่พบเอกสารนี้</div>
        <Button className="mt-3" variant="secondary" onClick={() => router.back()}>
          กลับ
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl p-4 space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="text-xs text-slate-500">AI KB Document</div>
          <h1 className="truncate text-xl font-semibold text-slate-900">
            {doc.title}
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <Badge variant={doc.isActive ? "success" : "secondary"}>
              {doc.isActive ? "ACTIVE" : "INACTIVE"}
            </Badge>
            {doc.category ? <Badge variant="outline">{doc.category}</Badge> : null}
            <Badge variant="outline">{scopeLabel(doc.universityId)}</Badge>
            <Badge variant="outline" className="font-mono">
              key: {doc.key}
            </Badge>
            {doc.urlHint ? (
              <Badge variant="outline" className="font-mono">
                url: {doc.urlHint}
              </Badge>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" onClick={() => router.back()}>
            กลับ
          </Button>
          <Button
            variant={doc.isActive ? "secondary" : "primary"}
            onClick={async () => {
              try {
                await mut.toggleActive(doc.id);
                notify.success(`อัปเดตสถานะเอกสาร: ${doc.key}`);
              } catch (e: any) {
                notify.error(e?.message ?? "toggle active ไม่สำเร็จ");
              }
            }}
            disabled={mut.loading.toggleActive}
          >
            {doc.isActive ? "ปิดใช้งาน" : "เปิดใช้งาน"}
          </Button>
        </div>
      </div>

      {/* Layout 2 columns */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Left: Versions */}
        <Card className="lg:col-span-5 p-3">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-sm font-medium text-slate-900">Versions</div>
            <Button variant="ghost" onClick={load}>
              รีเฟรช
            </Button>
          </div>

          {sorted.length === 0 ? (
            <div className="text-sm text-slate-600">ยังไม่มีเวอร์ชัน</div>
          ) : (
            <div className="max-h-[70vh] space-y-2 overflow-auto pr-1">
              {sorted.map((v) => {
                const active = v.id === (selected?.id ?? null);
                return (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVersionId(v.id)}
                    className={cn(
                      "w-full rounded-xl border p-3 text-left",
                      active ? "border-slate-400 bg-slate-50" : "border-slate-200 hover:bg-slate-50",
                    )}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">v{v.versionNo}</Badge>
                      <Badge variant="outline">{v.contentType}</Badge>
                      <Badge variant={v.status === "PUBLISHED" ? "success" : "secondary"}>
                        {v.status}
                      </Badge>
                      <Badge variant="outline">INDEX: {v.indexStatus}</Badge>
                      <div className="ml-auto">
                        <Button
                          variant="secondary"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            publish(v.id);
                          }}
                          disabled={v.status === "PUBLISHED"}
                        >
                          Publish
                        </Button>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </Card>

        {/* Right: Create + Preview */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="p-3">
            <div className="mb-2 text-sm font-medium text-slate-900">สร้างเวอร์ชันใหม่</div>

            <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
              <div className="md:col-span-1">
                <Select
                  value={createType}
                  onValueChange={(v) => setCreateType(v as any)}
                  options={[
                    { value: "MARKDOWN", label: "MARKDOWN" },
                    { value: "JSON", label: "JSON" },
                  ]}
                />
              </div>

              <div className="md:col-span-2">
                {createType === "MARKDOWN" ? (
                  <textarea
                    className={cn(
                      "min-h-[200px] w-full rounded-xl border border-slate-200 bg-white p-3 text-sm",
                      "focus:outline-none focus:ring-2 focus:ring-slate-200",
                    )}
                    value={createMd}
                    onChange={(e) => setCreateMd(e.target.value)}
                    placeholder="เขียน markdown สำหรับเวอร์ชันใหม่"
                  />
                ) : (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                    JSON editor ยังไม่ได้ทำ (จะส่ง {} ไปก่อน)
                  </div>
                )}
              </div>
            </div>

            <div className="mt-2 flex justify-end">
              <Button onClick={createVersion} disabled={mut.loading.createVersion}>
                สร้างเวอร์ชัน
              </Button>
            </div>
          </Card>

          <Card className="p-3">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-sm font-medium text-slate-900">Preview</div>
              {doc.publishedVersionId ? (
                <Badge variant="outline">PUBLISHED: #{doc.publishedVersionId}</Badge>
              ) : (
                <Badge variant="secondary">ยังไม่ publish</Badge>
              )}
            </div>

            {!selected ? (
              <div className="text-sm text-slate-600">เลือกเวอร์ชันเพื่อดู</div>
            ) : selected.contentType === "MARKDOWN" ? (
              <pre className="max-h-[55vh] overflow-auto whitespace-pre-wrap rounded-xl bg-slate-50 p-3 text-xs text-slate-700">
                {selected.sourceMd || ""}
              </pre>
            ) : (
              <pre className="max-h-[55vh] overflow-auto whitespace-pre-wrap rounded-xl bg-slate-50 p-3 text-xs text-slate-700">
                {JSON.stringify(selected.sourceJson ?? {}, null, 2)}
              </pre>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
