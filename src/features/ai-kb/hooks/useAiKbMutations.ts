"use client";

import { useCallback, useState } from "react";
import { aiKbApi } from "../api";
import type { AiKbDoc, AiKbVersion } from "../types";

type LoadingState = {
  createDocument: boolean;
  deleteDocument: boolean;
  toggleActive: boolean;
  createVersion: boolean;
  publishVersion: boolean;
};

const initialLoading: LoadingState = {
  createDocument: false,
  deleteDocument: false,
  toggleActive: false,
  createVersion: false,
  publishVersion: false,
};

export function useAiKbMutations(opts?: { onMutated?: () => void | Promise<void> }) {
  const [loading, setLoading] = useState<LoadingState>(initialLoading);

  const run = useCallback(
    async <K extends keyof LoadingState, T>(key: K, fn: () => Promise<T>): Promise<T> => {
      setLoading((p) => ({ ...p, [key]: true }));
      try {
        const result = await fn();
        await opts?.onMutated?.();
        return result;
      } finally {
        setLoading((p) => ({ ...p, [key]: false }));
      }
    },
    [opts],
  );

  const createDocument = useCallback(
    (input: {
      universityId: number | null;
      key: string;
      title: string;
      category?: string | null;
      urlHint?: string | null;
      contentType: "MARKDOWN" | "JSON";
      markdown?: string;
      json?: any;
    }): Promise<{ doc: AiKbDoc }> => {
      return run("createDocument", () => aiKbApi.createDocument(input));
    },
    [run],
  );

  const deleteDocument = useCallback(
    (id: number): Promise<{ deleted: true }> => {
      return run("deleteDocument", () => aiKbApi.deleteDocument(id));
    },
    [run],
  );

  const toggleActive = useCallback(
    (id: number): Promise<{ doc: AiKbDoc }> => {
      return run("toggleActive", () => aiKbApi.toggleActive(id));
    },
    [run],
  );

  const createVersion = useCallback(
    (
      docId: number,
      input: { contentType: "MARKDOWN" | "JSON"; markdown?: string; json?: any },
    ): Promise<{ version: AiKbVersion }> => {
      return run("createVersion", () => aiKbApi.createVersion(docId, input));
    },
    [run],
  );

  const publishVersion = useCallback(
    (versionId: number): Promise<{ published: true }> => {
      return run("publishVersion", () => aiKbApi.publishVersion(versionId));
    },
    [run],
  );

  return {
    loading, // ✅ มี loading.deleteDocument แล้ว
    createDocument,
    deleteDocument,
    toggleActive,
    createVersion,
    publishVersion,
  };
}
