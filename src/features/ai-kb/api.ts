// src/features/ai-kb/api.ts
import type { ApiFail, ApiOk, AiKbDoc, AiKbVersion } from "./types";

async function j<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  return data as T;
}

async function assertOk<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await j<ApiFail>(res);
    throw new Error(body?.error || `HTTP ${res.status}`);
  }
  const body = await j<ApiOk<T>>(res);
  if (!body?.success) throw new Error((body as any)?.error || "API error");
  return body.data;
}

export const aiKbApi = {
  // LIST docs
  async listDocuments(params: {
    q?: string;
    scope?: "ALL" | "GLOBAL" | "TENANT";
    active?: "ALL" | "ACTIVE" | "INACTIVE";
    universityId?: number | null;
  }) {
    const sp = new URLSearchParams();
    if (params.q) sp.set("q", params.q);
    if (params.scope) sp.set("scope", params.scope);
    if (params.active) sp.set("active", params.active);
    if (params.universityId !== undefined) {
      sp.set(
        "universityId",
        params.universityId === null ? "null" : String(params.universityId),
      );
    }

    const res = await fetch(
      `/api/v2/platform/ai-kb/documents?${sp.toString()}`,
      {
        method: "GET",
        credentials: "include",
      },
    );

    // ✅ เปลี่ยนจาก {data,total} -> {docs,total}
    return assertOk<{ docs: AiKbDoc[]; total: number }>(res);
  },

  // CREATE doc + initial version
  async createDocument(input: {
    universityId: number | null;
    key: string;
    title: string;
    category?: string | null;
    urlHint?: string | null;
    contentType: "MARKDOWN" | "JSON";
    markdown?: string;
    json?: any;
  }) {
    const res = await fetch(`/api/v2/platform/ai-kb/documents`, {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    });
    return assertOk<{ doc: AiKbDoc }>(res);
  },

  // GET doc detail
  async getDocument(id: number) {
    const res = await fetch(`/api/v2/platform/ai-kb/documents/${id}`, {
      method: "GET",
      credentials: "include",
    });
    return assertOk<{ doc: AiKbDoc; versions?: AiKbVersion[] }>(res);
  },

  // DELETE doc
  async deleteDocument(id: number) {
    const res = await fetch(`/api/v2/platform/ai-kb/documents/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    return assertOk<{ deleted: true }>(res);
  },

  // TOGGLE ACTIVE
  async toggleActive(id: number) {
    const res = await fetch(
      `/api/v2/platform/ai-kb/documents/${id}/toggle-active`,
      {
        method: "PATCH",
        credentials: "include",
      },
    );
    return assertOk<{ doc: AiKbDoc }>(res);
  },

  // LIST versions for doc
  async listVersions(docId: number) {
    const res = await fetch(
      `/api/v2/platform/ai-kb/documents/${docId}/versions`,
      {
        method: "GET",
        credentials: "include",
      },
    );
    return assertOk<{ versions: AiKbVersion[] }>(res);
  },

  // CREATE version for doc
  async createVersion(
    docId: number,
    input: { contentType: "MARKDOWN" | "JSON"; markdown?: string; json?: any },
  ) {
    const res = await fetch(
      `/api/v2/platform/ai-kb/documents/${docId}/versions`,
      {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(input),
      },
    );
    return assertOk<{ version: AiKbVersion }>(res);
  },

  // PUBLISH version
  async publishVersion(versionId: number) {
    const res = await fetch(
      `/api/v2/platform/ai-kb/versions/${versionId}/publish`,
      {
        method: "POST",
        credentials: "include",
      },
    );
    return assertOk<{ document: AiKbDoc; version: AiKbVersion }>(res);
  },

  // Upload File Document
  async uploadDocument(input: {
    scope: "GLOBAL" | "TENANT";
    universityId: number | null;
    file: File;
  }) {
    const fd = new FormData();
    fd.set("scope", input.scope);
    fd.set(
      "universityId",
      input.universityId === null ? "null" : String(input.universityId),
    );
    fd.set("file", input.file);

    const res = await fetch(`/api/v2/platform/ai-kb/documents/upload`, {
      method: "POST",
      credentials: "include",
      body: fd,
    });

    return assertOk<{ doc: AiKbDoc; version: AiKbVersion }>(res);
  },

  // UPLOAD version for doc
  async uploadVersion(
    docId: number,
    input: { file: File; contentType?: "MARKDOWN" | "JSON" },
  ) {
    const fd = new FormData();
    fd.set("file", input.file);
    if (input.contentType) fd.set("contentType", input.contentType);

    const res = await fetch(
      `/api/v2/platform/ai-kb/documents/${docId}/versions/upload`,
      {
        method: "POST",
        credentials: "include",
        body: fd,
      },
    );

    return assertOk<{ version: AiKbVersion }>(res);
  },

  async listUniversities(params?: { q?: string }) {
    const sp = new URLSearchParams();
    if (params?.q) sp.set("q", params.q);

    const res = await fetch(`/api/v2/platform/universities?${sp.toString()}`, {
      method: "GET",
      credentials: "include",
    });

    return assertOk<{
      universities: {
        id: number;
        code: string;
        nameTh: string;
        nameEn?: string | null;
        isActive: boolean;
      }[];
    }>(res);
  },
};
