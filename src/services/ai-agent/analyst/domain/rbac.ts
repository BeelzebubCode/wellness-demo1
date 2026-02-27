// src/services/ai-agent/analyst/domain/rbac.ts
// Role-Based Access Control for the Analyst feature.

export const BLOCKED_ROLES = ["STUDENT"];

export interface AnalystScope {
    university_id?: number;
    faculty_id?: number;
    role: string;
}

const ROLE_HINTS: Record<string, string> = {
    MINISTRY: "ผู้ใช้คือรัฐมนตรี — เข้าถึงข้อมูลได้ทุกมหาวิทยาลัย ทุกระดับ",
    SUPER_ADMIN: "ผู้ใช้คือ Super Admin — เข้าถึงข้อมูลได้ทุกมหาวิทยาลัย ทุกระดับ",
    RECTOR: "ผู้ใช้คืออธิการบดี — เข้าถึงข้อมูลได้เฉพาะมหาวิทยาลัยของตน (university_id=__UID__) เท่านั้น",
    DEAN: "ผู้ใช้คือคณบดี — เข้าถึงข้อมูลได้เฉพาะคณะของตน (faculty_id=__FID__, university_id=__UID__)",
    ADMIN: "ผู้ใช้คือผู้ดูแลระบบมหาวิทยาลัย — เข้าถึงข้อมูลได้เฉพาะมหาวิทยาลัยของตน (university_id=__UID__)",
    PERSONNEL: "ผู้ใช้คือบุคลากร — เข้าถึงข้อมูลได้เฉพาะมหาวิทยาลัยของตน (university_id=__UID__)",
    CONSULTANT: "ผู้ใช้คือที่ปรึกษา — เข้าถึงข้อมูลได้เฉพาะมหาวิทยาลัยของตน (university_id=__UID__)",
    HEAD_CONSULTANT: "ผู้ใช้คือหัวหน้าที่ปรึกษา — เข้าถึงข้อมูลได้เฉพาะมหาวิทยาลัยของตน (university_id=__UID__)",
};

export const GLOBAL_ROLES = ["MINISTRY", "SUPER_ADMIN"];

export function isBlocked(role: string): boolean {
    return BLOCKED_ROLES.includes(role);
}

export function isGlobalRole(role: string): boolean {
    return GLOBAL_ROLES.includes(role);
}

export function getRoleContext(scope: AnalystScope): string {
    const template = ROLE_HINTS[scope.role] || "ผู้ใช้ไม่ระบุบทบาท — ให้ตอบแค่ข้อมูลทั่วไป";
    return template
        .replace(/__UID__/g, String(scope.university_id ?? "?"))
        .replace(/__FID__/g, String(scope.faculty_id ?? "?"));
}

export function getScopeHint(scope: AnalystScope): string {
    if (isGlobalRole(scope.role)) {
        return "No university_id filter needed (ministry-level, all universities)";
    }
    if (scope.university_id) {
        return `Filter: WHERE booking.university_id = ${scope.university_id}`;
    }
    return "No university_id filter available";
}
