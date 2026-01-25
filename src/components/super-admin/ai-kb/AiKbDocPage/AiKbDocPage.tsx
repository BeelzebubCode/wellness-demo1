// components/super-admin/ai-kb/AiKbDocPage/AiKbDocPage.tsx
"use client";

import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { cn } from "@/lib/cn";
import { useNotification } from "@/components/notification/useNotification";
import {
  AlertCircle,
  ArrowLeft,
  ChevronRight,
  Clock,
  Code2,
  FileJson,
  FileText,
  Globe,
  UploadCloud,
  X,
} from "lucide-react";

import { AiKbUploadVersionModal } from "./AiKbUploadVersionModal";
import { useAiKbDocPage } from "@/features/ai-kb/hooks/useAiKbDocPage";

function scopeLabel(universityId: number | null | undefined) {
  return universityId == null ? "Global" : "Tenant";
}

type VersionFilter = "ALL" | "PUBLISHED" | "DRAFT";

export default function AiKbDocPage({ docId }: { docId: number }) {
  const router = useRouter();
  const notify = useNotification();

  const page = useAiKbDocPage(docId);
  const {
    doc,
    loading,

    // version ui
    selectedVersionId,
    setSelectedVersionId,
    tab,
    setTab,
    vFilter,
    setVFilter,

    // create
    openCreate,
    setOpenCreate,
    createType,
    setCreateType,
    createMd,
    setCreateMd,
    createJsonText,
    setCreateJsonText,

    // upload
    openUpload,
    setOpenUpload,

    // derived
    filtered,
    selected,

    // actions
    load,
    showInactiveAlert,
    uploadVersion,
    mut,
  } = page;

  async function publish(versionId: number) {
    if (!doc) return;
    if (!doc.isActive) {
      showInactiveAlert("publish ");
      return;
    }
    try {
      await mut.publishVersion(versionId);
      notify.success("Publish เวอร์ชันนี้สำเร็จแล้ว");
    } catch (e: any) {
      notify.error(e?.message ?? "Publish ไม่สำเร็จ");
    }
  }

  async function createVersion() {
    if (!doc) return;
    if (!doc.isActive) {
      showInactiveAlert("สร้างเวอร์ชัน ");
      return;
    }

    try {
      if (createType === "MARKDOWN") {
        const md = createMd.trim();
        if (!md) {
          notify.error("กรุณาระบุเนื้อหา MARKDOWN");
          return;
        }
        await mut.createVersion(doc.id, { contentType: "MARKDOWN", markdown: md });
        setCreateMd("");
      } else {
        let parsed: any = null;
        try {
          parsed = JSON.parse(createJsonText);
        } catch {
          notify.error("JSON Format ไม่ถูกต้อง");
          return;
        }
        await mut.createVersion(doc.id, { contentType: "JSON", json: parsed });
      }

      setOpenCreate(false);
      notify.success("สร้างเวอร์ชันใหม่สำเร็จแล้ว");
    } catch (e: any) {
      const msg = String(e?.message ?? "");
      if (msg.includes("DOC_INACTIVE") || msg.includes("409")) {
        showInactiveAlert("สร้างเวอร์ชัน ");
        return;
      }
      notify.error(e?.message ?? "สร้างเวอร์ชันไม่สำเร็จ");
    }
  }

  if (loading) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center text-slate-400">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600" />
          <span className="text-sm">กำลังโหลดข้อมูล...</span>
        </div>
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-4 text-center">
        <div className="rounded-full bg-rose-50 p-4">
          <AlertCircle className="h-8 w-8 text-rose-500" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-900">ไม่พบเอกสาร</h3>
          <p className="text-sm text-slate-500">
            เอกสารนี้อาจถูกลบหรือไม่มีอยู่ในระบบ
          </p>
        </div>
        <Button variant="secondary" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          กลับหน้ารายการ
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 pb-20 sm:p-6">
      {/* --- Breadcrumb / Back --- */}
      <div>
        <button
          onClick={() => router.back()}
          className="group flex items-center text-sm font-medium text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="mr-1 h-4 w-4 transition-transform group-hover:-translate-x-1" />
          กลับไปหน้าจัดการ
        </button>
      </div>

      {/* --- Header Section --- */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-start">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge
              variant={doc.isActive ? "success" : "secondary"}
              className="px-2 py-0.5 text-xs"
            >
              {doc.isActive ? "ACTIVE" : "INACTIVE"}
            </Badge>
            <span className="text-xs text-slate-400">ID: {doc.id}</span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {doc.title || "(ไม่มีชื่อเอกสาร)"}
          </h1>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-600">
            <div className="flex items-center gap-1.5 rounded-md bg-slate-50 px-2 py-1">
              <Globe className="h-3.5 w-3.5 text-slate-400" />
              <span className="font-medium text-slate-700">
                {scopeLabel(doc.universityId)}
              </span>
            </div>

            <div className="flex items-center gap-1.5 font-mono text-xs text-slate-500">
              <span className="font-sans text-slate-400">Key:</span>
              <span className="rounded bg-slate-100 px-1 py-0.5 font-semibold text-slate-700">
                {doc.key || "-"}
              </span>
            </div>

            {doc.category && (
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">Category:</span>
                <span className="font-medium text-slate-700">{doc.category}</span>
              </div>
            )}
          </div>

          {doc.urlHint && (
            <div className="text-xs text-slate-400">
              URL Hint:{" "}
              <span className="font-mono text-slate-600">{doc.urlHint}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-end gap-2 sm:max-w-xs">
          <Button
            size="sm"
            variant={doc.isActive ? "outline" : "primary"}
            className={cn(doc.isActive ? "border-slate-300 text-slate-700" : "")}
            disabled={mut.loading.toggleActive}
            onClick={async () => {
              try {
                const wasActive = doc.isActive;
                await mut.toggleActive(doc.id);
                if (wasActive) setOpenCreate(false);

                notify.success(
                  `${wasActive ? "ปิดใช้งาน" : "เปิดใช้งาน"}เอกสารแล้ว: ${doc.key}`
                );
              } catch (e: any) {
                notify.error(e?.message ?? "อัปเดตสถานะไม่สำเร็จ");
              }
            }}
          >
            {doc.isActive ? "Deactivate" : "Activate"}
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="gap-2 border-slate-300 text-slate-700"
            disabled={mut.loading.uploadVersion}
            onClick={() => {
              if (!doc.isActive) {
                showInactiveAlert("อัปโหลดเวอร์ชัน ");
                return;
              }
              setOpenUpload(true);
            }}
          >
            <UploadCloud className="h-4 w-4" />
            Upload
          </Button>

          <Button
            size="sm"
            variant="primary"
            className="gap-2 shadow-sm"
            onClick={() => {
              if (!doc.isActive) {
                showInactiveAlert("สร้างเวอร์ชัน ");
                return;
              }
              setOpenCreate((v) => !v);
            }}
          >
            {openCreate ? <X className="h-4 w-4" /> : <Code2 className="h-4 w-4" />}
            {openCreate ? "ปิด Editor" : "เขียนใหม่"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* --- Left Sidebar: Versions --- */}
        <div className="flex flex-col gap-4 lg:col-span-4">
          <Card className="flex flex-col overflow-hidden border-slate-200 shadow-sm">
            <div className="border-b border-slate-100 bg-slate-50/50 p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-900">Version History</h3>
                <button
                  onClick={load}
                  className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-indigo-600 transition-colors"
                  title="Refresh"
                >
                  <Clock className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-3">
                <Select
                  value={vFilter}
                  onValueChange={(v) => setVFilter(v as VersionFilter)}
                  options={[
                    { value: "ALL", label: "ทั้งหมด (All)" },
                    { value: "PUBLISHED", label: "เฉพาะ Published" },
                    { value: "DRAFT", label: "เฉพาะ Draft" },
                  ]}
                />
              </div>
            </div>

            <div className="max-h-[600px] overflow-y-auto p-2">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center text-sm text-slate-500">
                  <div className="mb-2 rounded-full bg-slate-100 p-3">
                    <Clock className="h-5 w-5 text-slate-400" />
                  </div>
                  ไม่พบเวอร์ชันใน Filter นี้
                </div>
              ) : (
                <div className="space-y-1">
                  {filtered.map((v) => {
                    const isActive = v.id === (selected?.id ?? null);
                    const isPublished = v.status === "PUBLISHED";

                    return (
                      <button
                        key={v.id}
                        onClick={() => setSelectedVersionId(v.id)}
                        className={cn(
                          "group relative w-full rounded-lg border p-3 text-left transition-all",
                          isActive
                            ? "border-indigo-600 bg-indigo-50/50 shadow-sm ring-1 ring-indigo-600"
                            : "border-transparent bg-white hover:bg-slate-50 hover:border-slate-200"
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span
                                className={cn(
                                  "flex h-5 items-center rounded px-1.5 text-[10px] font-bold uppercase tracking-wide",
                                  isPublished
                                    ? "bg-emerald-100 text-emerald-700"
                                    : "bg-slate-100 text-slate-600"
                                )}
                              >
                                v{v.versionNo}
                              </span>
                              {v.contentType === "JSON" ? (
                                <FileJson className="h-3.5 w-3.5 text-amber-500" />
                              ) : (
                                <FileText className="h-3.5 w-3.5 text-blue-500" />
                              )}
                            </div>

                            <div className="mt-1.5 flex items-center gap-2 text-xs text-slate-500">
                              <span>{isPublished ? "Published" : "Draft"}</span>
                              <span className="text-slate-300">•</span>
                              <span>
                                {new Date(v.updatedAt).toLocaleDateString("th-TH")}
                              </span>
                            </div>
                          </div>

                          {isActive && <ChevronRight className="h-4 w-4 text-indigo-500" />}
                        </div>

                        {isActive && !isPublished && (
                          <div className="mt-3 flex justify-end pt-2 border-t border-indigo-100">
                            <Button
                              size="sm"
                              variant="secondary"
                              className="h-7 text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                publish(v.id);
                              }}
                            >
                              Publish This
                            </Button>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* --- Right Content: Editor & Preview --- */}
        <div className="space-y-6 lg:col-span-8">
          {/* Create / Edit Panel */}
          {openCreate && (
            <div className="animate-in fade-in slide-in-from-top-4 duration-300">
              <Card className="border-indigo-100 shadow-md ring-1 ring-indigo-50">
                <div className="border-b border-indigo-50 bg-indigo-50/30 px-4 py-3">
                  <div className="flex items-center justify-between">
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-indigo-900">
                      <Code2 className="h-4 w-4" />
                      สร้างเวอร์ชันใหม่
                    </h3>
                    <div className="w-32">
                      <Select
                        value={createType}
                        onValueChange={(v) => setCreateType(v as any)}
                        options={[
                          { value: "MARKDOWN", label: "Markdown" },
                          { value: "JSON", label: "JSON" },
                        ]}
                      />
                    </div>
                  </div>
                </div>

                <div className="p-4">
                  {createType === "MARKDOWN" ? (
                    <textarea
                      className="min-h-[200px] w-full resize-y rounded-lg border border-slate-200 bg-white p-4 text-sm leading-relaxed text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      value={createMd}
                      onChange={(e) => setCreateMd(e.target.value)}
                      placeholder="# หัวข้อเอกสาร&#10;&#10;เขียนเนื้อหาที่นี่..."
                    />
                  ) : (
                    <textarea
                      className="min-h-[200px] w-full resize-y rounded-lg border border-slate-200 bg-slate-900 p-4 font-mono text-xs leading-relaxed text-slate-50 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      value={createJsonText}
                      onChange={(e) => setCreateJsonText(e.target.value)}
                      placeholder='{&#10;  "key": "value"&#10;}'
                    />
                  )}

                  <div className="mt-4 flex justify-end gap-3 border-t border-slate-50 pt-3">
                    <Button variant="ghost" onClick={() => setOpenCreate(false)}>
                      ยกเลิก
                    </Button>
                    <Button onClick={createVersion} disabled={mut.loading.createVersion}>
                      บันทึกเวอร์ชัน
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Viewer / Preview */}
          <Card className="flex min-h-[400px] flex-col overflow-hidden border-slate-200 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 bg-white px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                  {selected?.contentType === "JSON" ? (
                    <FileJson className="h-4 w-4" />
                  ) : (
                    <FileText className="h-4 w-4" />
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    {selected ? `Version ${selected.versionNo}` : "ยังไม่ได้เลือกเวอร์ชัน"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {selected
                      ? `Updated ${new Date(selected.updatedAt).toLocaleTimeString()}`
                      : "เลือกจากรายการด้านซ้าย"}
                  </p>
                </div>
              </div>

              {selected && (
                <div className="flex items-center rounded-lg bg-slate-100 p-1">
                  <button
                    className={cn(
                      "rounded-md px-3 py-1 text-xs font-medium transition-all",
                      tab === "PREVIEW"
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
                    )}
                    onClick={() => setTab("PREVIEW")}
                  >
                    Preview
                  </button>
                  <button
                    className={cn(
                      "rounded-md px-3 py-1 text-xs font-medium transition-all",
                      tab === "RAW"
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
                    )}
                    onClick={() => setTab("RAW")}
                  >
                    Source Code
                  </button>
                </div>
              )}
            </div>

            <div className="flex-1 bg-slate-50/50 p-0">
              {!selected ? (
                <div className="flex h-full flex-col items-center justify-center text-slate-400">
                  <div className="mb-2 rounded-full bg-slate-100 p-4">
                    <FileText className="h-8 w-8 text-slate-300" />
                  </div>
                  <p className="text-sm">เลือกเวอร์ชันเพื่อดูรายละเอียด</p>
                </div>
              ) : (
                <div className="relative h-full">
                  {tab === "PREVIEW" ? (
                    selected.contentType === "MARKDOWN" ? (
                      <div className="prose prose-sm max-w-none p-6 text-slate-700">
                        <div className="whitespace-pre-wrap">{selected.sourceMd || ""}</div>
                      </div>
                    ) : (
                      <div className="p-0">
                        <pre className="max-h-[600px] overflow-auto bg-[#1e1e1e] p-4 font-mono text-xs leading-loose text-[#d4d4d4]">
                          {JSON.stringify(selected.sourceJson ?? {}, null, 2)}
                        </pre>
                      </div>
                    )
                  ) : (
                    <div className="h-full w-full">
                      <textarea
                        readOnly
                        className="h-full min-h-[400px] w-full resize-none border-0 bg-slate-900 p-4 font-mono text-xs leading-loose text-slate-50 focus:ring-0"
                        value={
                          selected.contentType === "MARKDOWN"
                            ? selected.sourceMd || ""
                            : JSON.stringify(selected.sourceJson ?? {}, null, 2)
                        }
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      <AiKbUploadVersionModal
        open={openUpload}
        onOpenChange={setOpenUpload}
        isUploading={mut.loading.uploadVersion}
        onUpload={async ({ file, contentType }) => {
          try {
            await uploadVersion({ file, contentType });
            notify.success("อัปโหลดเวอร์ชันสำเร็จแล้ว");
          } catch (e: any) {
            notify.error(e?.message ?? "อัปโหลดเวอร์ชันไม่สำเร็จ");
          }
        }}
      />
    </div>
  );
}
