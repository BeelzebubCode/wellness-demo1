// prisma/seeds/07-students.ts
import {
  PrismaClient,
  AccountRole,
  StudentGender,
  StudentAddressType,
} from "@prisma/client";

import { randomBool, randomInt, randomItem } from "../seed-utils/rand";
import { firstNames, lastNames, nicknames } from "../seed-data/people";

export async function seedStudents(
  prisma: PrismaClient,
  args: {
    universities: any[];
    provinces: any[]; // Province[] from seedGeo (must include province_code, province_id)
    deptList: any[]; // departments from acad (must include university_id, department_id, faculty_id)
    advisors: any[]; // advisors list
    statusActive: any;
    statusInactive: any;
    passwordHash: string;
  },
) {
  console.log("🎓 Upserting students...");

  const {
    universities,
    provinces,
    deptList,
    advisors,
    statusActive,
    statusInactive,
    passwordHash,
  } = args;

  const students: any[] = [];

  // =========================
  // Config
  // =========================
  const TOTAL_STUDENTS = 120;
  const BASE_EXISTING = 20;

  const YEAR_BUCKETS: Array<{ year: number; count: number }> = [
    { year: 2568, count: 25 },
    { year: 2567, count: 25 },
    { year: 2566, count: 25 },
    { year: 2565, count: 25 },
  ];

  function admitYearForNewStudent(newIdx0to99: number) {
    let acc = 0;
    for (const b of YEAR_BUCKETS) {
      acc += b.count;
      if (newIdx0to99 < acc) return b.year;
    }
    return 2566;
  }

  function buildStudentCode(admitYear: number, seq: number) {
    const yy = String(admitYear).slice(-2);
    return `${yy}${String(1000 + seq)}`;
  }

  // =========================
  // Province pools (bias ตามมหาลัย)
  // =========================
  // ใช้ province_code ที่อยู่ใน provinces table (seed มาจาก provincesData)
  const PROV_POOL = {
    NU: ["PHS", "CNX", "LPG", "UTT", "NPT", "AYA", "SPB", "BKK"],
    KKU: ["KKN", "UDN", "UBN", "NRM"],
    CU: ["BKK", "AYA", "NPT", "SPB", "CBI", "RYG"],
    OTHER: [] as string[],
  } as const;

  function pickProvinceFromCodes(codes: readonly string[]) {
    const list = provinces.filter((p) => codes.includes(p.province_code));
    return list.length ? randomItem(list) : randomItem(provinces);
  }

  function pickCurrentProvinceForUni(uniCode: string) {
    if (uniCode === "KKU") return pickProvinceFromCodes(PROV_POOL.KKU);
    if (uniCode === "CU") return pickProvinceFromCodes(PROV_POOL.CU);
    if (uniCode === "NU") return pickProvinceFromCodes(PROV_POOL.NU);
    return randomItem(provinces);
  }

  function pickHomeProvinceForUni(uniCode: string) {
    // บ้านเกิดกระจายกว้างกว่า current แต่ยัง bias ตามมหาลัย
    if (uniCode === "KKU") {
      return Math.random() < 0.75
        ? pickProvinceFromCodes(PROV_POOL.KKU)
        : randomItem(provinces);
    }
    if (uniCode === "CU") {
      return Math.random() < 0.65
        ? pickProvinceFromCodes(PROV_POOL.CU)
        : randomItem(provinces);
    }
    if (uniCode === "NU") {
      return Math.random() < 0.65
        ? pickProvinceFromCodes(PROV_POOL.NU)
        : randomItem(provinces);
    }
    return randomItem(provinces);
  }

  // =========================
  // University helpers
  // =========================
  const uniNU = universities.find((u) => u.university_code === "NU") ?? universities[0];
  const uniKKU = universities.find((u) => u.university_code === "KKU") ?? universities[0];
  const uniCU = universities.find((u) => u.university_code === "CU") ?? universities[0];

  // =========================
  // Main loop
  // =========================
  for (let i = 1; i <= TOTAL_STUDENTS; i++) {
    const username = `student${i}`;
    const fname = randomItem(firstNames);
    const lname = randomItem(lastNames);
    const gender = randomItem(Object.values(StudentGender));
    const lineId = `U_MOCK_${1000000000 + i}`;

    // กระจายมหาลัยแบบเดิม: 1..20 => 8 NU, 6 KKU, 6 CU
    // 21..120 round-robin
    let uni = uniCU;
    if (i <= 8) uni = uniNU;
    else if (i <= 14) uni = uniKKU;
    else if (i <= 20) uni = uniCU;
    else {
      const r = (i - 21) % 3;
      uni = r === 0 ? uniNU : r === 1 ? uniKKU : uniCU;
    }

    const admitYear =
      i <= BASE_EXISTING ? 2566 : admitYearForNewStudent(i - (BASE_EXISTING + 1));

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
        student_status_id: i % 10 === 0
          ? statusInactive.student_status_id
          : statusActive.student_status_id,
        student_code: buildStudentCode(admitYear, i),
      },
      update: {
        university_id: uni.university_id,
        student_status_id: i % 10 === 0
          ? statusInactive.student_status_id
          : statusActive.student_status_id,
        student_code: buildStudentCode(admitYear, i),
      },
    });

    await prisma.studentProfile.upsert({
      where: { student_id: student.student_id },
      create: {
        student_id: student.student_id,
        student_first_name: fname,
        student_last_name: lname,
        student_nickname: randomItem(nicknames),
        student_gender: gender,
        student_birthday: new Date(
          `200${randomInt(2, 6)}-${randomInt(1, 12)}-${randomInt(1, 28)}`,
        ),
        student_phone_number: `08${randomInt(10000000, 99999999)}`,
        student_email: `${username}@${String(uni.university_code).toLowerCase()}.ac.th`,
        student_prefix: randomItem(["นาย", "นางสาว", "นาง"]) as any,
      },
      update: {
        student_email: `${username}@${String(uni.university_code).toLowerCase()}.ac.th`,
      },
    });

    // =========================
    // Department (กัน dep ว่างแล้วพัง)
    // =========================
    const uniDeptList = deptList.filter((d) => d.university_id === uni.university_id);
    const dep = uniDeptList.length
      ? uniDeptList[(i - 1) % uniDeptList.length]
      : randomItem(deptList); // fallback กัน schema Int พัง

    const advisor = advisors.find(
      (a) => a.university_id === uni.university_id && a.department_id === dep.department_id,
    );

    await prisma.studentAcademic.upsert({
      where: { student_id: student.student_id },
      create: {
        student_id: student.student_id,
        faculty_id: dep.faculty_id,
        department_id: dep.department_id,
        advisor_id: advisor?.advisor_id ?? null,
        student_program: randomBool(0.2) ? "International Program" : "Regular Program",
        student_degree: "Bachelor",
        student_degree_name: "Bachelor Degree",
        student_admit_academic_year: admitYear,
      },
      update: {
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
    // Addresses (bias ตามมหาลัย)
    // =========================
    const addressDetail = `เลขที่ ${randomInt(1, 99)}/${randomInt(1, 99)}`;
    const postal = `${randomInt(10000, 99999)}`;

    const uniCode = String(uni.university_code);
    const provCurrent = pickCurrentProvinceForUni(uniCode);
    const provHome = pickHomeProvinceForUni(uniCode);

    await prisma.studentAddress.upsert({
      where: {
        student_id_student_address_type: {
          student_id: student.student_id,
          student_address_type: StudentAddressType.CURRENT,
        },
      },
      create: {
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
        student_id_student_address_type: {
          student_id: student.student_id,
          student_address_type: StudentAddressType.PERMANENT,
        },
      },
      create: {
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
      where: { student_id: student.student_id },
      create: { student_id: student.student_id, student_point_balance: 0 },
      update: {},
    });

    students.push(student);
  }

  return students;
}
