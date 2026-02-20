// src/services/aiAgent/help/kb.ts
import { getKbContext } from "@/services/ai-kb/retrieval/getKbContext";
import type { KbHit } from "@/services/ai-kb/retrieval/getKbContext";

export function formatKbText(kb: KbHit[]) {
  if (!kb.length) return "";
  return kb
    .map((x, i) => `[#${i + 1}] ${x.title} (${x.key})\n${x.text}`)
    .join("\n\n");
}

export async function retrieveKb(args: {
  q: string;
  universityId?: number | null;
  role?: string | null;
  take?: number;
  allowedDocKeys?: string[];
}) {
  return getKbContext({
    q: args.q,
    universityId: args.universityId ?? null,
    role: args.role ?? null,
    take: args.take ?? 6,
    allowedDocKeys: args.allowedDocKeys,
  });
}
