"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/shared/EmptyState";
import { useNotification } from "@/components/notification/useNotification";
import { Building2, Eye, Globe, Plus, Search, Trash2 } from "lucide-react";

import type { AiKbDoc } from "@/features/ai-kb/types";
import { useAiKbDocuments } from "@/features/ai-kb/hooks/useAiKbDocuments";
import { useAiKbMutations } from "@/features/ai-kb/hooks/useAiKbMutations";

import AiKbCreateModal from "./AiKbCreateModal";
import AiKbViewModal from "./AiKbViewModal";
import AiKbDeleteModal from "./AikbDeleteModal";

type ScopeFilter = "ALL" | "GLOBAL" | "TENANT";
type ActiveFilter = "ALL" | "ACTIVE" | "INACTIVE";

function scopeLabel(universityId: number | null | undefined) {
  return universityId == null ? "Global" : "Tenant";
}

function uniLabel(d: AiKbDoc) {
  // ถ้า backend ส่ง code/name มาด้วยก็ใช้ได้ (optional)
  const anyDoc = d as any;
  if (d.universityId == null) return "ทุกมหาลัย (Global)";
  if (anyDoc.universityCode || anyDoc.universityName) {
    const code = anyDoc.universityCode ? String(anyDoc.universityCode) : `#${d.universityId}`;
    const name = anyDoc.universityName ? String(anyDoc.universityName) : "";
    return name ? `${code} • ${name}` : code;
  }
  return `University#${d.universityId}`;
}

export default function AiKbManagerPage() {
  const notify = useNotification();

  // filters
  const [q, setQ] = useState("");
  const [scope, setScope] = useState<ScopeFilter>("ALL");
  const [active, setActive] = useState<ActiveFilter>("ALL");
  const [universityId, setUniversityId] = useState<string>("ALL");

  // modal state
  const [openCreate, setOpenCreate] = useState(false);
  const [openView, setOpenView] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<AiKbDoc | null>(null);

  // ✅ hook: list docs
  const { docs, total, isLoading, error, refetch } = useAiKbDocuments({
    q,
    scope,
    active,
    universityId: universityId === "ALL" ? undefined : Number(universityId),
  });

  // ✅ hook: mutations
  const mut = useAiKbMutations({
    onMutated: async () => {
      await refetch();
    },
  });

  const universityOptions = useMemo(() => {
    // derive options จาก docs ที่มี (ยังไม่ต้องมี endpoint universities)
    const map = new Map<number, string>();
    for (const d of docs) {
      if (d.universityId == null) continue;
      map.set(d.universityId, uniLabel(d));
    }
    const items = Array.from(map.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([id, label]) => ({ value: String(id), label }));
    return [{ value: "ALL", label: "มหาลัย: ทั้งหมด" }, ...items];
  }, [docs]);

  function openViewDoc(d: AiKbDoc) {
    setSelectedDoc(d);
    setOpenView(true);
  }

  function openDeleteDoc(d: AiKbDoc) {
    setSelectedDoc(d);
    setOpenDelete(true);
  }

  async function toggleActive(d: AiKbDoc) {
    try {
      await mut.toggleActive(d.id);
      notify.success(`อัปเดตสถานะเอกสาร: ${d.key}`);
    } catch (e: any) {
      notify.error(e?.message ?? "toggle active ไม่สำเร็จ");
    }
  }

  async function deleteSelected() {
    if (!selectedDoc) return;
    try {
      await mut.deleteDocument(selectedDoc.id);
      notify.success(`ลบเอกสารแล้ว: ${selectedDoc.key}`);
      setOpenDelete(false);
      setSelectedDoc(null);
    } catch (e: any) {
      notify.error(e?.message ?? "ลบเอกสารไม่สำเร็จ");
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl p-4">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">
            AI Knowledge Base (Super Admin)
          </h1>
          <p className="text-sm text-slate-600">
            จัดการเอกสารให้ AI ใช้อ้างอิง (ต่อ API แล้ว)
          </p>
        </div>

        <Button onClick={() => setOpenCreate(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          เพิ่มเอกสาร
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-4 p-3">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
          <div className="md:col-span-5">
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="ค้นหา key / title / category"
              leftIcon={<Search className="h-4 w-4" />}
            />
          </div>

          <div className="md:col-span-2">
            <Select
              value={scope}
              onValueChange={(v) => setScope(v as any)}
              options={[
                { value: "ALL", label: "Scope: ทั้งหมด" },
                { value: "GLOBAL", label: "Scope: Global" },
                { value: "TENANT", label: "Scope: Tenant" },
              ]}
            />
          </div>

          <div className="md:col-span-2">
            <Select
              value={active}
              onValueChange={(v) => setActive(v as any)}
              options={[
                { value: "ALL", label: "สถานะ: ทั้งหมด" },
                { value: "ACTIVE", label: "สถานะ: Active" },
                { value: "INACTIVE", label: "สถานะ: Inactive" },
              ]}
            />
          </div>

          <div className="md:col-span-3">
            <Select
              value={universityId}
              onValueChange={(v) => setUniversityId(v)}
              options={universityOptions}
            />
          </div>
        </div>
      </Card>

      {/* List */}
      <Card className="p-0">
        {isLoading ? (
          <div className="p-6 text-sm text-slate-600">กำลังโหลด...</div>
        ) : error ? (
          <div className="p-6 text-sm text-rose-600">
            โหลดไม่สำเร็จ: {String(error)}
          </div>
        ) : docs.length === 0 ? (
          <div className="p-6">
            <EmptyState title="ยังไม่มีเอกสาร" description="ลองเพิ่มเอกสาร หรือปรับ filter" />
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            <div className="px-4 py-3 text-xs text-slate-500">
              ทั้งหมด {total ?? docs.length} รายการ
            </div>

            {docs.map((d) => (
              <div
                key={d.id}
                className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-2">
                      {d.universityId == null ? (
                        <Globe className="h-4 w-4 text-slate-500" />
                      ) : (
                        <Building2 className="h-4 w-4 text-slate-500" />
                      )}
                      <span className="truncate font-medium text-slate-900">
                        {d.title}
                      </span>
                    </div>

                    <Badge variant={d.isActive ? "success" : "secondary"}>
                      {d.isActive ? "ACTIVE" : "INACTIVE"}
                    </Badge>

                    {d.category ? <Badge variant="outline">{d.category}</Badge> : null}
                    <Badge variant="outline">{scopeLabel(d.universityId)}</Badge>
                  </div>

                  <div className="mt-1 flex flex-col gap-1 text-sm text-slate-600">
                    <div className="truncate">
                      <span className="text-slate-500">key:</span>{" "}
                      <span className="font-mono">{d.key}</span>
                      {d.urlHint ? (
                        <>
                          {" "}
                          <span className="text-slate-400">•</span>{" "}
                          <span className="text-slate-500">url:</span>{" "}
                          <span className="font-mono">{d.urlHint}</span>
                        </>
                      ) : null}
                    </div>
                    <div className="truncate">
                      <span className="text-slate-500">scope:</span> {uniLabel(d)}
                    </div>
                  </div>
                </div>

                <div className="flex shrink-0 flex-wrap gap-2">
                  <Button variant="ghost" className="gap-2" onClick={() => openViewDoc(d)}>
                    <Eye className="h-4 w-4" />
                    ดู
                  </Button>

                  <Button
                    variant={d.isActive ? "secondary" : "primary"}
                    onClick={() => toggleActive(d)}
                    disabled={mut.loading.toggleActive}
                  >
                    {d.isActive ? "ปิดใช้งาน" : "เปิดใช้งาน"}
                  </Button>

                  <Button variant="danger" className="gap-2" onClick={() => openDeleteDoc(d)}>
                    <Trash2 className="h-4 w-4" />
                    ลบ
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Modals */}
      <AiKbCreateModal
        open={openCreate}
        onOpenChange={setOpenCreate}
        onCreate={async (input) => {
          try {
            await mut.createDocument(input);
            notify.success("สร้างเอกสารสำเร็จ");
            setOpenCreate(false);
          } catch (e: any) {
            notify.error(e?.message ?? "สร้างเอกสารไม่สำเร็จ");
          }
        }}
      />

      <AiKbViewModal
        open={openView}
        onOpenChange={setOpenView}
        doc={selectedDoc}
        onCreateVersion={async (docId, input) => {
          try {
            await mut.createVersion(docId, input);
            notify.success("สร้างเวอร์ชันใหม่แล้ว");
          } catch (e: any) {
            notify.error(e?.message ?? "สร้างเวอร์ชันไม่สำเร็จ");
          }
        }}
        onPublish={async (versionId) => {
          try {
            await mut.publishVersion(versionId);
            notify.success("Publish แล้ว");
          } catch (e: any) {
            notify.error(e?.message ?? "Publish ไม่สำเร็จ");
          }
        }}
      />

      <AiKbDeleteModal
        open={openDelete}
        onOpenChange={setOpenDelete}
        doc={selectedDoc}
        onConfirm={deleteSelected}
        isDeleting={mut.loading.deleteDocument}
      />
    </div>
  );
}
