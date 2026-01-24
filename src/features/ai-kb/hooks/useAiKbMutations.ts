// src/features/ai-kb/hooks/useAiKbMutations.ts
"use client";

import { useCallback, useMemo, useState } from "react";
import { aiKbApi } from "../api";

type MutateKey =
  | "uploadDocument"
  | "deleteDocument"
  | "toggleActive"
  | "createVersion"
  | "publishVersion";

type MutateState = Record<MutateKey, boolean>;

const initialState: MutateState = {
  uploadDocument: false,
  deleteDocument: false,
  toggleActive: false,
  createVersion: false,
  publishVersion: false,
};

export type UploadDocumentInput = {
  scope: "GLOBAL" | "TENANT";
  universityId: number | null;
  category?: string | null;
  urlHint?: string | null;
  file: File;
  publish?: boolean; // default true
};

export function useAiKbMutations(opts?: { onMutated?: () => Promise<void> | void }) {
  const [loading, setLoading] = useState<MutateState>(initialState);

  const setBusy = useCallback((k: MutateKey, v: boolean) => {
    setLoading((s) => ({ ...s, [k]: v }));
  }, []);

  const wrap = useCallback(
    async <T,>(k: MutateKey, fn: () => Promise<T>) => {
      setBusy(k, true);
      try {
        const out = await fn();
        await opts?.onMutated?.();
        return out;
      } finally {
        setBusy(k, false);
      }
    },
    [opts, setBusy],
  );

  const uploadDocument = useCallback(
    (input: UploadDocumentInput) =>
      wrap("uploadDocument", () => aiKbApi.uploadDocument(input)),
    [wrap],
  );

  const deleteDocument = useCallback(
    (id: number) => wrap("deleteDocument", () => aiKbApi.deleteDocument(id)),
    [wrap],
  );

  const toggleActive = useCallback(
    (id: number) => wrap("toggleActive", () => aiKbApi.toggleActive(id)),
    [wrap],
  );

  const createVersion = useCallback(
    (docId: number, input: { contentType: "MARKDOWN" | "JSON"; markdown?: string; json?: any }) =>
      wrap("createVersion", () => aiKbApi.createVersion(docId, input)),
    [wrap],
  );

  const publishVersion = useCallback(
    (versionId: number) => wrap("publishVersion", () => aiKbApi.publishVersion(versionId)),
    [wrap],
  );

  return useMemo(
    () => ({
      loading,
      uploadDocument,
      deleteDocument,
      toggleActive,
      createVersion,
      publishVersion,
    }),
    [loading, uploadDocument, deleteDocument, toggleActive, createVersion, publishVersion],
  );
}
