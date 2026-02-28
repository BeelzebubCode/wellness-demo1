// src/features/dashboard/registry/filter-config.ts
// ─────────────────────────────────────────────────────────────────────────────
// Per-role filter permissions — config-driven like `lib/constants/*-nav.ts`.
// Edit this one file to add/remove filters for any role.
// ─────────────────────────────────────────────────────────────────────────────

export type FilterFieldId =
    | 'date_range'
    | 'all_time'
    | 'region'
    | 'province'
    | 'university_type'
    | 'university'
    | 'faculty'
    | 'department'
    | 'gender'
    | 'problem_category'
    | 'service_mode'
    | 'booking_status'
    | 'attendance_status'
    | 'online_channel'
    | 'family_income'
    | 'blood_group'
    | 'birth_order'
    | 'chronic_condition'
    | 'parental_status';

export type FilterInputType =
    | 'searchable_select'
    | 'toggle_chips'
    | 'date_range'
    | 'toggle';

export interface FilterFieldConfig {
    /** Unique field identifier */
    id: FilterFieldId;
    /** Thai label for display */
    labelTh: string;
    /** English label for display */
    labelEn: string;
    /** UI input type */
    type: FilterInputType;
    /** Allow multiple selections (for toggle_chips and searchable_select) */
    multi?: boolean;
    /** Group name for visual grouping in the filter bar */
    group?: 'time' | 'location' | 'scope' | 'advanced';
}

// ─── Shared field definitions (DRY) ─────────────────────────────────────────

const DATE_RANGE: FilterFieldConfig = {
    id: 'date_range', labelTh: 'ช่วงเวลา', labelEn: 'Date Range',
    type: 'date_range', group: 'time',
};

const ALL_TIME: FilterFieldConfig = {
    id: 'all_time', labelTh: 'ช่วงเวลาทั้งหมด', labelEn: 'All Time',
    type: 'toggle', group: 'time',
};

const REGION: FilterFieldConfig = {
    id: 'region', labelTh: 'ภูมิภาค', labelEn: 'Region',
    type: 'searchable_select', group: 'location',
};

const PROVINCE: FilterFieldConfig = {
    id: 'province', labelTh: 'จังหวัด', labelEn: 'Province',
    type: 'searchable_select', group: 'location',
};

const UNIVERSITY_TYPE: FilterFieldConfig = {
    id: 'university_type', labelTh: 'สังกัด', labelEn: 'University Type',
    type: 'searchable_select', group: 'location',
};

const UNIVERSITY: FilterFieldConfig = {
    id: 'university', labelTh: 'มหาวิทยาลัย', labelEn: 'University',
    type: 'searchable_select', group: 'location',
};

const FACULTY: FilterFieldConfig = {
    id: 'faculty', labelTh: 'คณะ', labelEn: 'Faculty',
    type: 'toggle_chips', multi: true, group: 'scope',
};

const DEPARTMENT: FilterFieldConfig = {
    id: 'department', labelTh: 'ภาควิชา', labelEn: 'Department',
    type: 'searchable_select', group: 'scope',
};

const GENDER: FilterFieldConfig = {
    id: 'gender', labelTh: 'เพศ', labelEn: 'Gender',
    type: 'toggle_chips', group: 'advanced',
};

const PROBLEM_CATEGORY: FilterFieldConfig = {
    id: 'problem_category', labelTh: 'ปัญหา', labelEn: 'Problem Category',
    type: 'toggle_chips', group: 'advanced',
};

const SERVICE_MODE: FilterFieldConfig = {
    id: 'service_mode', labelTh: 'บริการ', labelEn: 'Service Mode',
    type: 'toggle_chips', group: 'advanced',
};

const BOOKING_STATUS: FilterFieldConfig = {
    id: 'booking_status', labelTh: 'สถานะจอง', labelEn: 'Booking Status',
    type: 'toggle_chips', group: 'advanced',
};

const ATTENDANCE_STATUS: FilterFieldConfig = {
    id: 'attendance_status', labelTh: 'การเข้าพบ', labelEn: 'Attendance',
    type: 'toggle_chips', group: 'advanced',
};

const FAMILY_INCOME: FilterFieldConfig = {
    id: 'family_income', labelTh: 'รายได้ครอบครัว', labelEn: 'Family Income',
    type: 'toggle_chips', group: 'advanced',
};

const BLOOD_GROUP: FilterFieldConfig = {
    id: 'blood_group', labelTh: 'กรุ๊ปเลือด', labelEn: 'Blood Group',
    type: 'toggle_chips', group: 'advanced',
};

const BIRTH_ORDER: FilterFieldConfig = {
    id: 'birth_order', labelTh: 'ลำดับบุตร', labelEn: 'Birth Order',
    type: 'toggle_chips', group: 'advanced',
};

const CHRONIC_CONDITION: FilterFieldConfig = {
    id: 'chronic_condition', labelTh: 'โรคประจำตัว', labelEn: 'Chronic Condition',
    type: 'toggle_chips', multi: true, group: 'advanced',
};

const PARENTAL_STATUS: FilterFieldConfig = {
    id: 'parental_status', labelTh: 'สถานะครอบครัว', labelEn: 'Parental Status',
    type: 'toggle_chips', group: 'advanced',
};

// ─── Per-role filter configs ────────────────────────────────────────────────

export const FILTER_CONFIGS: Record<string, FilterFieldConfig[]> = {

    ministry: [
        DATE_RANGE, ALL_TIME,
        REGION, PROVINCE, UNIVERSITY_TYPE, UNIVERSITY,
        GENDER, PROBLEM_CATEGORY, SERVICE_MODE,
        BOOKING_STATUS, ATTENDANCE_STATUS,
    ],

    rector: [
        DATE_RANGE, ALL_TIME,
        FACULTY,
        GENDER, PROBLEM_CATEGORY, SERVICE_MODE,
        BOOKING_STATUS, ATTENDANCE_STATUS,
    ],

    dean: [
        DATE_RANGE, ALL_TIME,
        DEPARTMENT,
        GENDER, PROBLEM_CATEGORY, SERVICE_MODE,
        BOOKING_STATUS, ATTENDANCE_STATUS,
    ],

    'head-department': [
        DATE_RANGE, ALL_TIME,
        GENDER, PROBLEM_CATEGORY, SERVICE_MODE,
        BOOKING_STATUS, ATTENDANCE_STATUS,
        FAMILY_INCOME, BLOOD_GROUP, BIRTH_ORDER,
        CHRONIC_CONDITION, PARENTAL_STATUS,
    ],

    'head-consultant': [
        DATE_RANGE, ALL_TIME,
        GENDER, PROBLEM_CATEGORY, SERVICE_MODE,
        ATTENDANCE_STATUS,
    ],

    advisor: [
        DATE_RANGE, ALL_TIME,
        GENDER, PROBLEM_CATEGORY,
        BOOKING_STATUS,
    ],

    'super-admin': [
        DATE_RANGE, ALL_TIME,
        REGION, PROVINCE, UNIVERSITY, FACULTY,
        GENDER, PROBLEM_CATEGORY, SERVICE_MODE,
        BOOKING_STATUS, ATTENDANCE_STATUS,
    ],
};

// ─── Helpers ────────────────────────────────────────────────────────────────

export function getFilterConfig(role: string): FilterFieldConfig[] {
    return FILTER_CONFIGS[role] ?? [];
}

export function hasFilter(role: string, fieldId: FilterFieldId): boolean {
    return getFilterConfig(role).some((f) => f.id === fieldId);
}

export function getFiltersByGroup(role: string, group: FilterFieldConfig['group']): FilterFieldConfig[] {
    return getFilterConfig(role).filter((f) => f.group === group);
}
