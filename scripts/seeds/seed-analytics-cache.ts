/**
 * Pre-compute common analytics from PostgreSQL and store in MongoDB
 * for instant QUICK_LOOKUP by the AI analyst.
 *
 * Run: npx tsx scripts/seed-analytics-cache.ts
 */
import { PrismaClient } from "@prisma/client";
import { MongoClient } from "mongodb";

const prisma = new PrismaClient();
const MONGO_URI = process.env.MONGODB_URI || "mongodb://mongoadmin:mongopassword@localhost:27017";

interface CacheEntry {
    lookup_key: string;
    title: string;
    payload: string;
    updated_at: Date;
}

async function main() {
    const mongo = new MongoClient(MONGO_URI);
    await mongo.connect();
    const db = mongo.db("wellness_ai_db");
    const col = db.collection("ai_knowledge_contexts");

    const entries: CacheEntry[] = [];
    const now = new Date();

    // Date range: last 1 year
    const dateFrom = new Date();
    dateFrom.setFullYear(dateFrom.getFullYear() - 1);
    const dateFromStr = dateFrom.toISOString().slice(0, 10);
    const dateToStr = now.toISOString().slice(0, 10);
    const dateLabel = `📅 ข้อมูลช่วง ${formatThaiDate(dateFrom)} - ${formatThaiDate(now)}`;

    console.log("🔄 Computing analytics cache...");
    console.log(`   Date range: ${dateFromStr} → ${dateToStr}`);

    // ══════════════════════════════════════════════════════════
    // 1. TOP_UNIVERSITIES — Top 20 universities by booking count
    // ══════════════════════════════════════════════════════════
    console.log("1️⃣  TOP_UNIVERSITIES...");
    const topUnis = await prisma.$queryRawUnsafe<any[]>(`
        WITH uni_counts AS (
            SELECT university_id, COUNT(*)::bigint AS booking_count
            FROM booking
            WHERE booking_created_at >= '${dateFromStr}' AND booking_created_at < '${dateToStr}'
            GROUP BY university_id
            ORDER BY booking_count DESC
            LIMIT 20
        )
        SELECT u.university_name_th, uc.booking_count
        FROM uni_counts uc
        JOIN university u ON u.university_id = uc.university_id
        ORDER BY uc.booking_count DESC
    `);

    let topUniPayload = `${dateLabel}\n\n### 🏆 Top 20 มหาวิทยาลัยที่มีการจองปรึกษามากสุด\n\n`;
    topUniPayload += `| อันดับ | มหาวิทยาลัย | จำนวนคิว |\n|---|---|---|\n`;
    topUnis.forEach((u, i) => {
        topUniPayload += `| ${i + 1} | **${u.university_name_th}** | ${Number(u.booking_count).toLocaleString()} |\n`;
    });
    entries.push({ lookup_key: "TOP_UNIVERSITIES", title: "Top 20 มหาวิทยาลัย", payload: topUniPayload, updated_at: now });

    // ══════════════════════════════════════════════════════════
    // 2. TOP_PROBLEMS — Top problem categories
    // ══════════════════════════════════════════════════════════
    console.log("2️⃣  TOP_PROBLEMS...");
    const topProblems = await prisma.$queryRawUnsafe<any[]>(`
        SELECT pc.problem_category_name_th, COUNT(*)::bigint AS booking_count
        FROM booking b
        JOIN problem_category pc ON pc.problem_category_id = b.problem_category_id
        WHERE b.booking_created_at >= '${dateFromStr}' AND b.booking_created_at < '${dateToStr}'
        GROUP BY pc.problem_category_name_th
        ORDER BY booking_count DESC
    `);

    let topProblemsPayload = `${dateLabel}\n\n### 📊 ประเภทปัญหาที่พบมากสุดในระบบ\n\n`;
    topProblemsPayload += `| อันดับ | ประเภทปัญหา | จำนวนคิว |\n|---|---|---|\n`;
    topProblems.forEach((p, i) => {
        topProblemsPayload += `| ${i + 1} | **${p.problem_category_name_th}** | ${Number(p.booking_count).toLocaleString()} |\n`;
    });
    entries.push({ lookup_key: "TOP_PROBLEMS", title: "ปัญหาที่พบมากสุด", payload: topProblemsPayload, updated_at: now });

    // ══════════════════════════════════════════════════════════
    // 3. REGIONAL_SUMMARY — Bookings by region
    // ══════════════════════════════════════════════════════════
    console.log("3️⃣  REGIONAL_SUMMARY...");
    const regional = await prisma.$queryRawUnsafe<any[]>(`
        SELECT r.region_name_th, COUNT(*)::bigint AS booking_count,
               COUNT(DISTINCT b.university_id)::bigint AS uni_count
        FROM booking b
        JOIN university u ON u.university_id = b.university_id
        JOIN province p ON p.province_id = u.province_id
        JOIN region r ON r.region_id = p.region_id
        WHERE b.booking_created_at >= '${dateFromStr}' AND b.booking_created_at < '${dateToStr}'
        GROUP BY r.region_name_th
        ORDER BY booking_count DESC
    `);

    let regionalPayload = `${dateLabel}\n\n### 🗺️ สถิติการจองปรึกษาตามภูมิภาค\n\n`;
    regionalPayload += `| อันดับ | ภูมิภาค | จำนวนมหาวิทยาลัย | จำนวนคิว |\n|---|---|---|---|\n`;
    regional.forEach((r, i) => {
        regionalPayload += `| ${i + 1} | **${r.region_name_th}** | ${Number(r.uni_count)} | ${Number(r.booking_count).toLocaleString()} |\n`;
    });
    entries.push({ lookup_key: "REGIONAL_SUMMARY", title: "สถิติตามภูมิภาค", payload: regionalPayload, updated_at: now });

    // ══════════════════════════════════════════════════════════
    // 4. TOP_STUDENTS — Top 20 students by booking count
    // ══════════════════════════════════════════════════════════
    console.log("4️⃣  TOP_STUDENTS...");
    const topStudents = await prisma.$queryRawUnsafe<any[]>(`
        WITH top_s AS (
            SELECT student_id, university_id, COUNT(*)::bigint AS booking_count
            FROM booking
            WHERE booking_created_at >= '${dateFromStr}' AND booking_created_at < '${dateToStr}'
            GROUP BY university_id, student_id
            ORDER BY booking_count DESC
            LIMIT 20
        )
        SELECT sp.student_first_name_th, sp.student_last_name_th,
               u.university_name_th, ts.booking_count
        FROM top_s ts
        JOIN student_profile sp ON sp.student_id = ts.student_id AND sp.university_id = ts.university_id
        JOIN university u ON u.university_id = ts.university_id
        ORDER BY ts.booking_count DESC
    `);

    let topStudentsPayload = `${dateLabel}\n\n### 🏆 Top 20 นิสิต/นักศึกษาที่จองปรึกษามากสุด\n\n`;
    topStudentsPayload += `| อันดับ | ชื่อ-นามสกุล | มหาวิทยาลัย | จำนวนคิว |\n|---|---|---|---|\n`;
    topStudents.forEach((s, i) => {
        topStudentsPayload += `| ${i + 1} | **${s.student_first_name_th} ${s.student_last_name_th}** | ${s.university_name_th} | ${Number(s.booking_count).toLocaleString()} |\n`;
    });
    entries.push({ lookup_key: "TOP_STUDENTS", title: "Top 20 นิสิต", payload: topStudentsPayload, updated_at: now });

    // ══════════════════════════════════════════════════════════
    // 5. BOOKING_STATUS_SUMMARY — Overall status breakdown
    // ══════════════════════════════════════════════════════════
    console.log("5️⃣  BOOKING_STATUS_SUMMARY...");
    const statuses = await prisma.$queryRawUnsafe<any[]>(`
        SELECT booking_status, COUNT(*)::bigint AS cnt
        FROM booking
        WHERE booking_created_at >= '${dateFromStr}' AND booking_created_at < '${dateToStr}'
        GROUP BY booking_status
        ORDER BY cnt DESC
    `);

    const statusMap: Record<string, string> = {
        "COMPLETED": "✅ เสร็จสิ้น",
        "CANCELLED": "❌ ยกเลิก",
        "PENDING_ASSIGNMENT": "⏳ รอจัดที่ปรึกษา",
        "ASSIGNED": "👤 จัดที่ปรึกษาแล้ว",
        "IN_PROGRESS": "🔄 กำลังปรึกษา",
    };
    const totalBookings = statuses.reduce((sum, s) => sum + Number(s.cnt), 0);

    let statusPayload = `${dateLabel}\n\n### 📊 สรุปสถานะการจองปรึกษาทั้งหมด\n\n`;
    statusPayload += `**จำนวนคิวทั้งหมด: ${totalBookings.toLocaleString()}**\n\n`;
    statusPayload += `| สถานะ | จำนวน | สัดส่วน |\n|---|---|---|\n`;
    statuses.forEach(s => {
        const label = statusMap[s.booking_status] || s.booking_status;
        const pct = ((Number(s.cnt) / totalBookings) * 100).toFixed(1);
        statusPayload += `| ${label} | ${Number(s.cnt).toLocaleString()} | ${pct}% |\n`;
    });
    entries.push({ lookup_key: "BOOKING_STATUS_SUMMARY", title: "สรุปสถานะ", payload: statusPayload, updated_at: now });

    // ══════════════════════════════════════════════════════════
    // 6. GENDER_SUMMARY — Bookings by gender
    // ══════════════════════════════════════════════════════════
    console.log("6️⃣  GENDER_SUMMARY...");
    const genders = await prisma.$queryRawUnsafe<any[]>(`
        SELECT sp.student_gender, COUNT(*)::bigint AS booking_count
        FROM booking b
        JOIN student_profile sp ON sp.student_id = b.student_id AND sp.university_id = b.university_id
        WHERE b.booking_created_at >= '${dateFromStr}' AND b.booking_created_at < '${dateToStr}'
        GROUP BY sp.student_gender
        ORDER BY booking_count DESC
    `);

    const genderMap: Record<string, string> = { "MALE": "👨 ชาย", "FEMALE": "👩 หญิง", "OTHER": "🌈 อื่นๆ" };
    let genderPayload = `${dateLabel}\n\n### 📊 สถิติการจองตามเพศ\n\n`;
    genderPayload += `| เพศ | จำนวนคิว |\n|---|---|\n`;
    genders.forEach(g => {
        genderPayload += `| ${genderMap[g.student_gender] || g.student_gender} | ${Number(g.booking_count).toLocaleString()} |\n`;
    });
    entries.push({ lookup_key: "GENDER_SUMMARY", title: "สถิติตามเพศ", payload: genderPayload, updated_at: now });

    // ══════════════════════════════════════════════════════════
    // Upsert all entries to MongoDB
    // ══════════════════════════════════════════════════════════
    console.log("\n💾 Saving to MongoDB...");
    for (const entry of entries) {
        await col.updateOne(
            { lookup_key: entry.lookup_key },
            { $set: entry },
            { upsert: true }
        );
        console.log(`   ✅ ${entry.lookup_key} (${entry.payload.length} chars)`);
    }

    console.log(`\n🎉 Done! ${entries.length} analytics cache entries saved.`);

    await prisma.$disconnect();
    await mongo.close();
    process.exit(0);
}

function formatThaiDate(date: Date): string {
    const months = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
    const thaiYear = date.getFullYear() + 543;
    return `${date.getDate()} ${months[date.getMonth()]} ${thaiYear}`;
}

main().catch(err => {
    console.error("Error:", err);
    process.exit(1);
});
