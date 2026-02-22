// src/features/dashboard/shared/analytics-api.ts

import type { AnalyticsParams, AnalyticsResult, FacultyOption, DepartmentOption, ProblemCategoryOption } from "./analytics-types";

function buildSearchParams(params: AnalyticsParams): URLSearchParams {
    const sp = new URLSearchParams();

    if (params.all_time) {
        sp.set("all_time", "true");
    } else {
        if (params.date_start) sp.set("date_start", params.date_start);
        if (params.date_end) sp.set("date_end", params.date_end);
    }

    if (params.region_id) sp.set("region_id", String(params.region_id));
    if (params.province_id) sp.set("province_id", String(params.province_id));
    if (params.university_type) sp.set("university_type", params.university_type);
    if (params.university_id) sp.set("university_id", String(params.university_id));
    if (params.university_code) sp.set("university_code", params.university_code);
    if (params.faculty_id) sp.set("faculty_id", String(params.faculty_id));
    if (params.faculty_code) sp.set("faculty_code", params.faculty_code);
    if (params.department_id) sp.set("department_id", String(params.department_id));
    if (params.gender) sp.set("gender", params.gender);
    if (params.problem_category_id) sp.set("problem_category_id", String(params.problem_category_id));
    if (params.service_mode) sp.set("service_mode", params.service_mode);
    if (params.online_channel_category_id) sp.set("online_channel_category_id", String(params.online_channel_category_id));
    if (params.booking_status && params.booking_status.length > 0) {
        sp.set("booking_status", params.booking_status.join(","));
    }

    return sp;
}

async function safeFetch<T>(url: string): Promise<T> {
    const res = await fetch(url, { credentials: "include", cache: "no-store" });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.error ?? `HTTP ${res.status}`);
    return json.data as T;
}

export async function fetchAnalytics(params: AnalyticsParams): Promise<AnalyticsResult> {
    const sp = buildSearchParams(params);
    return safeFetch<AnalyticsResult>(`/api/v2/analytics/summary?${sp.toString()}`);
}

export async function fetchFaculties(): Promise<FacultyOption[]> {
    return safeFetch<FacultyOption[]>("/api/v2/analytics/faculties");
}

export async function fetchDepartments(facultyId: number): Promise<DepartmentOption[]> {
    return safeFetch<DepartmentOption[]>(`/api/v2/analytics/departments?faculty_id=${facultyId}`);
}

export async function fetchProblemCategories(): Promise<ProblemCategoryOption[]> {
    return safeFetch<ProblemCategoryOption[]>("/api/v2/analytics/problem-categories");
}

// ─── National Level Filters ─────────────────────────────────────────────────

export async function fetchRegions(): Promise<any[]> {
    return safeFetch<any[]>("/api/v2/analytics/regions");
}

export async function fetchProvinces(regionId?: number): Promise<any[]> {
    const sp = new URLSearchParams();
    if (regionId) sp.set("region_id", String(regionId));
    return safeFetch<any[]>(`/api/v2/analytics/provinces?${sp.toString()}`);
}

export async function fetchUniversities(regionId?: number, provinceId?: number): Promise<any[]> {
    const sp = new URLSearchParams();
    if (provinceId) sp.set("province_id", String(provinceId));
    else if (regionId) sp.set("region_id", String(regionId));
    return safeFetch<any[]>(`/api/v2/analytics/universities?${sp.toString()}`);
}
