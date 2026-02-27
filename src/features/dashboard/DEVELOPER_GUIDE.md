# 🏗️ Dashboard Developer Guide

> คู่มือสำหรับ Dev ที่จะเข้ามาทำงานกับระบบ Dashboard  
> อัปเดตล่าสุด: 27 ก.พ. 2569

---

## 📁 โครงสร้างโฟลเดอร์

```
dashboard/
├── registry/                  ← ⭐ CONFIG กลาง (แก้ที่นี่ก่อน)
│   ├── dashboard-registry.ts  ← role → layout, sections, mode
│   ├── filter-config.ts       ← role → filter ที่แสดง
│   ├── widget-catalog.tsx     ← widgetId → component (lazy-loaded)
│   └── index.ts
│
├── widgets/                   ← SHARED — ใช้ร่วมหลาย role
│   ├── charts/                ← กราฟที่ใช้ร่วมกัน (Trend, Risk, Attendance...)
│   ├── cards/                 ← KPI cards, ChartCard wrapper
│   ├── filters/               ← DashboardFilterBar (config-driven)
│   ├── hooks/                 ← useAnalytics, useDashboardLayout
│   ├── shell/                 ← DashboardShell, Grid, TogglePanel
│   ├── api/                   ← analytics API functions
│   └── types/                 ← shared TypeScript types
│
├── rector/                    ← 🔵 Rector only
│   ├── components/            ← StrategicKPI, ProblemDNA, Heatmap...
│   └── hooks/
├── ministry/                  ← 🟣 Ministry only
│   ├── components/            ← MinistryTrend, HeatMap, RiskyUniTable...
│   ├── hooks/
│   └── services/
├── dean/                      ← 🟢 Dean only
├── head-consultant/           ← 🟠 Head Consultant only
├── advisor/                   ← 🔴 Advisor only
└── super-admin/               ← ⚪ Super Admin only
```

### กฎ: chart อยู่ที่ไหน = ของใคร

| อยู่ที่ไหน | หมายความว่า |
|-----------|------------|
| `widgets/charts/` | **Shared** — หลาย role ใช้ร่วมกัน |
| `rector/components/` | **Rector only** — แก้ได้เลยไม่กระทบคนอื่น |
| `ministry/components/` | **Ministry only** |
| `{role}/components/` | ของ role นั้นเท่านั้น |

---

## 🎯 วิธีทำงาน (Recipes)

### 1. เพิ่ม/ลด Filter ให้ role

แก้ไฟล์เดียว: `registry/filter-config.ts`

```typescript
// เพิ่ม filter ภาควิชาให้ Dean
dean: [
  DATE_RANGE, ALL_TIME,
  DEPARTMENT,
  GENDER, PROBLEM_CATEGORY, SERVICE_MODE,
  BOOKING_STATUS, ATTENDANCE_STATUS,
+ ONLINE_CHANNEL,            // ← เพิ่มแค่บรรทัดเดียว
],
```

### 2. สร้าง Chart ใหม่

**ถ้าเฉพาะ role เดียว** → ใส่ใน `{role}/components/`
```
rector/components/NewRectorChart.tsx
```

**ถ้าใช้ร่วมหลาย role** → ใส่ใน `widgets/charts/` + เพิ่ม export
```
widgets/charts/NewSharedChart.tsx
```
แล้วเพิ่มใน `widgets/charts/index.ts`:
```typescript
export { NewSharedChart } from './NewSharedChart';
```

### 3. Register Widget ใหม่ใน Catalog

เพิ่มใน `registry/widget-catalog.tsx`:
```typescript
'new-widget': {
  id: 'new-widget',
  label: 'My New Widget',
  labelTh: 'วิดเจ็ตใหม่',
  category: 'chart',
  component: dynamic(
    () => import('../widgets/charts/NewSharedChart')
      .then(m => ({ default: m.NewSharedChart })),
    { loading: SkeletonChart, ssr: false },
  ),
  dataKeys: ['summary'],
},
```

### 4. เพิ่ม Section ใน Dashboard ของ role

เพิ่มใน `registry/dashboard-registry.ts`:
```typescript
rector: {
  sections: [
    ...existing,
    { id: 'new-widget', defaultVisible: true, order: 8, span: 'half' },
  ],
},
```

### 5. สร้าง Dashboard ใหม่ทั้ง Role

```bash
# 1. สร้างโฟลเดอร์
mkdir -p src/features/dashboard/new-role/{components,hooks}

# 2. สร้าง Dashboard component
```

```tsx
// new-role/components/NewRoleDashboard.tsx
"use client";
import { DashboardShell } from '../../widgets/shell/DashboardShell';

export function NewRoleDashboard() {
  return <DashboardShell role="new-role" />;
}
```

```bash
# 3. เพิ่ม config ใน registry/ (3 ไฟล์)
#    - dashboard-registry.ts → เพิ่ม entry
#    - filter-config.ts → เพิ่ม entry
#    - widget-catalog.tsx → register widget ถ้ามีตัวใหม่
```

---

## 🔀 Default vs Dynamic Mode

```typescript
// registry/dashboard-registry.ts

// DEFAULT: layout ตายตัว — ผู้ใช้ดูอย่างเดียว
rector: { mode: 'default', sections: [...] }

// DYNAMIC: ผู้ใช้ toggle widget on/off ได้
'super-admin': { mode: 'dynamic', sections: [...] }
```

- **Default** → sections ที่ `defaultVisible: true` จะแสดงเสมอ
- **Dynamic** → แสดง toggle panel ให้ user เลือก, เก็บใน localStorage

---

## 🚫 ข้อห้าม

1. **อย่าแก้ `widgets/` เพื่อ role เดียว** → สร้างใน `{role}/components/` แทน
2. **อย่า hardcode filter** → เพิ่มใน `filter-config.ts` เท่านั้น
3. **อย่า import ข้าม role** → เช่น dean import จาก rector (ใช้ widgets/ แทน)
4. **Chart ใหม่ต้อง register** → เพิ่มใน `widget-catalog.tsx` ก่อนใช้ใน DashboardShell

---

## 📂 ถ้าจะแก้ไฟล์ ดูตารางนี้

| ต้องการทำอะไร | แก้ไฟล์ไหน |
|--------------|-----------|
| เพิ่ม/ลด filter | `registry/filter-config.ts` |
| เปลี่ยน layout (ลำดับ section) | `registry/dashboard-registry.ts` |
| สร้าง chart ใหม่ (shared) | `widgets/charts/` + `registry/widget-catalog.tsx` |
| สร้าง chart ใหม่ (role เดียว) | `{role}/components/` + `registry/widget-catalog.tsx` |
| เปลี่ยน mode Default↔Dynamic | `registry/dashboard-registry.ts` → `mode` |
| แก้ API/query | `src/services/dashboards/` |
| แก้ types | `widgets/types/analytics-types.ts` |
