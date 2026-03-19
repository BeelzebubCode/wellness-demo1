// src/services/ai-agent/analyst/presenter/column-labels.ts
// Maps raw SQL column names to user-friendly Thai labels.

const COLUMN_LABELS: Record<string, string> = {
    // Booking counts
    booking_count: "จำนวนคิว",
    problem_count: "จำนวนคิว",
    total_count: "จำนวนทั้งหมด",
    total_bookings: "จำนวนคิวทั้งหมด",
    student_count: "จำนวนนิสิต",
    cancel_count: "จำนวนยกเลิก",
    cancellation_count: "จำนวนยกเลิก",
    completed_count: "จำนวนสำเร็จ",
    pending_count: "จำนวนรอ",
    consultation_count: "จำนวนปรึกษา",
    cnt: "จำนวน",
    // Booking fields
    booking_id: "รหัสคิว",
    booking_status: "สถานะ",
    booking_service_mode: "รูปแบบบริการ",
    booking_created_at: "วันที่จอง",
    // University
    university_name_th: "มหาวิทยาลัย",
    university_name_en: "University",
    university_id: "รหัสมหาลัย",
    university_count: "จำนวนมหาลัย",
    // Faculty / Department
    faculty_name_th: "คณะ",
    faculty_count: "จำนวนคณะ",
    department_name_th: "สาขาวิชา",
    department_count: "จำนวนสาขา",
    // Student
    student_first_name_th: "ชื่อ",
    student_last_name_th: "นามสกุล",
    student_name: "ชื่อนิสิต",
    student_gender: "เพศ",
    student_id: "รหัสนิสิต",
    student: "ชื่อนิสิต",
    name: "ชื่อ",
    problem_name: "ประเภทปัญหา",
    full_name: "ชื่อ-นามสกุล",
    // Consultant
    consultant_first_name: "ชื่อที่ปรึกษา",
    consultant_last_name: "นามสกุลที่ปรึกษา",
    consultant_name: "ที่ปรึกษา",
    consultant_count: "จำนวนที่ปรึกษา",
    // Problem / Category
    problem_category_name_th: "ประเภทปัญหา",
    problem_category_name_en: "Problem Category",
    problem_category_code: "รหัสปัญหา",
    category_name: "ประเภท",
    // Cancellation
    cancellation_reason_name_th: "สาเหตุยกเลิก",
    cancellation_reason_name_en: "Cancellation Reason",
    reason_name: "สาเหตุ",
    // Region / Province
    region_name_th: "ภูมิภาค",
    province_name_th: "จังหวัด",
    // Risk
    risk_level_id: "ระดับความเสี่ยง",
    risk_level: "ระดับความเสี่ยง",
    avg_risk: "ความเสี่ยงเฉลี่ย",
    avg_risk_level: "ความเสี่ยงเฉลี่ย",
    high_risk_count: "จำนวนเสี่ยงสูง",
    // Online
    online_channel_name_th: "ช่องทาง Online",
    online_channel_code: "ช่องทาง",
    // Time
    month: "เดือน",
    year: "ปี",
    booking_year: "ปี",
    booking_month: "เดือน",
    hour: "ชั่วโมง",
    day_of_week: "วัน",
    // Gender
    gender: "เพศ",
    male_count: "ชาย",
    female_count: "หญิง",
    other_count: "อื่นๆ",
    // Misc
    count: "จำนวน",
    total: "รวม",
    rank: "อันดับ",
    percentage: "เปอร์เซ็นต์",
    pct: "เปอร์เซ็นต์",
    avg_count: "เฉลี่ย",
    max_count: "สูงสุด",
    min_count: "ต่ำสุด",
    case_count: "จำนวนเคส",
    // Contact
    consultant_phone_number: "เบอร์โทรที่ปรึกษา",
    advisor_phone_number: "เบอร์โทรอาจารย์",
    consultant_email: "อีเมลที่ปรึกษา",
    advisor_email: "อีเมลอาจารย์",
    student_phone_number: "เบอร์โทรนิสิต",
    student_email: "อีเมลนิสิต",
    // Advisor
    advisor_first_name: "ชื่ออาจารย์ที่ปรึกษา",
    advisor_last_name: "นามสกุลอาจารย์ที่ปรึกษา",
    // Cancel pct
    cancel_pct: "เปอร์เซ็นต์ยกเลิก",
    cancelled: "ยกเลิก",
    cancel_percentage: "เปอร์เซ็นต์ยกเลิก",
    cancelled_appointments: "จำนวนยกเลิก",
};

/**
 * Get Thai label for a column name.
 * Checks exact match first, then applies pattern-based fallback.
 */
export function getColumnLabel(col: string): string {
    if (COLUMN_LABELS[col]) return COLUMN_LABELS[col];
    if (col.endsWith("_count")) return "จำนวน";
    if (col.endsWith("_name_th") || col.endsWith("_name_en")) return "ชื่อ";
    if (col.endsWith("_id")) return "รหัส";
    if (col.startsWith("total_")) return "รวม";
    if (col.startsWith("avg_")) return "เฉลี่ย";
    return col.replace(/_/g, " ");
}
