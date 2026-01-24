// src/features/ai-kb/types.ts
export type KbContentType = "MARKDOWN" | "JSON";
export type KbVersionStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
export type KbIndexStatus = "PENDING" | "READY" | "FAILED";

export type AiKbDoc = {
  id: number;
  universityId: number | null;
  key: string;
  title: string;
  category: string | null;
  urlHint: string | null;
  isActive: boolean;
  publishedVersionId: number | null;
  updatedAt: string;
};

export type AiKbVersion = {
  id: number;
  docId: number;
  versionNo: number;
  contentType: KbContentType;
  status: KbVersionStatus;
  indexStatus: KbIndexStatus;
  updatedAt: string;
  sourceMd?: string | null;
  sourceJson?: any;
};

export type ListDocsParams = {
  q?: string;
  scope?: "ALL" | "GLOBAL" | "TENANT";
  active?: "ALL" | "ACTIVE" | "INACTIVE";
  universityId?: string; // "ALL" | "GLOBAL" | number string
};

export type ApiOk<T> = { success: true; data: T };
export type ApiFail = { success: false; error: string };
