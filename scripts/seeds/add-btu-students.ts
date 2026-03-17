// scripts/add-btu-students.ts
// Add ~8000 students to BTU (university_id=59) using raw SQL for speed
// Then assign 2389 as international

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const BTU_ID = 59;
const TARGET_TOTAL = 8000;
const INTL_TARGET = 2389;

// Thai first names pool (100)
const FIRST_NAMES_TH = [
    "สมชาย", "สมศักดิ์", "วิชัย", "อาทิตย์", "เดชา", "พิชัย", "ณรงค์", "ธงชัย", "อุดม", "ชัยวัฒน์",
    "เอกชัย", "อิสระ", "ศุภชัย", "ธีรพงศ์", "วสันต์", "มานพ", "ศักดา", "พงษ์ศักดิ์", "ณัฐพงษ์", "จิรวัฒน์",
    "กันตพัฒน์", "กิตติศักดิ์", "กฤตเมธ", "วรพจน์", "ปณิธาน", "ธนกร", "ภัทรพล", "จิรภัทร", "ศุภวิชญ์", "พัสกร",
    "พีรพัฒน์", "ภาคิน", "ณัฐกร", "สิรวิชญ์", "ธีรเดช", "ศิวกร", "พชร", "กลวัชร", "ชยพัทธ์", "ณภัทร",
    "ธีรภัทร", "พิริยะ", "สิปปกร", "อัครา", "ชินวัตร", "ดนุพล", "วิษณุ", "สุขเกษม", "ภูมิพัฒน์", "ธัญเทพ",
    "สมหญิง", "สุภาพร", "วิภาดา", "อรทัย", "พัชรา", "จันทร์เพ็ญ", "สุวรรณา", "กัญญา", "มาลี", "สุดา",
    "ประภาพร", "นภาพร", "วราภรณ์", "กนกวรรณ", "ศิริพร", "พรรณิภา", "วรรณา", "สุภัสสร", "ธิดารัตน์", "อังศนา",
    "พิมพ์ชนก", "ณิชา", "ศิริน", "อภิญญา", "ชนลดา", "หทัยรัตน์", "จุฑามาศ", "ลลิตา", "นพรัตน์", "รัชนี",
    "ศศิธร", "สุพรรษา", "ธัญญารัตน์", "ปวีณา", "วรรณวิสา", "เกศินี", "กัลยา", "ภัทราพร", "มนัสนันท์", "ขวัญใจ",
    "ณัฐธิดา", "ชนิดา", "สาวิตรี", "ปาริฉัตร", "รวิสรา", "ศิริลักษณ์", "อัจฉรา", "กานต์ธิดา", "ชลธิชา", "อินทิรา",
];

const LAST_NAMES_TH = [
    "ใจดี", "มีวงศ์", "รักชาติ", "สุขใจ", "มั่นใจ", "คงทอง", "ศรีสุข", "วงศา", "ปัญญา", "แก้วตา",
    "ทองคำ", "ดวงดี", "เพชรดี", "เงินงาม", "แก้วมณี", "ประเสริฐ", "มงคล", "สมบูรณ์", "วิไลลักษณ์", "ดีเลิศ",
    "พิทักษ์", "ชัยสิทธิ์", "สุขสวัสดิ์", "เพ็งพุ่ม", "จำปา", "หาญกล้า", "วิเชียร", "อุทัย", "ศรีวิชัย", "ธรรมรัตน์",
    "รุ่งเรือง", "สร้อยทอง", "ดาวรุ่ง", "แสงทอง", "ผาสุก", "แสนสุข", "บัวทอง", "กองแก้ว", "เรืองศรี", "ถาวรกุล",
    "พูนศิริ", "สุวรรณ", "จินดา", "ศรีโชค", "บุญโชค", "ไทยรัตน์", "เพ็ชรรัตน์", "มณีจันทร์", "ศรีรัตน์", "วรวรรณ",
    "ชัยเจริญ", "ศิริโชติ", "สมบัติ", "นิลเขต", "จินดามณี", "โชคชัย", "พันธุ์ทอง", "ยินดี", "สุขสันต์", "ทวีสุข",
    "พานิช", "สุทธิ", "ศรีธัญญา", "วังนาค", "อินทร์แปลง", "บุญตา", "สุขเพ็ง", "งามสวัสดิ์", "เกิดดี", "จำเริญ",
    "หลิว", "จัง", "ลี", "หวัง", "เฉิน", "หลิน", "เจิ้ง", "โจว", "อู๋", "ซุน",
    "ตัน", "แซ่ลิ้ม", "แซ่ตั้ง", "แซ่อึ้ง", "แซ่โค้ว", "แซ่เตีย", "แซ่ฮ้อ", "แซ่กัว", "แซ่เล้า", "แซ่เฮง",
    "ทากาฮาชิ", "ซูซูกิ", "ทานากะ", "ยามาโมโตะ", "สะโตะ", "คิม", "ปาร์ค", "ชาง", "เฮ็น", "ซม",
];

async function main() {
    console.log(`🏫 Adding ${TARGET_TOTAL} students to BTU (id=${BTU_ID})...\n`);

    // Get BTU departments
    const depts = await prisma.$queryRaw<any[]>`
    SELECT d.department_id, d.faculty_id FROM department d
    WHERE d.university_id = ${BTU_ID}
  `;
    console.log(`  ${depts.length} departments available`);

    // Get advisor for BTU
    const advisors = await prisma.$queryRaw<any[]>`
    SELECT advisor_id, department_id, faculty_id FROM advisor WHERE university_id = ${BTU_ID} LIMIT 50
  `;

    // Get existing student count for offset
    const existing = await prisma.$queryRaw<any[]>`SELECT COUNT(*)::int as cnt FROM student WHERE university_id = ${BTU_ID}`;
    const offset = existing[0].cnt;
    const toAdd = TARGET_TOTAL - offset;
    console.log(`  Existing: ${offset}, need to add: ${toAdd}`);

    if (toAdd <= 0) {
        console.log("  Already have enough students!");
        return;
    }

    // Get active/inactive status
    const statusActive = await prisma.studentStatus.findFirst({ where: { student_status_code: "ACTIVE" } });
    const statusGraduated = await prisma.studentStatus.findFirst({ where: { student_status_code: "GRADUATED" } });
    if (!statusActive || !statusGraduated) throw new Error("Missing status");

    // Get Thailand country
    const thCountry = await prisma.country.findFirst({ where: { country_code_alpha2: "TH" } });
    if (!thCountry) throw new Error("No TH country");

    // Get password hash from existing account
    const sampleAccount = await prisma.account.findFirst({ select: { account_password: true } });
    const pwHash = sampleAccount?.account_password || "$2b$10$placeholder";

    const BATCH = 2000;
    let totalInserted = 0;

    for (let batch = 0; batch < Math.ceil(toAdd / BATCH); batch++) {
        const batchStart = offset + batch * BATCH + 1;
        const batchSize = Math.min(BATCH, toAdd - batch * BATCH);

        // Build batch data
        const accounts: any[] = [];
        const students: any[] = [];
        const profiles: any[] = [];
        const academics: any[] = [];

        for (let i = 0; i < batchSize; i++) {
            const seq = batchStart + i;
            const username = `stu_bui_${String(seq).padStart(5, "0")}`;
            const fname = FIRST_NAMES_TH[seq % FIRST_NAMES_TH.length];
            const lname = LAST_NAMES_TH[Math.floor(seq / FIRST_NAMES_TH.length) % LAST_NAMES_TH.length];
            // Add numeric suffix for uniqueness
            const suffix = seq > FIRST_NAMES_TH.length * LAST_NAMES_TH.length ? String(Math.floor(seq / 1000)) : "";

            const dep = depts[seq % depts.length];
            const advisor = advisors.find(a => a.department_id === dep.department_id) || advisors[0];

            const admitYear = [2562, 2563, 2564, 2565, 2566, 2567, 2568][seq % 7];
            const isGraduated = admitYear <= 2564;
            const gender = seq % 3 === 0 ? "FEMALE" : "MALE";

            accounts.push({
                account_username: username,
                account_password: pwHash,
                account_role: "STUDENT",
                account_line_id: `U_BUI_59_${String(seq).padStart(5, "0")}`,
                account_home_university_id: BTU_ID,
            });

            students.push({
                username,
                university_id: BTU_ID,
                student_status_id: isGraduated ? statusGraduated.student_status_id : statusActive.student_status_id,
                student_code: `${String(admitYear).slice(-2)}59${String(seq).padStart(4, "0")}`,
            });

            profiles.push({
                username,
                university_id: BTU_ID,
                student_prefix: gender === "FEMALE" ? "นางสาว" : "นาย",
                student_first_name_th: fname,
                student_last_name_th: lname + suffix,
                student_nickname_th: null,
                student_gender: gender,
                student_birthday: new Date(`200${2 + (seq % 5)}-${1 + (seq % 12)}-${1 + (seq % 28)}`),
                student_phone_number: `08${10000000 + seq}`,
                student_email: `${username}@bui.ac.th`,
                country_id: thCountry.country_id,
                student_nationality: "ไทย",
                sibling_count: [1, 2, 2, 2, 3, 3, 2, 2, 1, 2][seq % 10],
                birth_order: 1,
                family_income_bracket: ["BETWEEN_100K_200K", "BETWEEN_200K_300K", "BETWEEN_300K_500K", "BETWEEN_200K_300K", "BETWEEN_100K_200K", "UNDER_100K", "BETWEEN_300K_500K", "BETWEEN_500K_800K", "BETWEEN_200K_300K", "BETWEEN_100K_200K"][seq % 10],
            });

            const duration = 4;
            academics.push({
                username,
                university_id: BTU_ID,
                faculty_id: dep.faculty_id,
                department_id: dep.department_id,
                advisor_id: advisor?.advisor_id || null,
                student_program: "Regular Program",
                student_degree: "Bachelor",
                student_degree_name: "Bachelor Degree",
                student_admit_academic_year: admitYear,
                education_level: "BACHELOR",
                program_duration_years: duration,
                expected_graduation_year: admitYear + duration,
            });
        }

        // Insert accounts
        await prisma.account.createMany({ data: accounts, skipDuplicates: true });

        // Get account IDs
        const accUsernames = accounts.map(a => a.account_username);
        const createdAccounts = await prisma.account.findMany({
            where: { account_username: { in: accUsernames } },
            select: { account_id: true, account_username: true },
        });
        const accMap = new Map(createdAccounts.map(a => [a.account_username, a.account_id]));

        // Insert students
        const studentData = students.map(s => ({
            account_id: accMap.get(s.username)!,
            university_id: s.university_id,
            student_status_id: s.student_status_id,
            student_code: s.student_code,
        }));
        await prisma.student.createMany({ data: studentData, skipDuplicates: true });

        // Get student IDs
        const accIds = createdAccounts.map(a => a.account_id);
        const createdStudents = await prisma.student.findMany({
            where: { account_id: { in: accIds } },
            select: { student_id: true, account_id: true, university_id: true },
        });
        const stuMap = new Map(createdStudents.map(s => [
            createdAccounts.find(a => a.account_id === s.account_id)?.account_username || "",
            s.student_id,
        ]));

        // Insert profiles
        const profileData = profiles.map(p => {
            const { username, ...rest } = p;
            return { student_id: stuMap.get(username)!, ...rest };
        });
        await prisma.studentProfile.createMany({ data: profileData, skipDuplicates: true });

        // Insert academics
        const acadData = academics.map(a => {
            const { username, ...rest } = a;
            return { student_id: stuMap.get(username)!, ...rest };
        });
        await prisma.studentAcademic.createMany({ data: acadData, skipDuplicates: true });

        totalInserted += batchSize;
        console.log(`  Batch ${batch + 1}: inserted ${totalInserted}/${toAdd}`);
    }

    // Verify
    const total = await prisma.$queryRaw<any[]>`SELECT COUNT(*)::int as cnt FROM student WHERE university_id = ${BTU_ID}`;
    console.log(`\n✅ BTU now has ${total[0].cnt} total students`);

    // ============================================
    // Now assign 2389 as international
    // ============================================
    console.log(`\n🌍 Assigning ${INTL_TARGET} international students...`);

    const intlCountries = [
        { id: 2, name: "จีน", pct: 0.60 },
        { id: 5, name: "เมียนมา", pct: 0.15 },
        { id: 7, name: "กัมพูชา", pct: 0.10 },
        { id: 6, name: "ลาว", pct: 0.05 },
        { id: 8, name: "เวียดนาม", pct: 0.05 },
        { id: 3, name: "ญี่ปุ่น", pct: 0.03 },
        { id: 4, name: "เกาหลี", pct: 0.02 },
    ];

    // Pick random students from BTU
    const randomStudents = await prisma.$queryRaw<any[]>`
    SELECT student_id FROM student_profile
    WHERE university_id = ${BTU_ID} AND country_id = ${thCountry.country_id}
    ORDER BY random() LIMIT ${INTL_TARGET}
  `;

    let idx = 0;
    for (const c of intlCountries) {
        const count = Math.round(INTL_TARGET * c.pct);
        const batch = randomStudents.slice(idx, idx + count).map((s: any) => s.student_id);
        if (batch.length > 0) {
            await prisma.$executeRaw`
        UPDATE student_profile
        SET country_id = ${c.id}, student_nationality = ${c.name}
        WHERE student_id = ANY(${batch}::int[]) AND university_id = ${BTU_ID}
      `;
        }
        idx += count;
    }

    // Set International Program
    await prisma.$executeRaw`
    UPDATE student_academic sa
    SET student_program = 'International Program'
    FROM student_profile sp
    WHERE sa.student_id = sp.student_id AND sa.university_id = sp.university_id
      AND sp.university_id = ${BTU_ID} AND sp.country_id != ${thCountry.country_id}
  `;

    // Fix income for intl
    await prisma.$executeRaw`
    UPDATE student_profile
    SET family_income_bracket = CASE
      WHEN random() < 0.08 THEN 'BETWEEN_300K_500K'::"FamilyIncomeBracket"
      WHEN random() < 0.30 THEN 'BETWEEN_500K_800K'::"FamilyIncomeBracket"
      WHEN random() < 0.60 THEN 'BETWEEN_800K_1M'::"FamilyIncomeBracket"
      ELSE 'OVER_1M'::"FamilyIncomeBracket"
    END
    WHERE university_id = ${BTU_ID} AND country_id != ${thCountry.country_id}
  `;

    // Final verify
    const intlCount = await prisma.$queryRaw<any[]>`
    SELECT c.country_name_en, COUNT(*)::int as cnt
    FROM student_profile sp JOIN country c ON sp.country_id = c.country_id
    WHERE sp.university_id = ${BTU_ID} AND c.nationality_type = 'INTERNATIONAL'
    GROUP BY c.country_name_en ORDER BY cnt DESC
  `;
    console.log("\nBTU international breakdown:");
    console.table(intlCount);

    const finalTotal = await prisma.$queryRaw<any[]>`
    SELECT 
      (SELECT COUNT(*)::int FROM student WHERE university_id = ${BTU_ID}) as total_students,
      (SELECT COUNT(*)::int FROM student_profile sp JOIN country c ON sp.country_id = c.country_id WHERE sp.university_id = ${BTU_ID} AND c.nationality_type = 'INTERNATIONAL') as intl_count
  `;
    console.log("BTU final:");
    console.table(finalTotal);

    await prisma.$disconnect();
}

main().catch(console.error);
