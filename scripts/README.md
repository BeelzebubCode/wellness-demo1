# Scripts Directory

## 📁 Active Seed Scripts

### Main Seed
- **`prisma/seed.ts`** - Main seed orchestrator (calls all sub-seeds)
  - Run: `npx prisma db seed`
  - Modes: SEED_QUICK_MODE, SEED_DEV_MODE, or full scale

### Supplementary Seeds
- **`seed-consultant-shifts.ts`** - Seed consultant 14-day shifts (run AFTER main seed)
  - Run: `npx tsx scripts/seed-consultant-shifts.ts`

## 🔍 Utility Scripts

- **`list-all-accounts.ts`** - List all seeded accounts by role
  - Run: `npx tsx scripts/list-all-accounts.ts`

- **`verify-seed-data.ts`** - Verify seed data integrity
  - Run: `npx tsx scripts/verify-seed-data.ts`

## 🗂️ Prisma Seeds Directory Structure

Located in: `prisma/seeds/`

**Execution Order:**
1. `00-clear.ts` - Clear database
2. `01-geo.ts` - Regions, provinces, universities
3. `02-static.ts` - Static data (status, organizations, templates)
4. `03-faculty.ts` - Faculties and departments
5. `04-advisor.ts` - Advisors
6. `05-accounts.ts` - Special accounts (head, rector, ministry, super)
7. `06-consultants.ts` - Consultants (5 per university)
8. `07-students.ts` - Students (configurable count)
9. `08-timeslots.ts` - Time slots
10. `09-bookings.ts` - Bookings
11. `10-university-types.ts` - University type classifications
12. `11-university-connections.ts` - University network connections
13. `12-manual-connections.ts` - Manual connection adjustments
14. `13-deans.ts` - Deans

## ⚙️ Seed Modes

### Quick Mode (100 students)
```bash
SEED_QUICK_MODE=true npx prisma db seed
```

### Dev Mode (30 students/uni)
```bash
SEED_DEV_MODE=true npx prisma db seed
```

### Full Scale (~1.8M students)
```bash
npx prisma db seed
```

## 🧹 Cleaned Up Files

The following obsolete files have been removed:
- ~~`check-dean-data.ts`~~ (debug script - no longer needed)
- ~~`debug-login.ts`~~ (debug script - no longer needed)
- ~~`fix-dean-data.ts`~~ (one-time fix - completed)
- ~~`list-deans.ts`~~ (use `list-all-accounts.ts` instead)
- ~~`list-students.ts`~~ (use `list-all-accounts.ts` instead)
- ~~`07-students-batch.ts`~~ (old version)
- ~~`07-students-original-backup.ts`~~ (backup - no longer needed)
