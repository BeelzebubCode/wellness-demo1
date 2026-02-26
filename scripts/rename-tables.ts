// scripts/rename-tables.ts — Rename 3 PostgreSQL tables to match Prisma model names
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔄 Renaming PostgreSQL tables to match Prisma model names...\n');

    // 1. account_university_access → account_university_permission
    console.log('   [1/3] account_university_access → account_university_permission');
    await prisma.$executeRawUnsafe(`ALTER TABLE account_university_access RENAME TO account_university_permission`);
    await prisma.$executeRawUnsafe(`ALTER TABLE account_university_permission RENAME COLUMN account_university_access_id TO account_university_permission_id`);
    console.log('         ✅ Done');

    // 2. education_field_group → subject_group_category
    console.log('   [2/3] education_field_group → subject_group_category');
    await prisma.$executeRawUnsafe(`ALTER TABLE education_field_group RENAME TO subject_group_category`);
    await prisma.$executeRawUnsafe(`ALTER TABLE subject_group_category RENAME COLUMN education_field_group_id TO subject_group_category_id`);
    // Also rename the FK column in faculty table
    await prisma.$executeRawUnsafe(`ALTER TABLE faculty RENAME COLUMN education_field_group_id TO subject_group_category_id`);
    console.log('         ✅ Done');

    // 3. booking_consent_signature → booking_agreement_signature
    console.log('   [3/3] booking_consent_signature → booking_agreement_signature');
    await prisma.$executeRawUnsafe(`ALTER TABLE booking_consent_signature RENAME TO booking_agreement_signature`);
    await prisma.$executeRawUnsafe(`ALTER TABLE booking_agreement_signature RENAME COLUMN booking_consent_signature_id TO booking_agreement_signature_id`);
    console.log('         ✅ Done');

    console.log('\n✅ All tables renamed successfully!');
}

main()
    .catch((e) => { console.error('❌ Error:', e); process.exit(1); })
    .finally(async () => { await prisma.$disconnect(); });
