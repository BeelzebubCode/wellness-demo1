// path: src/components/filters/utils.ts

export function isEmptyValue(v: any) {
    return v === undefined || v === null || v === "" || v === "ALL";
}

export function normalizeValue(v: any) {
    if (isEmptyValue(v)) return undefined;
    if (/^\d+$/.test(String(v))) return Number(v);
    if (v === "true" || v === true) return true;
    if (v === "false" || v === false) return false;
    return v;
}
