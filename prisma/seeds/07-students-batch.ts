// prisma/seeds/07-students-batch.ts
// 🚀 OPTIMIZED VERSION: Uses batch inserts instead of individual upserts
// Expected performance: ~5-10 minutes for 2M records (vs hours with upserts)

import {
  PrismaClient,
  AccountRole,
  StudentGender,
  StudentAddressType,
} from "@prisma/client";

import { randomBool, randomInt, randomItem } from "../seed-utils/rand";
import { randomPerson } from "../seed-data/people";

import { getStudentCountForUniversity, DEFAULT_STUDENT_COUNT } from "../../src/lib/constants/university-student-counts";

const MAX_STUDENTS_PER_UNI = process.env.SEED_DEV_MODE === "true" ? 30 : 999999;
const BATCH_SIZE = 1000; // Insert 1000 records at a time

export async function seedStudents(
  prisma: PrismaClient,
  args: {
    universities: any[];
    provinces: any[];
    deptList: any[];
    advisors: any[];
    statusActive: any;
    statusInactive: any;
    passwordHash: string;
  },
) {
  const {
    universities,
    provinces,
    deptList,
    advisors,
    statusActive,
    statusInactive,
    passwordHash,
  } = args;

  console.log(`🎓 Seeding students with BATCH mode (fast!)...`);
  console.log(`   Default count: ${DEFAULT_STUDENT_COUNT} students`);
  console.log(`   Batch size: ${BATCH_SIZE} records per transaction`);

  function generateYearBuckets(totalCount: number): Array<{ year: number; count: number }> {
    const perYear = Math.floor(totalCount / 4);
    const remainder = totalCount % 4;
    
    return [
      { year: 2568, count: perYear + (remainder > 0 ? 1 : 0) },
      { year: 2567, count: perYear + (remainder > 1 ? 1 : 0) },
      { year: 2566, count: perYear + (remainder > 2 ? 1 : 0) },
      { year: 2565, count: perYear },
    ];
  }

  function admitYearForIdx(idx0: number, yearBuckets: Array<{ year: number; count: number }>) {
    let acc = 0;
    for (const b of yearBuckets) {
      acc += b.count;
      if (idx0 < acc) return b.year;
    }
    return 2566;
  }

  function buildStudentCode(admitYear: number, uniIndex1based: number, seq1based: number) {
    const yy = String(admitYear).slice(-2);
    const u2 = String(uniIndex1based).padStart(2, "0");
    const s3 = String(seq1based).padStart(3, "0");
    return `${yy}${u2}${s3}`;
  }

  function pickProvinceByCode(code?: string | null) {
    if (!code) return null;
    return provinces.find((p) => p.province_code === code) ?? null;
  }

  function pickCurrentProvinceForUni(uni: any) {
    const homeProv = pickProvinceByCode(uni.province_code);
    if (homeProv && Math.random() < 0.7) return homeProv;
    return randomItem(provinces);
  }

  function pickHomeProvinceForUni(uni: any) {
    const homeProv = pickProvinceByCode(uni.province_code);
    if (homeProv && Math.random() < 0.55) return homeProv;
    return randomItem(provinces);
  }

  const sortedUnis = [...universities].sort((a, b) => a.university_id - b.university_id);
  let totalStudentsSeeded = 0;

  for (let uIdx = 0; uIdx < sortedUnis.length; uIdx++) {
    const uni = sortedUnis[uIdx];
    const uniIndex1based = uIdx + 1;
    const uniCode = String(uni.university_code);
    const uniCodeLower = uniCode.toLowerCase();

    const rawCount = getStudentCountForUniversity(uniCode);
    const PER_UNI = Math.min(rawCount, MAX_STUDENTS_PER_UNI);
    
    if (PER_UNI === 0) {
      console.log(`⏭️  Skip ${uniCode}: configured to seed 0 students`);
      continue;
    }

    const uniDeptList = deptList.filter((d) => d.university_id === uni.university_id);

    if (uniDeptList.length === 0) {
      console.log(
        `⚠️  Skip ${uniCode} (uni_id=${uni.university_id}) because no departments seeded for this university.`,
      );
      continue;
    }

    const YEAR_BUCKETS = generateYearBuckets(PER_UNI);

    // 🔥 Build data arrays for batch insert
    const accountsData: any[] = [];
    const studentsData: any[] = [];
    const profilesData: any[] = [];
    const academicsData: any[] = [];
    const addressesCurrentData: any[] = [];
    const addressesPermanentData: any[] = [];
    const walletsData: any[] = [];

    console.log(`📦 Preparing ${PER_UNI} students for ${uniCode}...`);

    for (let j = 1; j <= PER_UNI; j++) {
      const idx0 = j - 1;
      const username = `stu_${uniCodeLower}_${String(j).padStart(4, "0")}`;
      const person = randomPerson();
      const hasEn = Math.random() < 0.6;

      const fnameTh = person.first.th;
      const lnameTh = person.last.th;
      const nickTh = person.nickname.th;

      const fnameEn = hasEn ? person.first.en : null;
      const lnameEn = hasEn ? person.last.en : null;
      const nickEn = hasEn ? person.nickname.en : null;

      const gender = randomItem(Object.values(StudentGender));
      const lineId = `U_${uniCode}_${uni.university_id}_${String(j).padStart(4, "0")}`;
      const admitYear = admitYearForIdx(idx0, YEAR_BUCKETS);

      const dep = uniDeptList[idx0 % uniDeptList.length];
      const advisor = advisors.find(
        (a) => a.university_id === uni.university_id && a.department_id === dep.department_id,
      );

      const provCurrent = pickCurrentProvinceForUni(uni);
      const provHome = pickHomeProvinceForUni(uni);

      const addressDetail = `เลขที่ ${randomInt(1, 99)}/${randomInt(1, 99)}`;
      const postal = `${randomInt(10000, 99999)}`;

      // Account data
      accountsData.push({
        account_username: username,
        account_password: passwordHash,
        account_role: AccountRole.STUDENT,
        account_line_id: lineId,
        account_home_university_id: uni.university_id,
      });

      // Student data (account_id will be filled after accounts are created)
      studentsData.push({
        username, // temp key
        university_id: uni.university_id,
        student_status_id: j % 10 === 0 ? statusInactive.student_status_id : statusActive.student_status_id,
        student_code: buildStudentCode(admitYear, uniIndex1based, j),
      });

      // Profile data
      profilesData.push({
        username, // temp key
        university_id: uni.university_id,
        student_prefix: randomItem(["นาย", "นางสาว", "นาง"]),
        student_first_name_th: fnameTh,
        student_last_name_th: lnameTh,
        student_nickname_th: nickTh,
        student_first_name_en: fnameEn,
        student_last_name_en: lnameEn,
        student_nickname_en: nickEn,
        student_gender: gender,
        student_birthday: new Date(`200${randomInt(2, 6)}-${randomInt(1, 12)}-${randomInt(1, 28)}`),
        student_phone_number: `08${randomInt(10000000, 99999999)}`,
        student_email: `${username}@${uniCodeLower}.ac.th`,
      });

      // Academic data
      academicsData.push({
        username, // temp key
        university_id: uni.university_id,
        faculty_id: dep.faculty_id,
        department_id: dep.department_id,
        advisor_id: advisor?.advisor_id ?? null,
        student_program: randomBool(0.2) ? "International Program" : "Regular Program",
        student_degree: "Bachelor",
        student_degree_name: "Bachelor Degree",
        student_admit_academic_year: admitYear,
      });

      // Address data (current)
      addressesCurrentData.push({
        username, // temp key
        university_id: uni.university_id,
        student_address_type: StudentAddressType.CURRENT,
        province_id: provCurrent.province_id,
        student_address_detail: addressDetail,
        student_address_district: "เมือง",
        student_address_sub_district: "ในเมือง",
        student_address_postal_code: postal,
      });

      // Address data (permanent)
      addressesPermanentData.push({
        username, // temp key
        university_id: uni.university_id,
        student_address_type: StudentAddressType.PERMANENT,
        province_id: provHome.province_id,
        student_address_detail: `บ้าน ${addressDetail}`,
        student_address_district: "อำเภอ",
        student_address_sub_district: "ตำบล",
        student_address_postal_code: `${randomInt(10000, 99999)}`,
      });

      // Wallet data
      walletsData.push({
        username, // temp key
        university_id: uni.university_id,
        student_point_balance: 0,
      });
    }

    // 🚀 Batch insert with progress tracking
    console.log(`💾 Inserting ${PER_UNI} students for ${uniCode}...`);

    // Step 1: Create accounts in batches
    const accountMap = new Map<string, number>();
    for (let i = 0; i < accountsData.length; i += BATCH_SIZE) {
      const batch = accountsData.slice(i, i + BATCH_SIZE);
      await prisma.account.createMany({
        data: batch,
        skipDuplicates: true,
      });
      
      // Fetch account IDs for this batch
      const usernames = batch.map(a => a.account_username);
      const accounts = await prisma.account.findMany({
        where: { account_username: { in: usernames } },
        select: { account_id: true, account_username: true },
      });
      
      accounts.forEach(acc => {
        accountMap.set(acc.account_username, acc.account_id);
      });

      if ((i + BATCH_SIZE) % 10000 === 0 || i + BATCH_SIZE >= accountsData.length) {
        console.log(`   ├─ Accounts: ${Math.min(i + BATCH_SIZE, accountsData.length)}/${accountsData.length}`);
      }
    }

    // Step 2: Create students in batches
    const studentMap = new Map<string, number>();
    const studentsWithAccounts = studentsData.map(s => ({
      account_id: accountMap.get(s.username)!,
      university_id: s.university_id,
      student_status_id: s.student_status_id,
      student_code: s.student_code,
      _username: s.username, // keep for later mapping
    }));

    for (let i = 0; i < studentsWithAccounts.length; i += BATCH_SIZE) {
      const batch = studentsWithAccounts.slice(i, i + BATCH_SIZE);
      const cleanBatch = batch.map(({ _username, ...rest }) => rest);
      
      await prisma.student.createMany({
        data: cleanBatch,
        skipDuplicates: true,
      });

      // Fetch student IDs for this batch
      const accountIds = batch.map(s => s.account_id);
      const students = await prisma.student.findMany({
        where: { account_id: { in: accountIds } },
        select: { student_id: true, account_id: true },
      });

      students.forEach(stu => {
        const username = batch.find(b => b.account_id === stu.account_id)?._username;
        if (username) {
          studentMap.set(username, stu.student_id);
        }
      });

      if ((i + BATCH_SIZE) % 10000 === 0 || i + BATCH_SIZE >= studentsWithAccounts.length) {
        console.log(`   ├─ Students: ${Math.min(i + BATCH_SIZE, studentsWithAccounts.length)}/${studentsWithAccounts.length}`);
      }
    }

    // Step 3-7: Create related records in batches
    const insertBatch = async (tableName: string, data: any[], createMany: any) => {
      const dataWithIds = data.map(item => {
        const { username, ...rest } = item;
        return {
          student_id: studentMap.get(username)!,
          ...rest,
        };
      });

      for (let i = 0; i < dataWithIds.length; i += BATCH_SIZE) {
        const batch = dataWithIds.slice(i, i + BATCH_SIZE);
        await createMany({
          data: batch,
          skipDuplicates: true,
        });

        if ((i + BATCH_SIZE) % 10000 === 0 || i + BATCH_SIZE >= dataWithIds.length) {
          console.log(`   ├─ ${tableName}: ${Math.min(i + BATCH_SIZE, dataWithIds.length)}/${dataWithIds.length}`);
        }
      }
    };

    await insertBatch("Profiles", profilesData, prisma.studentProfile.createMany.bind(prisma.studentProfile));
    await insertBatch("Academics", academicsData, prisma.studentAcademic.createMany.bind(prisma.studentAcademic));
    await insertBatch("Addresses (current)", addressesCurrentData, prisma.studentAddress.createMany.bind(prisma.studentAddress));
    await insertBatch("Addresses (permanent)", addressesPermanentData, prisma.studentAddress.createMany.bind(prisma.studentAddress));
    await insertBatch("Wallets", walletsData, prisma.studentPointWallet.createMany.bind(prisma.studentPointWallet));

    console.log(`✅ Seeded students for ${uniCode}: ${PER_UNI}`);
    totalStudentsSeeded += PER_UNI;
  }

  console.log(`🎉 Total students seeded: ${totalStudentsSeeded}`);
  return [];
}
