// prisma/seed-utils/rand.ts
export const randomInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

// ✅ รับ readonly array ได้ (as const friendly)
export const randomItem = <T>(arr: readonly T[]): T =>
  arr[Math.floor(Math.random() * arr.length)];

export const randomBool = (p = 0.5) => Math.random() < p;

export function pickWeightedKey<T extends string>(weights: Record<T, number>): T {
  const keys = Object.keys(weights) as T[];
  const total = keys.reduce((sum, k) => sum + (weights[k] ?? 0), 0);
  let r = Math.random() * total;
  for (const k of keys) {
    r -= weights[k] ?? 0;
    if (r <= 0) return k;
  }
  return keys[0];
}

export const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n));
