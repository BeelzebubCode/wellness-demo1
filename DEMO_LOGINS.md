# 🔐 Demo Login Credentials

## Quick Start

**Password สำหรับทุก account:** `password123`

---

## 📋 บัญชีสำคัญ (Recommended)

### 💼 Consultant (ระบบเวร)
Format: `consultant_{university}_1`
- **ABAC:** `consultant_abac_1`
- **Mahidol (MU):** `consultant_mu_1`
- **Chula (CU):** `consultant_cu_1`

### 👨‍🏫 Advisor (อาจารย์ที่ปรึกษา)
Format: `advisor_{university}_{department}`
- **ABAC:** `advisor_abac_edu_ele`
- **Mahidol:** `advisor_mu_med_nu`
- **Chula:** `advisor_cu_eng_cp`

### 👔 Dean (คณบดี)
Format: `dean_{university}_{faculty}`
- **ABAC:** `dean_abac_edu`
- **Mahidol:** `dean_mu_med`
- **Chula:** `dean_cu_eng`

---

## 📋 บัญชีอื่นๆ

### 🏛️ Ministry & Super Admin
- **Ministry:** `ministry_admin`
- **Super Admin:** `superAdmin`

### 👑 Head Consultants (1 per university)
Format: `head_{university_code}`
- Example: `head_abac`, `head_cu`, `head_mu`

### 🏫 Rectors (1 per university)
Format: `rector_{university_code}`
- Example: `rector_abac`, `rector_cu`

### 🎓 Students
Format: `stu_{university_code}_{01-25}`
- Example: `stu_abac_01`, `stu_cu_01`

---

## 🚀 ทดสอบ Features

### ✅ Consultant Shifts (ตารางเวร)
**Login:** `consultant_abac_1` (Password: `password123`)
**Page:** `/consultant/shifts`
- ดูตารางเวรแบบ Timeline Calendar
- ดูเวรที่ถูกยืมตัว (สีเหลือง/ม่วง)

### ✅ Advisor Dashboard
**Login:** `advisor_abac_edu_ele` (Password: `password123`)
**Page:** `/advisor/dashboard`
- ดูรายชื่อนักศึกษาในที่ปรึกษา
- อนุมัติการลา/การนัดหมาย

### ✅ Dean Dashboard
**Login:** `dean_abac_edu` (Password: `password123`)
**Page:** `/dean/dashboard`
- ดูภาพรวมคณะ
- สถิติการให้บริการ

---

## 📌 Helper Scripts

**Seed Data:**
```bash
# Quick Mode (แนะนำ)
SEED_QUICK_MODE=true npx prisma db seed

# Full Mode
npx prisma db seed
```
