// src/services/aiAgent/help/types.ts
// import type { KbHit } from "@/services/aiKb/retrieval/getKbContext";
import type { ChatMsg } from "../core/types"; // ✅ ใช้ของเดียว

export type HelpPolicy = {
  bannedWords: string[];
  warning: string;
} | null;

export type HelpMetaBlocked = {
  hit?: any;
  policyLoaded: boolean;
  usedKb: 0;
  usedDocs: [];
  usedChunks: [];
};

export type HelpMetaOk = {
  policyLoaded: boolean;
  usedKb: number;
  usedDocs: { key: string; title: string; documentId: number }[];
  usedChunks: {
    key: string;
    title: string;
    chunkId?: number;
    documentId: number;
    versionId?: number;
    publishedVersionId: number | null;
  }[];
};

export type RunHelpResult =
  | {
      blocked: true;
      kbText: "";
      reply: string;
      meta: HelpMetaBlocked;
    }
  | {
      blocked: false;
      kbText: string;
      reply: string | null;
      meta: HelpMetaOk;
    };

export type HelpParams = {
  question: string;

  // ✅ เพิ่ม: history messages (optional)
  messages?: ChatMsg[];

  role?: string | null;
  universityId?: number | null;
  allowedDocKeys?: string[];
};
