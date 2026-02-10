# 🔐 Demo Login Credentials

## Quick Start

**Password สำหรับทุก account:** `password123`

---

## 📋 บัญชีผู้ใช้งานทั้งหมด

### 🏛️ Ministry & Super Admin
- **Ministry:** `ministry_admin`
- **Super Admin:** `superAdmin`

### 👑 Head Consultants (1 per university)
Format: `head_{university_code}`
- Example: `head_cu`, `head_tu`, `head_mu`, etc.

### 🏫 Rectors (1 per university)
Format: `rector_{university_code}`
- Example: `rector_cu`, `rector_tu`, `rector_mu`, etc.

### 👔 Deans (1 per faculty)
Format: `dean_{university}_{faculty_code}`
- Example: `dean_cu_eng`, `dean_cu_sci`, etc.

### 👨‍🏫 Advisors (1 per department)
Format: `advisor_{university}_{department_code}`
- Example: 
  - `advisor_cu_cse` (Computer Science @ CU)
  - `advisor_cu_ee` (Electrical Engineering @ CU)
  - `advisor_tu_arch` (Architecture @ TU)

### 💼 Consultants (5 per university)
Format: `consultant_{university_code}_{1-5}`
- Example: 
  - `consultant_cu_1` to `consultant_cu_5`
  - `consultant_tu_1` to `consultant_tu_5`
  - `consultant_mu_1` to `consultant_mu_5`

### 🎓 Students

#### Quick Mode (100 students):
Format: `stu_{university_code}_{01-25}`
- Example: `stu_cu_01` to `stu_cu_25` (~4 universities)

#### Dev Mode (30 per university):
Format: `stu_{university_code}_{01-30}`
- Example: `stu_cu_01` to `stu_cu_30`

---

## 🚀 ทดสอบ Features ต่างๆ

### ✅ Consultant 14-Day Shift System
**Login:** `consultant_cu_1` | **Password:** `password123`
**Page:** `/consultant/shifts`

**Features to test:**
- ✅ View current 14-day shift calendar
- ✅ See days worked and days remaining
- ✅ View borrowing periods (ON_LOAN status)
- ✅ See timeline with color-coded days
- ✅ View completed shift history

**Demo Data:**
- Consultant 1: Has a RETURNED borrow period (days 2-3)
- Consultant 2: Currently ON_LOAN to another university (days 5-7)

### ✅ Student Booking System
**Login:** `stu_cu_01` | **Password:** `password123`
**Page:** `/student/dashboard`

### ✅ Advisor Dashboard
**Login:** `advisor_cu_cse` | **Password:** `password123`
**Page:** `/advisor/dashboard`

### ✅ Dean Dashboard
**Login:** `dean_cu_eng` | **Password:** `password123`
**Page:** `/dean/dashboard`

---

## 🎯 Seed Data Modes

### 1️⃣ Quick Mode (Recommended for Development)
**Purpose:** รวดเร็ว ทดสอบ features
**Students:** ~100 total (25 per university, ~4 universities)
**Time:** ~5-10 seconds

```bash
SEED_QUICK_MODE=true npx prisma db seed
```

### 2️⃣ Dev Mode
**Purpose:** ทดสอบแบบกลางๆ
**Students:** 30 per university (~4,650 total)
**Time:** ~1-2 minutes

```bash
SEED_DEV_MODE=true npx prisma db seed
```

### 3️⃣ Full Scale Mode
**Purpose:** Production-like data
**Students:** ~1.8M total (based on real university enrollment)
**Time:** ~5-10 minutes

```bash
npx prisma db seed
```

---

## 📌 Seed Consultant Shifts (After Main Seed)

After running the main seed, populate shift data:

```bash
npx tsx scripts/seed-consultant-shifts.ts
```

This creates:
- ✅ Current active shifts (day 4/14)
- ✅ Completed shifts (1 month ago)
- ✅ Upcoming shifts (starts in 10 days)
- ✅ Demo borrow periods (ACTIVE and RETURNED)

---

## 🔍 Verify Seed Data

Check seeded accounts and data:

```bash
# List all account types
npx tsx scripts/list-all-accounts.ts

# List students
npx tsx scripts/list-students.ts

# List deans
npx tsx scripts/list-deans.ts

# Verify all seed data
npx tsx scripts/verify-seed-data.ts
```

---

## 💡 Tips

1. **Quick Testing:** Use `SEED_QUICK_MODE=true` for fast iteration
2. **Full Features:** Use `SEED_DEV_MODE=true` for comprehensive testing
3. **Production Simulation:** Use full seed mode (no flags)
4. **Shift System:** Remember to run `seed-consultant-shifts.ts` separately

---

**Last Updated:** 2026-02-11
