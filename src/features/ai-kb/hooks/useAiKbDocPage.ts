// src/features/ai-kb/hooks/useAiKbDocPage.ts
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { aiKbApi } from "@/features/ai-kb/api";
import type { AiKbDoc, AiKbVersion } from "@/features/ai-kb/types";
import { useAiKbMutations } from "@/features/ai-kb/hooks/useAiKbMutations";

type VersionFilter = "ALL" | "PUBLISHED" | "DRAFT";
export type PageAlert =
  | null
  | { type: "error" | "info" | "success"; message: string };

export function useAiKbDocPage(docId: number) {
  const [pageAlert, setPageAlert] = useState<PageAlert>(null);

  const [doc, setDoc] = useState<AiKbDoc | null>(null);
  const [versions, setVersions] = useState<AiKbVersion[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedVersionId, setSelectedVersionId] = useState<number | null>(
    null,
  );
  const [tab, setTab] = useState<"PREVIEW" | "RAW">("PREVIEW");
  const [vFilter, setVFilter] = useState<VersionFilter>("ALL");

  const [openCreate, setOpenCreate] = useState(false);
  const [createType, setCreateType] = useState<"MARKDOWN" | "JSON">("MARKDOWN");
  const [createMd, setCreateMd] = useState("");
  const [createJsonText, setCreateJsonText] = useState("{\n  \n}");

  const [openUpload, setOpenUpload] = useState(false);

  const showInactiveAlert = useCallback((actionText: string) => {
    setPageAlert({
      type: "error",
      message: `เอกสารถูกปิดใช้งานอยู่ ต้องกด “เปิดใช้งาน” ก่อนจึง${actionText}ได้`,
    });
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await aiKbApi.getDocument(docId);
      setDoc(d.doc);

      if (!d.doc.isActive) {
        setPageAlert({
          type: "error",
          message:
            "เอกสารถูกปิดใช้งานอยู่ ต้องกด “เปิดใช้งาน” ก่อนจึงสร้างเวอร์ชัน/Publish ได้",
        });
      } else {
        setPageAlert((prev) => (prev?.message.includes("INACTIVE") ? null : prev));
      }

      const v = await aiKbApi.listVersions(docId);
      const list = v.versions ?? [];
      setVersions(list);

      setSelectedVersionId((prev) => {
        if (prev) return prev;
        const latest =
          [...list].sort((a, b) => b.versionNo - a.versionNo)[0]?.id ?? null;
        return latest;
      });
    } finally {
      setLoading(false);
    }
  }, [docId]);

  const mut = useAiKbMutations({ onMutated: load });

  useEffect(() => {
    load();
  }, [load]);

  const sorted = useMemo(
    () => [...versions].sort((a, b) => b.versionNo - a.versionNo),
    [versions],
  );

  const filtered = useMemo(() => {
    if (vFilter === "ALL") return sorted;
    if (vFilter === "PUBLISHED")
      return sorted.filter((v) => v.status === "PUBLISHED");
    return sorted.filter((v) => v.status !== "PUBLISHED");
  }, [sorted, vFilter]);

  const selected = useMemo(() => {
    const base = filtered.length ? filtered : sorted;
    if (!selectedVersionId) return base[0] ?? null;
    return base.find((v) => v.id === selectedVersionId) ?? base[0] ?? null;
  }, [filtered, sorted, selectedVersionId]);

  // ✅ action: upload version (เรียกจาก modal ได้ตรง ๆ)
  const uploadVersion = useCallback(
    async (input: { file: File; contentType?: "MARKDOWN" | "JSON" }) => {
      if (!doc) return;

      if (!doc.isActive) {
        showInactiveAlert("อัปโหลดเวอร์ชัน ");
        return;
      }

      try {
        await mut.uploadVersion({ docId: doc.id, ...input });
        setPageAlert({ type: "success", message: "อัปโหลดเวอร์ชันใหม่สำเร็จแล้ว" });
        setOpenUpload(false);
      } catch (e: any) {
        const msg = String(e?.message ?? "");
        if (msg.includes("DOC_INACTIVE") || msg.includes("409")) {
          showInactiveAlert("อัปโหลดเวอร์ชัน ");
          return;
        }
        setPageAlert({ type: "error", message: e?.message ?? "อัปโหลดเวอร์ชันไม่สำเร็จ" });
        throw e;
      }
    },
    [doc, mut, showInactiveAlert],
  );

  return {
    // data
    doc,
    versions,
    loading,

    // ui state
    pageAlert,
    setPageAlert,

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

    // derived
    sorted,
    filtered,
    selected,

    // actions
    load,
    showInactiveAlert,
    uploadVersion, // ✅ add
    mut,
  };
}
