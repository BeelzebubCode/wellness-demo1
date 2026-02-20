// src/services/aiAgent/help/policy.ts
import prisma from "@/lib/prisma";
import { checkProfanity } from "@/services/policy/checkProfanity";
import { safeText } from "../core/nlp/thai";
import type { HelpPolicy } from "./types";

const POLICY_DOC_KEY = "CHAT_NO_PROFANITY_TH";

export async function loadPolicyBannedWords(): Promise<HelpPolicy> {
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

export function checkProfanityOrNull(question: string, policy: HelpPolicy) {
  if (!policy?.bannedWords?.length) return null;
  const p = checkProfanity(question, policy.bannedWords);
  return p.ok ? null : p;
}
