// src/services/policy/checkProfanity.ts
export function checkProfanity(input: string, bannedWords: string[]) {
  const text = input.trim().toLowerCase();
  const hit = bannedWords.find((w) => text.includes(w.toLowerCase()));
  return { ok: !hit, hit };
}
