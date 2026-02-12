
import { startOfDay } from "./prisma/seed-utils/date";
import { toThaiDate } from "./prisma/seed-utils/timezone";

console.log("Debug Weekend Logic");
console.log(`Current System Time: ${new Date().toString()}`);

// Simulate today (Feb 13 2026 Friday)
const today = new Date(); // As per metadata 2026-02-13
const today0 = startOfDay(today);
console.log(`today0 (Local): ${today0.toString()}`);
console.log(`today0 (UTC): ${today0.toISOString()}`);
console.log(`today0.getDay(): ${today0.getDay()}`);

// Check isWeekend implementation
function isWeekendCurrent(date: Date) {
    const day = date.getDay();
    return day === 0 || day === 6;
}

console.log(`isWeekendCurrent(today0): ${isWeekendCurrent(today0)}`);

// Proposed fix: Use Thai Date
// 08:00 TH on that day -> What UTC day is it?
const thaiDate = toThaiDate(today0, 8, 0); 
console.log(`Thai Date (08:00 TH): ${thaiDate.toISOString()}`);
console.log(`Thai Date UTCDay: ${thaiDate.getUTCDay()}`);

function isWeekendFixed(date: Date) {
    // Convert to Thai Time reference (e.g. 08:00 TH which is 01:00 UTC)
    // Then check UTC day.
    const th = toThaiDate(date, 8, 0); 
    const day = th.getUTCDay();
    return day === 0 || day === 6;
}

console.log(`isWeekendFixed(today0): ${isWeekendFixed(today0)}`);

// Test Normalization Fix
const d = today0;
console.log(`\nOriginal (Local): ${d.toString()}`);
const normalized = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 12));
console.log(`Normalized (UTC Noon): ${normalized.toISOString()}`);
console.log(`Normalized UTCDay: ${normalized.getUTCDay()}`); // Should be 5 (Friday)

const thaiSlot = toThaiDate(normalized, 8, 0);
console.log(`Thai Slot from Normalized: ${thaiSlot.toISOString()}`); // Should be Feb 13 01:00Z

// Check if shifting happens (Feb 14)
const tmr = new Date(d);
tmr.setDate(tmr.getDate() + 1);
const normTmr = new Date(Date.UTC(tmr.getFullYear(), tmr.getMonth(), tmr.getDate(), 12));
console.log(`\nTmr Norm (UTC Noon): ${normTmr.toISOString()}`);
console.log(`Tmr UTCDay: ${normTmr.getUTCDay()}`); // Should be 6 (Sat)
const thaiSlotTmr = toThaiDate(normTmr, 8, 0);
console.log(`Thai Slot Tmr: ${thaiSlotTmr.toISOString()}`); // Expect Feb 14 01:00Z
