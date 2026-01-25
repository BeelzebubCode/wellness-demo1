// src/services/aiHelp/runHelp.ts
import { getKbContext } from "@/services/aiKb/retrieval/getKbContext";
import { checkProfanity } from "@/services/policy/checkProfanity";

export async function runHelp(params: {
  question: string;
  tenantCode?: string;
  role?: string | null;
  universityId?: number | null;
  bannedWords?: string[];
}) {
  const { question, bannedWords = [] } = params;

  // 1) policy check
  const p = checkProfanity(question, bannedWords);
  if (!p.ok) {
    return {
      reply: "ขอความกรุณาใช้ถ้อยคำสุภาพในการสนทนานะครับ 🙂",
      blocked: true,
      usedDocs: [],
      kbText: "",
    };
  }

  // 2) kb retrieval
  const kb = await getKbContext({
    q: question,
    universityId: params.universityId,
    role: params.role ?? null,
    take: 6,
  });

  // 3) build context text
  const kbText =
    kb.length === 0
      ? ""
      : kb
          .map((x, i) => `[#${i + 1}] ${x.title} (${x.key})\n${x.text}`)
          .join("\n\n");

  const usedDocs = kb.map((x) => ({
    source: x.source,
    documentId: x.documentId,
    key: x.key,
    title: x.title,
    versionId: x.versionId,
    chunkId: x.chunkId,
  }));

  return { kbText, blocked: false, usedDocs };
}
