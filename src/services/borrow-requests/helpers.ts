// src/services/borrowRequests/helpers.ts

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getAccountId(account: any): number {
  const id =
    account?.account_id ??
    account?.accountId ??
    account?.id ??
    account?.account?.account_id;

  if (!Number.isFinite(Number(id))) throw new Error("Account id not found in session");
  return Number(id);
}

export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const R = 6371;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
