-- ==========================================
-- Performance Optimization Indexes
-- ==========================================
-- These indexes optimize the following endpoints:
-- 1. /api/v2/ministry/universities (map page)
-- 2. /api/v2/time-slots (time slot availability)
-- 3. /api/v2/bookings (booking list)

-- ==========================================
-- 1. BOOKING QUERY OPTIMIZATION
-- ==========================================

-- Speeds up booking list queries filtered by university + status + created date
-- Used by: listBookings handler when admin filters bookings
-- Expected improvement: 10x faster for filtered bookmark queries
CREATE INDEX IF NOT EXISTS idx_booking_university_status_created ON booking (
    university_id,
    booking_status,
    booking_created_at DESC
);

-- Speeds up student's own booking list
-- Used by: listBookings when role=STUDENT
CREATE INDEX IF NOT EXISTS idx_booking_student_status ON booking (student_id, booking_status);

-- Speeds up consultant's assigned booking list
-- Used by: listBookings when role=CONSULTANT
CREATE INDEX IF NOT EXISTS idx_booking_consultant_status ON booking (consultant_id, booking_status)
WHERE
    consultant_id IS NOT NULL;

-- Speeds up time slot booking count aggregation
-- Used by: listByDate when counting active bookings per slot
CREATE INDEX IF NOT EXISTS idx_booking_timeslot_status ON booking (time_slot_id, booking_status);

-- ==========================================
-- 2. TIME SLOT QUERY OPTIMIZATION
-- ==========================================

-- Speeds up time slot queries by university and date range
-- Used by: listByDate to fetch slots for specific date
-- Expected improvement: 5x faster time slot listing
CREATE INDEX IF NOT EXISTS idx_timeslot_university_datetime ON time_slot (
    university_id,
    time_slot_start_datetime
);

-- ==========================================
-- 3. UNIVERSITY MAP OPTIMIZATION
-- ==========================================

-- Speeds up university map queries with active + coordinates filter
-- Used by: /api/v2/ministry/universities for map markers
-- Expected improvement: 3x faster map data loading
CREATE INDEX IF NOT EXISTS idx_university_active_coords ON university (
    university_is_active,
    university_latitude,
    university_longitude
)
WHERE
    university_is_active = true
    AND university_latitude IS NOT NULL
    AND university_longitude IS NOT NULL;

-- Speeds up student count aggregation per university
-- Used by: University map _count.students aggregation
CREATE INDEX IF NOT EXISTS idx_student_university_id ON student (university_id);

-- ==========================================
-- 4. STUDENT LOOKUP OPTIMIZATION
-- ==========================================

-- Speeds up student lookup by username (admin filtering)
-- Used by: listBookings when filtering by student username
CREATE INDEX IF NOT EXISTS idx_account_username ON account (account_username);

-- Composite index for student account lookup
-- Used by: listBookings staff filter by student username
CREATE INDEX IF NOT EXISTS idx_student_university_account ON student (university_id, account_id);