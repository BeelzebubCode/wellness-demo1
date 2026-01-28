// prisma/seed-utils/date.ts
import { randomInt } from "./rand";

export function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function addMinutes(d: Date, mins: number) {
  const x = new Date(d);
  x.setMinutes(x.getMinutes() + mins);
  return x;
}

export const addHours = (d: Date, hrs: number) => addMinutes(d, hrs * 60);

export function addDays(d: Date, days: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

export function randomDateBetween(a: Date, b: Date) {
  const t = a.getTime() + Math.random() * (b.getTime() - a.getTime());
  return new Date(t);
}

export function setRandomBusinessTime(d: Date, openHour = 8, closeHour = 20) {
  const x = new Date(d);
  x.setHours(randomInt(openHour, closeHour - 1), randomInt(0, 59), 0, 0);
  return x;
}
