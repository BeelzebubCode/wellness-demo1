"use client";

import { useEffect, useMemo, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { cn } from "@/lib/cn";

import type { AiKbDoc, AiKbVersion } from "@/features/ai-kb/types";
import { aiKbApi } from "@/features/ai-kb/api";

function scopeLabel(universityId: number | null | undefined) {
  return universityId == null ? "Global" : "Tenant";
}

export default function AiKbViewModal(props: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  doc: AiKbDoc | null;

  onCreateVersion: (
    docId: number,
    input: { contentType: "MARKDOWN" | "JSON"; markdown?: string; json?: any },
  ) => Promise<void> | void;

  onPublish: (versionId: number) => Promise<void> | void;
}) {
  const { open, onOpenChange, doc, onCreateVersion, onPublish } = props;

  const [versions, setVersions] = useState<AiKbVersion[]>([]);
  const [loading, setLoading] = useState(false);

  const [createType, setCreateType] = useState<"MARKDOWN" | "JSON">("MARKDOWN");
  const [createMd, setCreateMd] = useState("");

  const sorted = useMemo(
    () => [...versions].sort((a, b) => b.versionNo - a.versionNo),
    [versions],
  );

  async function load() {
    if (!doc) return;
    setLoading(true);
    try {
      const data = await aiKbApi.listVersions(doc.id);
      setVersions(data.versions ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (open && doc) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, doc?.id]);

  async function createVersion() {
    if (!doc) return;
    await onCreateVersion(doc.id, {
      contentType: createType,
      markdown: createType === "MARKDOWN" ? createMd : undefined,
      json: createType === "JSON" ? {} : undefined,
    });
    setCreateMd("");
    await load();
  }

  async function publish(versionId: number) {
    await onPublish(versionId);
    await load();
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={doc ? `ดูเอกสาร: ${doc.key}` : "ดูเอกสาร"}
      description={doc ? scopeLabel(doc.universityId) : ""}
    >
      {!doc ? null : (
        <div className="space-y-3">
          <Card className="p-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={doc.isActive ? "success" : "secondary"}>
                {doc.isActive ? "ACTIVE" : "INACTIVE"}
              </Badge>
              {doc.category ? <Badge variant="outline">{doc.category}</Badge> : null}
              <Badge variant="outline">{scopeLabel(doc.universityId)}</Badge>
              {doc.publishedVersionId ? (
                <Badge variant="outline">PUBLISHED: #{doc.publishedVersionId}</Badge>
              ) : (
                <Badge variant="secondary">ยังไม่ publish</Badge>
              )}
            </div>

            <div className="mt-2 text-sm text-slate-700">
              <div>
                <span className="text-slate-500">Title:</span> {doc.title}
              </div>
              <div className="truncate">
                <span className="text-slate-500">URL Hint:</span>{" "}
                <span className="font-mono">{doc.urlHint ?? "-"}</span>
              </div>
            </div>
          </Card>

          {/* Create version */}
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
                      "min-h-[120px] w-full rounded-xl border border-slate-200 bg-white p-3 text-sm",
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
              <Button onClick={createVersion}>สร้างเวอร์ชัน</Button>
            </div>
          </Card>

          {/* Versions */}
          <Card className="p-3">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-sm font-medium text-slate-900">Versions</div>
              <Button variant="ghost" onClick={load} disabled={loading}>
                รีเฟรช
              </Button>
            </div>

            {loading ? (
              <div className="text-sm text-slate-600">กำลังโหลดเวอร์ชัน...</div>
            ) : sorted.length === 0 ? (
              <div className="text-sm text-slate-600">ยังไม่มีเวอร์ชัน</div>
            ) : (
              <div className="space-y-2">
                {sorted.map((v) => (
                  <div key={v.id} className="rounded-xl border border-slate-200 p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">v{v.versionNo}</Badge>
                      <Badge variant="outline">{v.contentType}</Badge>
                      <Badge variant={v.status === "PUBLISHED" ? "success" : "secondary"}>
                        {v.status}
                      </Badge>
                      <Badge variant="outline">INDEX: {v.indexStatus}</Badge>

                      <div className="ml-auto flex gap-2">
                        <Button
                          variant="secondary"
                          onClick={() => publish(v.id)}
                          disabled={v.status === "PUBLISHED"}
                        >
                          Publish
                        </Button>
                      </div>
                    </div>

                    {v.contentType === "MARKDOWN" ? (
                      <pre className="mt-2 max-h-[220px] overflow-auto whitespace-pre-wrap rounded-xl bg-slate-50 p-3 text-xs text-slate-700">
                        {v.sourceMd || ""}
                      </pre>
                    ) : (
                      <pre className="mt-2 max-h-[220px] overflow-auto whitespace-pre-wrap rounded-xl bg-slate-50 p-3 text-xs text-slate-700">
                        {JSON.stringify(v.sourceJson ?? {}, null, 2)}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}
    </Modal>
  );
}
