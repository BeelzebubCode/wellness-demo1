// prisma/seeds/07-students.ts
import {
  PrismaClient,
  AccountRole,
  StudentGender,
  StudentAddressType,
} from "@prisma/client";

import { randomBool, randomInt, randomItem } from "../seed-utils/rand";
import { randomPerson } from "../seed-data/people";

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

  // =========================
  // Config
  // =========================
  const PER_UNI = 120;
  console.log(`🎓 Upserting students (${PER_UNI} per university)...`);

  const YEAR_BUCKETS: Array<{ year: number; count: number }> = [
    { year: 2568, count: 30 },
    { year: 2567, count: 30 },
    { year: 2566, count: 30 },
    { year: 2565, count: 30 }, // รวม = 120
  ];

  function admitYearForIdx(idx0: number) {
    let acc = 0;
    for (const b of YEAR_BUCKETS) {
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

  const students: any[] = [];

  // =========================
  // Main loop: per university
  // =========================
  const sortedUnis = [...universities].sort((a, b) => a.university_id - b.university_id);

  for (let uIdx = 0; uIdx < sortedUnis.length; uIdx++) {
    const uni = sortedUnis[uIdx];
    const uniIndex1based = uIdx + 1;

    const uniCode = String(uni.university_code);
    const uniCodeLower = uniCode.toLowerCase();

    // ✅ pool ต่อมหาลัย
    const uniDeptList = deptList.filter((d) => d.university_id === uni.university_id);

    // ✅ FIX: ถ้าไม่มี dept ของมหาลัยนี้ → ข้ามทั้งมหาลัย (กัน FK พัง)
    if (uniDeptList.length === 0) {
      console.log(
        `⚠️  Skip ${uniCode} (uni_id=${uni.university_id}) because no departments seeded for this university.`,
      );
      continue;
    }

    for (let j = 1; j <= PER_UNI; j++) {
      const idx0 = j - 1;

      const username = `stu_${uniCodeLower}_${String(j).padStart(2, "0")}`;

      const person = randomPerson();
      const hasEn = Math.random() < 0.6;

      const fnameTh = person.first.th;
      const lnameTh = person.last.th;
      const nickTh = person.nickname.th;

      const fnameEn = hasEn ? person.first.en : null;
      const lnameEn = hasEn ? person.last.en : null;
      const nickEn = hasEn ? person.nickname.en : null;

      const gender = randomItem(Object.values(StudentGender));

      const lineId = `U_${uniCode}_${uni.university_id}_${String(j).padStart(2, "0")}`;
      const admitYear = admitYearForIdx(idx0);

      const acc = await prisma.account.upsert({
        where: { account_username: username },
        create: {
          account_username: username,
          account_password: passwordHash,
          account_role: AccountRole.STUDENT,
          account_line_id: lineId,
          account_home_university_id: uni.university_id,
        },
        update: {
          account_password: passwordHash,
          account_role: AccountRole.STUDENT,
          account_line_id: lineId,
          account_home_university_id: uni.university_id,
        },
      });

      const student = await prisma.student.upsert({
        where: { account_id: acc.account_id },
        create: {
          account_id: acc.account_id,
          university_id: uni.university_id,
          student_status_id:
            j % 10 === 0 ? statusInactive.student_status_id : statusActive.student_status_id,
          student_code: buildStudentCode(admitYear, uniIndex1based, j),
        },
        update: {
          university_id: uni.university_id,
          student_status_id:
            j % 10 === 0 ? statusInactive.student_status_id : statusActive.student_status_id,
          student_code: buildStudentCode(admitYear, uniIndex1based, j),
        },
      });

      await prisma.studentProfile.upsert({
        where: { student_id: student.student_id },
        create: {
          student_id: student.student_id,
          university_id: uni.university_id,

          student_prefix: randomItem(["นาย", "นางสาว", "นาง"]) as any,
          student_first_name_th: fnameTh,
          student_last_name_th: lnameTh,
          student_nickname_th: nickTh,

          student_first_name_en: fnameEn,
          student_last_name_en: lnameEn,
          student_nickname_en: nickEn,

          student_gender: gender,
          student_birthday: new Date(
            `200${randomInt(2, 6)}-${randomInt(1, 12)}-${randomInt(1, 28)}`,
          ),
          student_phone_number: `08${randomInt(10000000, 99999999)}`,
          student_email: `${username}@${uniCodeLower}.ac.th`,
        },
        update: {
          university_id: uni.university_id,
          student_email: `${username}@${uniCodeLower}.ac.th`,
        },
      });

      // =========================
      // Department + Advisor
      // ✅ FIX: เลือกเฉพาะ dept ของมหาลัยนี้เท่านั้น
      // =========================
      const dep = uniDeptList[idx0 % uniDeptList.length];

      const advisor = advisors.find(
        (a) => a.university_id === uni.university_id && a.department_id === dep.department_id,
      );

      await prisma.studentAcademic.upsert({
        where: { student_id: student.student_id },
        create: {
          student_id: student.student_id,
          university_id: uni.university_id,
          faculty_id: dep.faculty_id,
          department_id: dep.department_id,
          advisor_id: advisor?.advisor_id ?? null,

          student_program: randomBool(0.2) ? "International Program" : "Regular Program",
          student_degree: "Bachelor",
          student_degree_name: "Bachelor Degree",
          student_admit_academic_year: admitYear,
        },
        update: {
          university_id: uni.university_id,
          faculty_id: dep.faculty_id,
          department_id: dep.department_id,
          advisor_id: advisor?.advisor_id ?? null,

          student_program: randomBool(0.2) ? "International Program" : "Regular Program",
          student_degree: "Bachelor",
          student_degree_name: "Bachelor Degree",
          student_admit_academic_year: admitYear,
        },
      });

      // =========================
      // Addresses
      // =========================
      const addressDetail = `เลขที่ ${randomInt(1, 99)}/${randomInt(1, 99)}`;
      const postal = `${randomInt(10000, 99999)}`;

      const provCurrent = pickCurrentProvinceForUni(uni);
      const provHome = pickHomeProvinceForUni(uni);

      await prisma.studentAddress.upsert({
        where: {
          university_id_student_id_student_address_type: {
            university_id: uni.university_id,
            student_id: student.student_id,
            student_address_type: StudentAddressType.CURRENT,
          },
        },
        create: {
          university_id: uni.university_id,
          student_id: student.student_id,
          student_address_type: StudentAddressType.CURRENT,
          province_id: provCurrent.province_id,
          student_address_detail: addressDetail,
          student_address_district: "เมือง",
          student_address_sub_district: "ในเมือง",
          student_address_postal_code: postal,
        },
        update: {
          province_id: provCurrent.province_id,
          student_address_detail: addressDetail,
          student_address_postal_code: postal,
        },
      });

      await prisma.studentAddress.upsert({
        where: {
          university_id_student_id_student_address_type: {
            university_id: uni.university_id,
            student_id: student.student_id,
            student_address_type: StudentAddressType.PERMANENT,
          },
        },
        create: {
          university_id: uni.university_id,
          student_id: student.student_id,
          student_address_type: StudentAddressType.PERMANENT,
          province_id: provHome.province_id,
          student_address_detail: `บ้าน ${addressDetail}`,
          student_address_district: "อำเภอ",
          student_address_sub_district: "ตำบล",
          student_address_postal_code: `${randomInt(10000, 99999)}`,
        },
        update: {
          province_id: provHome.province_id,
          student_address_detail: `บ้าน ${addressDetail}`,
        },
      });

      await prisma.studentPointWallet.upsert({
        where: {
          university_id_student_id: {
            university_id: uni.university_id,
            student_id: student.student_id,
          },
        },
        create: {
          university_id: uni.university_id,
          student_id: student.student_id,
          student_point_balance: 0,
        },
        update: {},
      });

      students.push(student);
    }

    console.log(`✅ Seeded students for ${uniCode}: ${PER_UNI}`);
  }

  console.log(`🎉 Total students ensured: ${students.length}`);
  return students;
}
