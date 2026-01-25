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

/* ---------- helper ---------- */
function uniLabel(d: AiKbDoc) {
  if (d.universityId == null) return "Global";
  return `Uni #${d.universityId}`;
}

/* ---------- page ---------- */
export default function AiKbManagerPage() {
  const router = useRouter();
  const notify = useNotification();

  const [q, setQ] = useState("");
  const [scope, setScope] = useState("ALL");
  const [active, setActive] = useState("ALL");
  const [universityId, setUniversityId] = useState("ALL");

  const [openUpload, setOpenUpload] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [deleteDoc, setDeleteDoc] = useState<AiKbDoc | null>(null);
  const [busyToggleId, setBusyToggleId] = useState<number | null>(null);

  const uniParsed = universityId === "ALL" ? undefined : Number(universityId);

  const { docs, total, isLoading, error, refetch } = useAiKbDocuments({
    q,
    scope:
      scope === "ALL" || scope === "GLOBAL" || scope === "TENANT"
        ? scope
        : undefined,
    active:
      active === "ALL" || active === "ACTIVE" || active === "INACTIVE"
        ? active
        : undefined,
    universityId: uniParsed,
  });

  const mut = useAiKbMutations({
    onMutated: async () => refetch(),
  });

  const universityOptions = useMemo(() => {
    const map = new Map<number, string>();
    docs.forEach((d) => {
      if (d.universityId != null) map.set(d.universityId, uniLabel(d));
    });
    return [
      { value: "ALL", label: "ทุกมหาวิทยาลัย" },
      ...Array.from(map.entries()).map(([id, label]) => ({
        value: String(id),
        label,
      })),
    ];
  }, [docs]);

  async function toggleActive(d: AiKbDoc) {
    try {
      setBusyToggleId(d.id);
      await mut.toggleActive(d.id);
      notify.success("อัปเดตสถานะแล้ว");
    } finally {
      setBusyToggleId(null);
    }
  }

  /* ---------- UI ---------- */
  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">
            Knowledge Base
          </h1>
          <p className="text-sm text-slate-500">
            เอกสารอ้างอิงสำหรับ AI
          </p>
        </div>

        <Button
          size="sm"
          variant="outline"
          className="gap-2"
          onClick={() => setOpenUpload(true)}
        >
          <Plus className="h-4 w-4" />
          เพิ่มเอกสาร
        </Button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 gap-3 rounded-xl border bg-white p-4 md:grid-cols-4">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="ค้นหา..."
          leftIcon={<Search className="h-4 w-4 text-slate-400" />}
        />
        <Select
          value={scope}
          onValueChange={(v) => setScope(v as any)}
          className="h-9 px-3 text-sm"
          options={[
            { value: "ALL", label: "Scope ทั้งหมด" },
            { value: "GLOBAL", label: "Global Only" },
            { value: "TENANT", label: "Tenant Only" },
          ]}
        />

        <Select
          value={active}
          onValueChange={(v) => setActive(v as any)}
          className="h-9 px-3 text-sm"
          options={[
            { value: "ALL", label: "ทุกสถานะ" },
            { value: "ACTIVE", label: "Active" },
            { value: "INACTIVE", label: "Inactive" },
          ]}
        />

        <Select
          value={universityId}
          onValueChange={setUniversityId}
          className="h-9 px-3 text-sm"
          options={universityOptions}
        />

      </div>

      {/* List */}
      <Card className="overflow-hidden border">
        {isLoading ? (
          <div className="py-16 text-center text-sm text-slate-400">
            กำลังโหลด…
          </div>
        ) : error ? (
          <div className="py-12 text-center text-sm text-rose-500">
            เกิดข้อผิดพลาด
          </div>
        ) : docs.length === 0 ? (
          <EmptyState
            icon={<FileText className="h-10 w-10 text-slate-300" />}
            title="ไม่พบเอกสาร"
            description="ลองเพิ่มเอกสารใหม่"
          />
        ) : (
          <div className="divide-y">
            {docs.map((d) => {
              const busy =
                mut.loading.toggleActive && busyToggleId === d.id;

              return (
                <div
                  key={d.id}
                  className="flex items-center justify-between px-5 py-3 hover:bg-slate-50"
                >
                  {/* Left */}
                  <div className="flex min-w-0 items-center gap-3">
                    <FileText className="h-5 w-5 text-slate-400" />
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">
                        {d.title}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="font-mono">{d.key}</span>
                        <span>•</span>
                        {d.universityId == null ? (
                          <Globe className="h-3 w-3" />
                        ) : (
                          <Building2 className="h-3 w-3" />
                        )}
                        <span>{uniLabel(d)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    {/* View */}
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => router.push(`/super-admin/ai-kb/${d.id}`)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>

                    {/* Delete (ต้องอยู่กลาง) */}
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-rose-500"
                      onClick={() => {
                        setDeleteDoc(d);
                        setOpenDelete(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>

                    {/* Power (อยู่ท้ายสุด) */}
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => toggleActive(d)}
                      disabled={busy}
                      className={cn(
                        "rounded-full border transition-colors",
                        d.isActive
                          ? "border-emerald-300 bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                          : "border-slate-300 bg-white text-slate-500 hover:bg-slate-100"
                      )}
                    >
                      {busy ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      ) : (
                        <Power className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Modals */}
      <AiKbUploadModal
        open={openUpload}
        onOpenChange={setOpenUpload}
        isUploading={mut.loading.uploadDocument}
        onUpload={async (input) => {
          await mut.uploadDocument(input);
          notify.success("เพิ่มเอกสารสำเร็จ");
          setOpenUpload(false);
        }}
      />

      <AiKbDeleteModal
        open={openDelete}
        onOpenChange={setOpenDelete}
        doc={deleteDoc}
        onConfirm={async () => {
          if (!deleteDoc) return;
          await mut.deleteDocument(deleteDoc.id);
          setOpenDelete(false);
        }}
        isDeleting={mut.loading.deleteDocument}
      />
    </div>
  );
}
