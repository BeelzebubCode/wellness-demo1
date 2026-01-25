"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { EmptyState } from "@/components/shared/EmptyState";
import { useNotification } from "@/components/notification/useNotification";
import {
  Building2,
  Eye,
  Globe,
  Plus,
  Search,
  Trash2,
  FileText,
  Power,
} from "lucide-react";

import type { AiKbDoc } from "@/features/ai-kb/types";
import { useAiKbDocuments } from "@/features/ai-kb/hooks/useAiKbDocuments";
import { useAiKbMutations } from "@/features/ai-kb/hooks/useAiKbMutations";

import AiKbUploadModal from "./AiKbUploadModal";
import AiKbDeleteModal from "./AikbDeleteModal";
import { cn } from "@/lib/cn";

type ScopeFilter = "ALL" | "GLOBAL" | "TENANT";
type ActiveFilter = "ALL" | "ACTIVE" | "INACTIVE";

function uniLabel(d: AiKbDoc) {
  const anyDoc = d as any;
  if (d.universityId == null) return "Global";
  if (anyDoc.universityCode || anyDoc.universityName) {
    const code = anyDoc.universityCode
      ? String(anyDoc.universityCode)
      : `#${d.universityId}`;
    const name = anyDoc.universityName ? String(anyDoc.universityName) : "";
    return name ? `${code} - ${name}` : code;
  }
  return `Uni #${d.universityId}`;
}

export default function AiKbManagerPage() {
  const router = useRouter();
  const notify = useNotification();

  const [q, setQ] = useState("");
  const [scope, setScope] = useState<ScopeFilter>("ALL");
  const [active, setActive] = useState<ActiveFilter>("ALL");
  const [universityId, setUniversityId] = useState<string>("ALL");

  const [openUpload, setOpenUpload] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [deleteDoc, setDeleteDoc] = useState<AiKbDoc | null>(null);

  const [busyToggleId, setBusyToggleId] = useState<number | null>(null);

  const uniParsed = useMemo(() => {
    if (universityId === "ALL") return undefined;
    const n = Number(universityId);
    return Number.isFinite(n) ? n : undefined;
  }, [universityId]);

  const { docs, total, isLoading, error, refetch } = useAiKbDocuments({
    q,
    scope,
    active,
    universityId: uniParsed,
  });

  const mut = useAiKbMutations({
    onMutated: async () => {
      await refetch();
    },
  });

  const universityOptions = useMemo(() => {
    const map = new Map<number, string>();
    for (const d of docs) {
      if (d.universityId == null) continue;
      map.set(d.universityId, uniLabel(d));
    }
    const items = Array.from(map.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([id, label]) => ({ value: String(id), label }));
    return [{ value: "ALL", label: "ทุกมหาวิทยาลัย" }, ...items];
  }, [docs]);

  function openDeleteDoc(d: AiKbDoc) {
    setDeleteDoc(d);
    setOpenDelete(true);
  }

  async function toggleActive(d: AiKbDoc) {
    try {
      setBusyToggleId(d.id);
      await mut.toggleActive(d.id);
      notify.success(`อัปเดตสถานะ: ${d.key}`);
    } catch (e: any) {
      notify.error(e?.message ?? "ไม่สำเร็จ");
    } finally {
      setBusyToggleId(null);
    }
  }

  async function deleteSelected() {
    if (!deleteDoc) return;
    try {
      await mut.deleteDocument(deleteDoc.id);
      notify.success(`ลบเอกสารแล้ว`);
      setOpenDelete(false);
      setDeleteDoc(null);
    } catch (e: any) {
      notify.error(e?.message ?? "ลบเอกสารไม่สำเร็จ");
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl p-4 sm:p-6 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Knowledge Base</h1>
          <p className="text-sm text-slate-500">
            จัดการเอกสาร Reference สำหรับ AI Assistant
          </p>
        </div>
        <Button onClick={() => setOpenUpload(true)} className="gap-2 shadow-sm">
          <Plus className="h-4 w-4" />
          เพิ่มเอกสารใหม่
        </Button>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="ค้นหาด้วย Key, Title..."
              leftIcon={<Search className="h-4 w-4 text-slate-400" />}
              className="bg-slate-50 border-slate-200 focus:bg-white transition-colors"
            />
          </div>
          <div className="lg:col-span-2">
            <Select
              value={scope}
              onValueChange={(v) => setScope(v as any)}
              options={[
                { value: "ALL", label: "Scope ทั้งหมด" },
                { value: "GLOBAL", label: "Global Only" },
                { value: "TENANT", label: "Tenant Only" },
              ]}
            />
          </div>
          <div className="lg:col-span-2">
            <Select
              value={active}
              onValueChange={(v) => setActive(v as any)}
              options={[
                { value: "ALL", label: "สถานะทั้งหมด" },
                { value: "ACTIVE", label: "Active" },
                { value: "INACTIVE", label: "Inactive" },
              ]}
            />
          </div>
          <div className="lg:col-span-3">
            <Select
              value={universityId}
              onValueChange={(v) => setUniversityId(v)}
              options={universityOptions}
            />
          </div>
        </div>
      </div>

      {/* List Content */}
      <Card className="overflow-hidden border-slate-200 shadow-sm">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600" />
          </div>
        ) : error ? (
          <div className="p-8 text-center text-sm text-rose-600 bg-rose-50">
            เกิดข้อผิดพลาด: {String(error)}
          </div>
        ) : docs.length === 0 ? (
          <div className="py-12">
            <EmptyState
              icon={<FileText className="h-12 w-12 text-slate-300" />}
              title="ไม่พบเอกสาร"
              description="ลองปรับตัวเลือกการค้นหา หรือเพิ่มเอกสารใหม่"
            />
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            <div className="bg-slate-50 px-6 py-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
              เอกสารทั้งหมด ({total ?? docs.length})
            </div>

            {docs.map((d) => {
              const isToggling =
                mut.loading.toggleActive && busyToggleId === d.id;

              return (
                <div
                  key={d.id}
                  className="group flex flex-col gap-4 p-4 transition-colors hover:bg-slate-50/50 sm:flex-row sm:items-center sm:justify-between sm:px-6"
                >
                  <div className="flex min-w-0 flex-1 gap-4">
                    <div
                      className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border transition-colors",
                        d.isActive
                          ? "bg-white border-slate-200 text-indigo-600"
                          : "bg-slate-100 border-transparent text-slate-400",
                      )}
                    >
                      <FileText className="h-5 w-5" />
                    </div>

                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="truncate font-medium text-slate-900 group-hover:text-indigo-600 transition-colors">
                          {d.title}
                        </h3>
                        {!d.isActive && (
                          <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500 border border-slate-200">
                            Inactive
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                        <span className="font-mono text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                          {d.key}
                        </span>
                        {d.category && (
                          <>
                            <span className="text-slate-300">•</span>
                            <span>{d.category}</span>
                          </>
                        )}
                        <span className="text-slate-300">•</span>
                        <div className="flex items-center gap-1" title="Scope">
                          {d.universityId == null ? (
                            <Globe className="h-3 w-3 text-slate-400" />
                          ) : (
                            <Building2 className="h-3 w-3 text-slate-400" />
                          )}
                          <span className="truncate max-w-[150px]">
                            {uniLabel(d)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Side: Actions (MANUAL STYLING - ไม่ใช้ size="icon") */}
                  <div className="flex shrink-0 items-center gap-2 sm:self-center w-auto justify-end">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-slate-600 hover:text-indigo-600 hover:bg-indigo-50"
                      onClick={() => router.push(`/super-admin/ai-kb/${d.id}`)}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      รายละเอียด
                    </Button>

                    <div className="h-4 w-px bg-slate-200 hidden sm:block" />

                    <Button
                      variant="ghost"
                      className={cn(
                        "h-9 w-9 p-0 shrink-0",
                        d.isActive
                          ? "text-emerald-600 hover:text-rose-600 hover:bg-rose-50"
                          : "text-slate-400 hover:text-emerald-600 hover:bg-emerald-50",
                      )}
                      onClick={() => toggleActive(d)}
                      disabled={isToggling}
                      title={d.isActive ? "ปิดใช้งาน" : "เปิดใช้งาน"}
                    >
                      {isToggling ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      ) : (
                        <Power className="h-4 w-4" />
                      )}
                    </Button>

                    <Button
                      variant="ghost"
                      className="h-9 w-9 p-0 shrink-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                      onClick={() => openDeleteDoc(d)}
                      disabled={mut.loading.deleteDocument}
                      title="ลบเอกสาร"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <AiKbUploadModal
        open={openUpload}
        onOpenChange={setOpenUpload}
        isUploading={mut.loading.uploadDocument}
        onUpload={async (input) => {
          try {
            await mut.uploadDocument(input);
            notify.success("เพิ่มเอกสารสำเร็จ");
            setOpenUpload(false);
          } catch (e: any) {
            notify.error(e?.message);
          }
        }}
      />

      <AiKbDeleteModal
        open={openDelete}
        onOpenChange={(v) => {
          setOpenDelete(v);
          if (!v) setDeleteDoc(null);
        }}
        doc={deleteDoc}
        onConfirm={deleteSelected}
        isDeleting={mut.loading.deleteDocument}
      />
    </div>
  );
}
