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

    selectedVersionId,
    setSelectedVersionId,
    tab,
    setTab,
    vFilter,
    setVFilter,

    openCreate,
    setOpenCreate,
    createType,
    setCreateType,
    createMd,
    setCreateMd,
    createJsonText,
    setCreateJsonText,

    openUpload,
    setOpenUpload,

    filtered,
    selected,

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
        await mut.createVersion(doc.id, {
          contentType: "MARKDOWN",
          markdown: md,
        });
        setCreateMd("");
      } else {
        let parsed: any;
        try {
          parsed = JSON.parse(createJsonText);
        } catch {
          notify.error("JSON Format ไม่ถูกต้อง");
          return;
        }
        await mut.createVersion(doc.id, {
          contentType: "JSON",
          json: parsed,
        });
        setCreateJsonText("");
      }

      setOpenCreate(false);
      notify.success("สร้างเวอร์ชันใหม่สำเร็จแล้ว");
    } catch (e: any) {
      notify.error(e?.message ?? "สร้างเวอร์ชันไม่สำเร็จ");
    }
  }

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center text-slate-400">
        <div className="h-7 w-7 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600" />
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-4">
        <AlertCircle className="h-8 w-8 text-rose-500" />
        <Button size="xs" variant="secondary" onClick={() => router.back()}>
          <ArrowLeft className="mr-1 h-3.5 w-3.5" />
          กลับหน้ารายการ
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 pb-20">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center text-xs text-slate-500 hover:text-slate-900"
      >
        <ArrowLeft className="mr-1 h-3.5 w-3.5" />
        กลับไปหน้าจัดการ
      </button>

      {/* Header */}
      <div className="flex flex-col gap-4 rounded-2xl border bg-white p-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge
              variant={doc.isActive ? "success" : "secondary"}
              className="px-2 py-0.5 text-[10px]"
            >
              {doc.isActive ? "ACTIVE" : "INACTIVE"}
            </Badge>
            <span className="text-[11px] text-slate-400">ID: {doc.id}</span>
          </div>

          <h1 className="text-xl font-semibold text-slate-900">
            {doc.title || "(ไม่มีชื่อเอกสาร)"}
          </h1>

          <div className="flex flex-wrap gap-3 text-xs text-slate-600">
            <span className="flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5">
              <Globe className="h-3 w-3" />
              {scopeLabel(doc.universityId)}
            </span>
            <span className="font-mono text-[11px]">{doc.key}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="xs"
            variant="outline"
            className="h-8 px-3 text-xs"
            onClick={() => mut.toggleActive(doc.id)}
          >
            {doc.isActive ? "Deactivate" : "Activate"}
          </Button>

          <Button
            size="xs"
            variant="outline"
            className="h-8 px-3 text-xs gap-1"
            onClick={() => setOpenUpload(true)}
          >
            <UploadCloud className="h-3.5 w-3.5" />
            Upload
          </Button>

          <Button
            size="xs"
            variant="primary"
            className="h-8 px-3 text-xs gap-1"
            onClick={() => setOpenCreate((v) => !v)}
          >
            {openCreate ? <X className="h-3.5 w-3.5" /> : <Code2 className="h-3.5 w-3.5" />}
            {openCreate ? "ปิด Editor" : "เขียนใหม่"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Version History */}
        <div className="lg:col-span-4">
          <Card className="border shadow-sm">
            <div className="bg-slate-50 p-3 border border-slate-200 rounded-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Version History</h3>
                <button onClick={load}>
                  <Clock className="h-4 w-4 text-slate-400" />
                </button>
              </div>

              <div className="mt-2">
                <Select
                  value={vFilter}
                  onValueChange={(v) => setVFilter(v as VersionFilter)}
                  options={[
                    { value: "ALL", label: "ทั้งหมด" },
                    { value: "PUBLISHED", label: "Published" },
                    { value: "DRAFT", label: "Draft" },
                  ]}
                />
              </div>
            </div>

            <div className="p-2 space-y-1 max-h-[520px] overflow-y-auto">
              {filtered.map((v) => {
                const isActive = v.id === selected?.id;
                const isPublished = v.status === "PUBLISHED";

                return (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVersionId(v.id)}
                    className={cn(
                      "relative w-full rounded-xl border px-4 py-3 text-left transition-all",
                      isActive
                        ? "border-indigo-500 bg-indigo-50"
                        : "border-transparent bg-white hover:border-slate-200 hover:bg-slate-50"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "inline-flex h-5 items-center rounded-md px-2 text-[10px] font-bold",
                            isPublished
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-slate-200 text-slate-600"
                          )}
                        >
                          v{v.versionNo}
                        </span>

                        {v.contentType === "JSON" ? (
                          <FileJson className="h-4 w-4 text-amber-500" />
                        ) : (
                          <FileText className="h-4 w-4 text-blue-500" />
                        )}
                      </div>

                      {isActive && (
                        <ChevronRight className="h-4 w-4 text-indigo-500" />
                      )}
                    </div>

                    {isActive && !isPublished && (
                      <div className="mt-3 border-t pt-2 flex justify-end">
                      <Button
                        size="xs"
                        variant="secondary"
                        className="h-6 rounded-full px-3 text-[10px]"
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
          </Card>
        </div>

        {/* Right Side */}
        <div className="lg:col-span-8 space-y-6">
          {/* ✅ Create Editor */}
          {openCreate && (
            <Card className="border-indigo-100 shadow">
            <div className="bg-indigo-50 px-3 py-2 flex justify-between items-center border-b rounded-t-xl">
              <h3 className="text-xs font-medium flex items-center gap-1.5">
                <Code2 className="h-3.5 w-3.5" />
                สร้างเวอร์ชันใหม่
              </h3>

              <div className="w-28 text-xs">
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

              <div className="p-4">
                {createType === "MARKDOWN" ? (
                  <textarea
                    className="w-full min-h-[200px] border rounded p-3 text-sm"
                    value={createMd}
                    onChange={(e) => setCreateMd(e.target.value)}
                  />
                ) : (
                  <textarea
                    className="w-full min-h-[200px] border rounded p-3 font-mono text-xs bg-slate-900 text-slate-50"
                    value={createJsonText}
                    onChange={(e) => setCreateJsonText(e.target.value)}
                  />
                )}

                <div className="mt-4 flex justify-end gap-2">
                  <Button
                    size="xs"
                    variant="outline"
                    className="h-8 px-3 text-xs gap-1"
                    onClick={() => setOpenCreate(false)}>
                    ยกเลิก
                  </Button>

                  <Button                   
                  size="xs"
                  variant="outline"
                  className="h-8 px-3 text-xs gap-1" 
                  onClick={createVersion}>
                    บันทึกเวอร์ชัน
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Viewer */}
          <Card className="min-h-[400px] overflow-hidden border shadow-sm">
            <div className="border-b px-4 py-2 flex justify-between items-center">
              <h3 className="text-sm font-semibold">
                {selected ? `Version ${selected.versionNo}` : "เลือกเวอร์ชัน"}
              </h3>

              {selected && (
                <div className="flex rounded bg-slate-100 p-0.5">
                  {["PREVIEW", "RAW"].map((t) => (
                    <button
                      key={t}
                      onClick={() => setTab(t as any)}
                      className={cn(
                        "px-2 py-0.5 text-[11px] rounded",
                        tab === t && "bg-white shadow"
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 text-xs">
              {!selected ? (
                <div className="text-slate-400">เลือกเวอร์ชันจากด้านซ้าย</div>
              ) : tab === "RAW" ? (
                <pre className="bg-slate-900 p-4 text-slate-100 overflow-auto">
                  {JSON.stringify(
                    selected.contentType === "JSON"
                      ? selected.sourceJson
                      : selected.sourceMd,
                    null,
                    2
                  )}
                </pre>
              ) : (
                <pre className="whitespace-pre-wrap">
                  {selected.contentType === "JSON"
                    ? JSON.stringify(selected.sourceJson, null, 2)
                    : selected.sourceMd}
                </pre>
              )}
            </div>
          </Card>
        </div>
      </div>

      <AiKbUploadVersionModal
        open={openUpload}
        onOpenChange={setOpenUpload}
        isUploading={mut.loading.uploadVersion}
        onUpload={uploadVersion}
      />
    </div>
  );
}
