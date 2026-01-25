// src/services/aiHelp/runHelp.ts
import prisma from "@/lib/prisma";
import {
  getKbContext,
  type KbHit,
} from "@/services/aiKb/retrieval/getKbContext";
import { checkProfanity } from "@/services/policy/checkProfanity";

const POLICY_DOC_KEY = "CHAT_NO_PROFANITY_TH";

function safeText(v: any, fallback: string) {
  const s = typeof v === "string" ? v : v == null ? "" : String(v);
  return s.trim().length ? s : fallback;
}

async function loadPolicyBannedWords(): Promise<
  { bannedWords: string[]; warning: string } | null
> {
  const doc = await prisma.aiKbDocument.findFirst({
    where: {
      ai_kb_document_key: POLICY_DOC_KEY,
      ai_kb_document_is_active: true,
      university_id: null,
      ai_kb_published_version_id: { not: null },
    },
    orderBy: { ai_kb_document_updated_at: "desc" },
    select: { ai_kb_published_version_id: true },
  });
  if (!doc?.ai_kb_published_version_id) return null;

  const ver = await prisma.aiKbDocumentVersion.findUnique({
    where: { ai_kb_document_version_id: doc.ai_kb_published_version_id },
    select: {
      ai_kb_content_type: true,
      ai_kb_version_status: true,
      ai_kb_source_json: true,
    },
  });

  if (!ver || ver.ai_kb_content_type !== "JSON") return null;
  if (String(ver.ai_kb_version_status) !== "PUBLISHED") return null;

  const policyJson = ver.ai_kb_source_json as any;

  const bannedWords: string[] = Array.isArray(policyJson?.banned_words)
    ? policyJson.banned_words.map((x: any) => String(x))
    : [];

  const warning = safeText(
    policyJson?.profanity_filter?.on_violation?.warning_message,
    "ขอความกรุณาใช้ถ้อยคำสุภาพในการสนทนานะครับ 🙂",
  );

  return { bannedWords, warning };
}

function formatKbText(kb: KbHit[]) {
  if (!kb.length) return "";
  return kb.map((x, i) => `[#${i + 1}] ${x.title} (${x.key})\n${x.text}`).join("\n\n");
}

// ✅ ทำให้ return shape นิ่ง (reply มีทุกกรณี)
export type RunHelpResult =
  | {
      blocked: true;
      kbText: "";
      reply: string;
      meta: {
        hit?: any;
        policyLoaded: boolean;
        usedKb: 0;
        usedDocs: [];
        usedChunks: [];
      };
    }
  | {
      blocked: false;
      kbText: string;
      reply: string | null;
      meta: {
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
    };

export async function runHelp(params: {
  question: string;
  role?: string | null;
  universityId?: number | null;
  allowedDocKeys?: string[];
}): Promise<RunHelpResult> {
  const question = (params.question ?? "").trim();

  // ✅ กันคำถามว่าง
  if (!question) {
    return {
      blocked: false,
      kbText: "",
      reply: "พิมพ์คำถามสั้น ๆ ให้ผมหน่อยครับ 🙂",
      meta: { usedKb: 0, usedDocs: [], usedChunks: [], policyLoaded: false },
    };
  }

  // 1) policy banned words จาก DB
  const policy = await loadPolicyBannedWords();
  if (policy?.bannedWords?.length) {
    const p = checkProfanity(question, policy.bannedWords);
    if (!p.ok) {
      return {
        blocked: true,
        kbText: "",
        reply: policy.warning,
        meta: {
          hit: p.hit,
          policyLoaded: true,
          usedKb: 0,
          usedDocs: [],
          usedChunks: [],
        },
      };
    }
  }

  // 2) KB retrieval
  const kb = await getKbContext({
    q: question,
    universityId: params.universityId,
    role: params.role ?? null,
    take: 6,
    allowedDocKeys: params.allowedDocKeys,
  });

  // 3) format text + meta
  const kbText = formatKbText(kb);

  const usedDocs = Array.from(
    new Map(
      kb.map((x) => [
        x.key,
        { key: x.key, title: x.title, documentId: x.documentId },
      ]),
    ).values(),
  );

  return {
    blocked: false,
    kbText,
    reply: null, // ✅ สำคัญ: ทำให้ route เช็ค help.reply ได้ชัวร์
    meta: {
      usedKb: kb.length,
      usedDocs,
      usedChunks: kb.map((x) => ({
        key: x.key,
        title: x.title,
        chunkId: x.chunkId,
        documentId: x.documentId,
        versionId: x.versionId,
        publishedVersionId: x.publishedVersionId,
      })),
      policyLoaded: Boolean(policy),
    },
  };
}
