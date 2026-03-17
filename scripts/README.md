# 📁 Scripts Directory

โครงสร้าง scripts สำหรับ NU Wellness

```
scripts/
├── tests/       # 🧪 Test scripts (DB queries, AI engine, accuracy)
├── debug/       # 🐛 Debug scripts (login, bookings, slots)
├── seeds/       # 🌱 Seed & backfill data scripts
├── fixes/       # 🔧 One-off data fix scripts
├── verify/      # ✅ Verification & data audit scripts
├── deploy/      # 🚀 Deployment scripts
└── utils/       # 🛠️ Utility tools (CSV converter, SQL generators)
```

## วิธีใช้

```bash
# รัน test script
npx tsx scripts/tests/test-db-shifts.ts

# รัน seed script
npx tsx scripts/seeds/seed-7year-bookings.ts

# รัน verify script
npx tsx scripts/verify/check-advisors.ts
```
