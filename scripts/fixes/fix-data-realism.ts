/**
 * fix-data-realism.ts
 * ──────────────────────────────────────────────────────────────
 * Data-Engineering script: ทำให้ข้อมูล wellness_db สมจริงขึ้น
 * รัน: npx tsx scripts/fixes/fix-data-realism.ts
 *
 * ข้อมูลใน DB จะ UPDATE in-place — ไม่ลบ ไม่สร้าง row ใหม่
 * (ยกเว้น season table ที่ INSERT + student_behavior_status)
 * ──────────────────────────────────────────────────────────────
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ═══════════════════════════════════════════════════════
// THAI NAME POOLS
// ═══════════════════════════════════════════════════════

const MALE_FIRST_NAMES = [
    "สมชาย", "วีรพงษ์", "ธนกร", "ณัฐพล", "กิตติพงษ์", "ประยุทธ์", "อนุชา", "วิชัย", "สุทธิพงษ์", "ชาญชัย",
    "พิชิต", "มนตรี", "สมบัติ", "ธีรยุทธ", "เกรียงศักดิ์", "ประสิทธิ์", "วรพล", "ณภัทร", "พีรพัฒน์", "จักรกฤษ",
    "อภิชาติ", "ภาณุวัฒน์", "กฤษฎา", "ธวัชชัย", "ศุภชัย", "อดิศร", "พงศ์เทพ", "นรินทร์", "สุรเดช", "ชัยวัฒน์",
    "ปฏิพัทธ์", "ภูวดล", "ศรัณย์", "ตรีภพ", "เจษฎา", "ณรงค์", "อำนาจ", "สิริชัย", "พิสิษฐ์", "วรวุฒิ",
    "ธนาธิป", "รัฐพล", "อัครพล", "ชนาธิป", "ยุทธนา", "กานต์", "สุวิทย์", "ธงชัย", "วีระศักดิ์", "ศักดิ์สิทธิ์"
];

const FEMALE_FIRST_NAMES = [
    "สุภาพร", "วรรณา", "นภาพร", "กัญญา", "สุดารัตน์", "จิราพร", "ศิริวรรณ", "มาลิน", "พิมพ์ลภัส", "อารียา",
    "ขวัญจิรา", "ปาริฉัตร", "ชลธิชา", "ธัญญา", "กมลชนก", "พรทิพย์", "ดวงใจ", "นฤมล", "อรทัย", "จุฑาทิพย์",
    "ปราณี", "สุกัญญา", "ลลิตา", "ภัทรวดี", "สิริมา", "ชนิกานต์", "ณัฐธิดา", "รุ่งนภา", "วาสนา", "เบญจมาศ",
    "กนกวรรณ", "ปวีณา", "ศศิธร", "จารุวรรณ", "สุนิสา", "ดาริกา", "อัจฉรา", "พัชรินทร์", "วิภา", "มณีรัตน์",
    "ธนพร", "สุชาดา", "กาญจนา", "นิตยา", "รัชนี", "อมรรัตน์", "ฐิติมา", "พิชญา", "ณัฐกานต์", "เพ็ญนภา"
];

const MALE_NICKNAMES = [
    "โอ๊ค", "เจ", "ก้อง", "บอล", "โจ้", "แบงค์", "เอก", "ฟลุ๊ค", "ต้น", "กัน",
    "เต้", "เอิร์ธ", "มาร์ค", "บีม", "ไอซ์", "ตี๋", "เต๋า", "ปอ", "โอม", "เน",
    "ฟิวส์", "ฟ้า", "ปาล์ม", "กร", "เจมส์", "เกม", "โด่ง", "แม็กซ์", "พี", "ยู"
];

const FEMALE_NICKNAMES = [
    "เมย์", "แพร", "ฝ้าย", "มิ้นท์", "หมิว", "นิ้ง", "ปิ่น", "อิ๋ง", "แอน", "จูน",
    "น้ำ", "พลอย", "บี", "ครีม", "ออม", "มุก", "เฟิร์น", "เกรซ", "ฟ้า", "ใบเตย",
    "เอม", "หญิง", "ตุ๊กตา", "แตงกวา", "ปูเป้", "แพท", "จอย", "ปอย", "กิ๊ฟ", "ไอซ์"
];

const THAI_LAST_NAMES = [
    "สุขสวัสดิ์", "ศรีวิชัย", "พงศ์พันธ์", "ธารทอง", "จันทร์เพ็ญ", "รัตนวงศ์", "แก้วมณี", "ชัยประเสริฐ", "วงศ์สกุล", "ภูมิพัฒน์",
    "เจริญศรี", "พิทักษ์ชัย", "อินทรารักษ์", "ศิลปสมบัติ", "ทวีสิน", "มงคลรัตน์", "ดิลกรัตน์", "ปัญญาดี", "วัฒนพงศ์", "นิลประเสริฐ",
    "ชนะกุล", "ลิ้มสุวรรณ", "เพชรรัตน์", "ทองเจริญ", "สมบูรณ์ชัย", "กิตติเดชา", "สิทธิชัย", "จิรภัทร", "เทียนศรี", "ภัทรพงศ์"
];

// ═══════════════════════════════════════════════════════
// KNOWN FEMALE/MALE NAME LISTS (for student fixes)
// ═══════════════════════════════════════════════════════

const KNOWN_FEMALE_NAMES = [
    "มาลี", "กุลวดี", "ปรียาภรณ์", "จุฬาลักษณ์", "สุกัญญา", "วิจิตรา", "วาสนา", "นงเยาว์", "ดวงใจ", "สุภาพร",
    "กัญญา", "พรทิพย์", "ศิริวรรณ", "อรทัย", "นฤมล", "จิราพร", "สุดารัตน์", "มณีรัตน์", "ลลิตา", "ชลธิชา",
    "ปาริฉัตร", "กมลชนก", "ปราณี", "นภาพร", "เบญจมาศ", "พัชรินทร์", "จารุวรรณ", "สุชาดา", "อัจฉรา", "ดาริกา",
    "กนกวรรณ", "ปวีณา", "ศศิธร", "นิตยา", "รัชนี", "ปิยธิดา", "มณฑาทิพย์", "วรรณวิสา", "จุฑามาศ", "กานต์ธิดา",
    "ชลิดา", "อารียา", "ชมพูนุช", "สุนิสา", "ขวัญจิรา", "จุฑาทิพย์", "ณัฐธิดา", "ชนิกานต์", "ภัทรวดี", "พิมพ์ลภัส",
    "รุ่งนภา", "สิริมา", "เพ็ญนภา", "ณัฐกานต์", "ฐิติมา", "ธนพร", "กาญจนา", "อมรรัตน์", "พิชญา", "วิภา",
    "มาลิน", "ชนลดา", "พรรณี", "สุประวีณ์", "ประทุม", "รวิสรา", "ศิริพร", "สุภาภรณ์", "ณัฐริกา", "อังศนา",
    "กัลยา", "พรรณราย", "ศรีนวล"
];

const KNOWN_MALE_NAMES = [
    "ธนวัฒน์", "ณัฐพงษ์", "กิตติ", "วิชัย", "ศักดา", "เอกชัย", "นิรันดร์", "ประสิทธิ์", "บุญเลิศ", "พิทักษ์",
    "วิโรจน์", "ภาณุมัส", "สราวุธ", "ธีรพงษ์", "เฉลิมชัย", "สมศักดิ์", "ประเสริฐ", "ปรีชา", "ณัฐวุฒิ", "จิรวัฒน์",
    "วัชรพล", "สุรชัย", "ธีรภัทร", "อรรถพล", "ดำรง", "จิรายุ", "วรพจน์", "อดิศร", "มานพ", "ภูมิพัฒน์",
    "เกรียงศักดิ์", "สมชาย", "อำนาจ", "สมบูรณ์", "กฤษฎา", "ธวัชชัย", "นพดล", "พฤกษ์", "สุริยา", "วุฒิ",
    "บุญยง", "วิทย์", "สรวิชญ์", "ดนุพล", "กมล", "ฤทธิ์", "ศิลป์", "ณัฐนันท์", "ชัยวัฒน์", "ถนอม",
    "โชติ", "เอกชัย", "อภิชาติ", "ธนกร"
];

// ═══════════════════════════════════════════════════════
// FEEDBACK COMMENT TEMPLATES (50+)
// ═══════════════════════════════════════════════════════

const FEEDBACK_COMMENTS = [
    "ครั้งแรกที่ใช้บริการ ประทับใจมาก จะมาอีก",
    "พี่ที่ปรึกษาเข้าใจปัญหาดีมาก รู้สึกสบายใจขึ้น",
    "บรรยากาศดี เป็นกันเอง ไม่กดดัน",
    "อยากให้เพิ่มช่วงเวลาให้คำปรึกษาช่วงเย็นด้วยครับ",
    "ดีมากค่ะ รู้สึกโล่งใจขึ้นมากเลย",
    "ขอบคุณที่รับฟังปัญหาโดยไม่ตัดสิน เป็นประสบการณ์ที่ดี",
    "ได้รับคำแนะนำที่ดีมากครับ/ค่ะ ขอบคุณมากๆ",
    "ขอบคุณครับ/ค่ะ สบายใจขึ้นมาก",
    "อยากให้มี session ยาวกว่านี้หน่อย 30 นาทีรู้สึกสั้นไป",
    "ได้เรียนรู้เทคนิคการจัดการเวลาที่ดีมาก จะลองไปใช้",
    // --- NEW TEMPLATES ---
    "รู้สึกดีที่มีคนรับฟัง ขอบคุณมากครับ",
    "ที่ปรึกษาใจดีมาก ทำให้กล้าเล่าปัญหาได้หมด",
    "ช่วยให้มองเห็นทางออกที่ไม่เคยคิดมาก่อน",
    "แนะนำเพื่อนมาใช้บริการด้วยครับ ดีมากจริงๆ",
    "รู้สึกว่าตัวเองไม่ได้อยู่คนเดียว มีคนเข้าใจ",
    "ขอบคุณที่ช่วยให้จัดการความเครียดได้ดีขึ้นค่ะ",
    "อยากให้มีคิวเพิ่มในช่วงก่อนสอบครับ คนเยอะมาก",
    "ที่ปรึกษาเป็นมืออาชีพมาก รู้สึกปลอดภัยในการพูดคุย",
    "ได้แง่คิดดีๆ กลับไป จะลองปรับเปลี่ยนพฤติกรรม",
    "อยากให้เปิดบริการวันเสาร์ด้วยค่ะ วันธรรมดาติดเรียน",
    "ครั้งนี้ดีกว่าครั้งก่อน ที่ปรึกษาเข้าใจบริบทมากขึ้น",
    "รู้สึกเบาใจขึ้นมากหลังได้คุย ขอบคุณนะคะ",
    "ประทับใจการรักษาความลับ ทำให้กล้าเปิดใจ",
    "อยากให้มีการติดตามผลหลังจากพบด้วยครับ",
    "เป็นบริการที่ดีมากของมหาวิทยาลัย ขอบคุณครับ",
    "ที่ปรึกษาช่วยให้เข้าใจตัวเองมากขึ้น",
    "อยากให้มีบริการออนไลน์มากขึ้นค่ะ สะดวกกว่า",
    "พอใจมาก จะนัดครั้งต่อไปเร็วๆ นี้",
    "ขอบคุณที่ให้กำลังใจ ทำให้มีแรงสู้ต่อครับ",
    "ห้องให้คำปรึกษาสะอาดดี บรรยากาศผ่อนคลาย",
    "ที่ปรึกษาตรงเวลา ไม่ต้องรอนาน ชอบมาก",
    "ได้วิธีรับมือกับความวิตกกังวลที่ใช้ได้จริง ขอบคุณค่ะ",
    "ครั้งแรกตื่นเต้นมาก แต่พอคุยแล้วรู้สึกสบาย",
    "สิ่งที่ได้จากการปรึกษาทำให้ความสัมพันธ์กับเพื่อนดีขึ้น",
    "ขอบคุณที่แนะนำแหล่งข้อมูลเพิ่มเติม มีประโยชน์มากค่ะ",
    "ที่ปรึกษาถามคำถามที่ทำให้คิดได้ลึกขึ้น เก่งมาก",
    "อยากให้ระบบจองง่ายกว่านี้หน่อยค่ะ แต่บริการดีมาก",
    "รู้สึกว่าชีวิตใน มหาลัย ดีขึ้นหลังจากเข้ารับคำปรึกษา",
    "ที่ปรึกษาไม่เร่ง ให้เวลาเราคิด ประทับใจมากครับ",
    "ช่วยจัดการเรื่องนอนไม่หลับได้ดีขึ้นจริงๆ",
    "ขอบคุณที่ทำให้กล้ายอมรับปัญหาของตัวเอง",
    "ดีใจที่มหาลัยมีบริการแบบนี้ให้นิสิต ฟรีด้วย",
    "ที่ปรึกษาใช้ภาษาที่เข้าใจง่าย ไม่ใช้ศัพท์ยากๆ",
    "แนะนำเพื่อนหลายคนแล้ว ทุกคนบอกว่าดี",
    "ขอบคุณที่ช่วยวางแผนอนาคตให้ชัดเจนขึ้นค่ะ",
    "ได้ลองฝึก Mindfulness ตอนนั้นเลย ดีมากครับ",
    "ที่ปรึกษามีเทคนิคช่วยจัดการอารมณ์ที่เวิร์คมาก",
    "อยากมีบริการแชทด้วยค่ะ บางทีไม่สะดวกโทร",
    "รับฟังปัญหาครอบครัวได้ดีมาก ไม่รู้สึกถูกตัดสิน",
    "เข้าใจว่าต้องใช้เวลาในการเปลี่ยนแปลง ขอบคุณที่อดทนค่ะ",
];

// ═══════════════════════════════════════════════════════
// BOOKING OUTCOME NOTE TEMPLATES (30+)
// ═══════════════════════════════════════════════════════

const OUTCOME_NOTES = [
    "นิสิตมีความเครียดสะสมจากการเรียน แนะนำเทคนิค Time Management และ Mindfulness",
    "ให้คำปรึกษาเชิงจิตวิทยา นิสิตมีอาการวิตกกังวลจากการนำเสนองาน ฝึก Relaxation Technique",
    "รับฟังปัญหาทั่วไป นิสิตมีภาวะเครียดสะสมจากช่วงสอบ แนะนำ Sleep Hygiene",
    "ปัญหาซึมเศร้าเล็กน้อย ให้คำปรึกษาเบื้องต้นและแนะนำแบบประเมิน PHQ-9",
    "มีปัญหาความสัมพันธ์กับเพื่อนร่วมห้อง ได้ใช้ CBT เบื้องต้นช่วยปรับมุมมอง",
    "นิสิตมีภาวะ Burnout จากกิจกรรมมากเกินไป แนะนำการจัดลำดับความสำคัญ",
    "กังวลเรื่องอนาคตการทำงาน แนะนำแหล่งข้อมูลฝึกงานและ Career Planning",
    "ปัญหาครอบครัว มีความขัดแย้งกับผู้ปกครองเรื่องทิศทางการเรียน ให้การ Support",
    // --- NEW ---
    "นิสิตมีอาการนอนไม่หลับ ร่วมกับความวิตกกังวล แนะนำ Progressive Muscle Relaxation",
    "ปัญหาการเงิน กังวลเรื่องค่าเทอม แนะนำช่องทางทุนการศึกษาและ กยศ.",
    "นิสิตถูกล้อเลียนในโซเชียลมีเดีย ให้การปรึกษาเรื่อง Cyberbullying และแนวทางรับมือ",
    "มีความกดดันจากผู้ปกครองเรื่องเกรด ช่วยปรับมุมมองและฝึก Assertive Communication",
    "มีอาการ Panic Attack ครั้งแรก อธิบายกลไกร่างกายและฝึก Grounding Technique",
    "นิสิตกำลังปรับตัวเข้ามหาลัยปีแรก มาจากต่างจังหวัด รู้สึกเหงาและโดดเดี่ยว",
    "เพิ่งเลิกกับแฟน มีอาการเศร้าและไม่มีสมาธิเรียน ใช้ Grief Counseling เบื้องต้น",
    "นิสิตสงสัยเรื่อง Sexual Identity ให้พื้นที่ปลอดภัยในการสำรวจตัวเอง",
    "ปัญหาการกินผิดปกติ (Binge Eating) แนะนำ Nutritionist และนัดติดตาม",
    "ร่างกายอ่อนเพลียจากโรคเรื้อรัง ส่งผลต่อการเรียน ช่วยวางแผน Academic Plan",
    "มีปัญหาสมาธิสั้น สงสัย ADHD แนะนำเข้าพบจิตแพทย์เพื่อประเมิน",
    "นิสิตรู้สึกไร้ค่า มีความคิดทำร้ายตัวเอง ประเมินความเสี่ยงและส่งต่อจิตแพทย์",
    "กังวลเรื่องการฝึกงาน ไม่มั่นใจในตัวเอง ฝึก Self-Efficacy และ Mock Interview",
    "ปัญหาการพนันออนไลน์ ให้ข้อมูลเรื่อง Gambling Addiction และแหล่งช่วยเหลือ",
    "นิสิตมีแรงกดดันจาก Social Comparison ในโซเชียล แนะนำ Digital Detox",
    "ปัญหาความขัดแย้งกับรูมเมท ฝึก Conflict Resolution Skills",
    "นิสิตเสียคนใกล้ชิดเมื่อเร็วๆ นี้ ให้ Bereavement Counseling",
    "มีแนวโน้มดื่มแอลกอฮอล์มากขึ้น ทำ AUDIT Screening และให้ Motivational Interviewing",
    "ปัญหาการสื่อสารกับอาจารย์ที่ปรึกษา ฝึก Communication Skills",
    "นิสิตย้ายจากหลักสูตรนานาชาติ มี Culture Shock ช่วยปรับตัว",
    "มีอาการ OCD เบื้องต้น แนะนำ Exposure Response Prevention และส่งต่อพิจารณา",
    "ปัญหาความสมบูรณ์แบบ (Perfectionism) ส่งผลต่อ Burnout ช่วยปรับ Mindset",
];

// ═══════════════════════════════════════════════════════
// BOOKING DETAIL TEMPLATES (25+)
// ═══════════════════════════════════════════════════════

const BOOKING_DETAILS = [
    "นอนไม่หลับ วิตกกังวลเรื่องสอบ",
    "มีปัญหาความสัมพันธ์กับเพื่อน",
    "รู้สึกหมดแรงจูงใจในการเรียน",
    "ต้องการปรึกษาเรื่องส่วนตัว/ครอบครัว",
    "กังวลเรื่องอนาคตและเส้นทางอาชีพ",
    "ปัญหาการปรับตัวในมหาวิทยาลัย",
    // --- NEW ---
    "เครียดเรื่องเกรดตกลง ไม่กล้าบอกผู้ปกครอง",
    "เพิ่งเลิกกับแฟน รู้สึกเศร้ามาก เรียนไม่ไหว",
    "ถูกเพื่อนร่วมห้องล้อเลียนบ่อยครั้ง",
    "มีปัญหาการเงิน จ่ายค่าหอไม่ไหว",
    "กังวลเรื่องฝึกงาน ไม่รู้จะเริ่มยังไง",
    "รู้สึกเหงามาก ไม่มีเพื่อนสนิทในมหาลัย",
    "นอนไม่หลับมาหลายวัน สมาธิเรียนลดลง",
    "ทะเลาะกับพ่อแม่เรื่องสาขาที่เรียน",
    "มีภาวะเครียดจากการทำวิจัย/วิทยานิพนธ์",
    "อยากปรึกษาเรื่องสุขภาพจิตทั่วไป",
    "สงสัยในตัวเอง ไม่แน่ใจเรื่องเพศวิถี",
    "ถูกกดดันจากกิจกรรมชมรมมากเกินไป",
    "มีอาการใจสั่น หายใจไม่ทัน ตอนก่อนสอบ",
    "คิดมากเกี่ยวกับอนาคต นอนไม่หลับทุกคืน",
    "ปัญหาด้านการเรียน เกรดตกลงทุกเทอม",
    "รู้สึกไม่มีคุณค่า อยากมีคนรับฟัง",
    "กังวลว่าตัวเองเป็นโรคซึมเศร้าหรือเปล่า",
    "ต้องการวางแผนการเรียนและเป้าหมายชีวิต",
    "พ่อแม่หย่ากัน ส่งผลกระทบต่อจิตใจ",
];

// ═══════════════════════════════════════════════════════
// OUTCOME NEXT-STEP TEMPLATES (15+)
// ═══════════════════════════════════════════════════════

const NEXT_STEPS = [
    "นัดติดตามผลในอีก 2 สัปดาห์",
    "แนะนำเข้าร่วมกลุ่มบำบัด (Group Therapy) รุ่นถัดไป",
    "ส่งต่อพบจิตแพทย์เพื่อประเมินเพิ่มเติม",
    "ให้นิสิตกลับไปลองปรับพฤติกรรมการนอน แล้วมารายงานผล",
    // --- NEW ---
    "นัดพบครั้งถัดไปในอีก 1 สัปดาห์เพื่อติดตามอาการ",
    "แนะนำพบ Nutritionist สำหรับปัญหาด้านการกิน",
    "ให้นิสิตลองฝึก Breathing Exercise ทุกวัน แล้วบันทึกผล",
    "ส่งต่อฝ่ายทุนการศึกษาเพื่อพิจารณาช่วยเหลือ",
    "นัดติดตามผลหลังสอบเสร็จ ประมาณ 3 สัปดาห์",
    "แนะนำเข้าร่วม Workshop การจัดการเวลาของมหาลัย",
    "ส่งต่ออาจารย์ที่ปรึกษาเพื่อวางแผนการเรียนร่วมกัน",
    "ไม่จำเป็นต้องนัดพบต่อ สามารถนัดใหม่ได้หากต้องการ",
    "นัดพบเดือนละครั้งเพื่อติดตามอาการระยะยาว",
    "แนะนำเข้าร่วมชมรมที่สนใจเพื่อขยายสังคม",
    "ส่งต่อ Career Center เพื่อวางแผนฝึกงาน",
];

// ═══════════════════════════════════════════════
// HELPER
// ═══════════════════════════════════════════════

function pick<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

function log(msg: string) {
    console.log(`[${new Date().toISOString().slice(11, 19)}] ${msg}`);
}

// ═══════════════════════════════════════════════
// FIX FUNCTIONS
// ═══════════════════════════════════════════════

async function fix1_consultantHeadNames() {
    log("Fix 1: Replacing 'Head' consultant names...");

    const heads = await prisma.$queryRawUnsafe<
        { consultant_id: number; consultant_gender: string | null }[]
    >(`SELECT consultant_id, consultant_gender FROM consultant_profile WHERE consultant_first_name LIKE 'Head%'`);

    for (const h of heads) {
        const isMale = h.consultant_gender === "MALE";
        const firstName = pick(isMale ? MALE_FIRST_NAMES : FEMALE_FIRST_NAMES);
        const lastName = pick(THAI_LAST_NAMES);
        const nickname = pick(isMale ? MALE_NICKNAMES : FEMALE_NICKNAMES);

        await prisma.$executeRawUnsafe(
            `UPDATE consultant_profile SET consultant_first_name = $1, consultant_last_name = $2, consultant_nickname = $3 WHERE consultant_id = $4`,
            firstName, lastName, nickname, h.consultant_id
        );
    }

    log(`  ✅ Updated ${heads.length} 'Head' consultants`);
}

async function fix2_consultantGenderNameMismatch() {
    log("Fix 2: Fixing consultant gender-name mismatches...");

    const maleSet = new Set(KNOWN_MALE_NAMES);
    const femaleSet = new Set(KNOWN_FEMALE_NAMES);

    // Fix females with male names → change name to match gender
    const femalesWithMaleNames = await prisma.$queryRawUnsafe<
        { consultant_id: number; consultant_first_name: string }[]
    >(`SELECT consultant_id, consultant_first_name FROM consultant_profile WHERE consultant_gender = 'FEMALE' AND consultant_prefix = 'นางสาว'`);

    let fixed = 0;
    for (const c of femalesWithMaleNames) {
        if (maleSet.has(c.consultant_first_name)) {
            const newName = pick(FEMALE_FIRST_NAMES);
            const newNickname = pick(FEMALE_NICKNAMES);
            await prisma.$executeRawUnsafe(
                `UPDATE consultant_profile SET consultant_first_name = $1, consultant_nickname = $2 WHERE consultant_id = $3`,
                newName, newNickname, c.consultant_id
            );
            fixed++;
        }
    }

    // Fix males with female names → change name to match gender
    const malesWithFemaleNames = await prisma.$queryRawUnsafe<
        { consultant_id: number; consultant_first_name: string }[]
    >(`SELECT consultant_id, consultant_first_name FROM consultant_profile WHERE consultant_gender = 'MALE' AND consultant_prefix = 'นาย'`);

    for (const c of malesWithFemaleNames) {
        if (femaleSet.has(c.consultant_first_name)) {
            const newName = pick(MALE_FIRST_NAMES);
            const newNickname = pick(MALE_NICKNAMES);
            await prisma.$executeRawUnsafe(
                `UPDATE consultant_profile SET consultant_first_name = $1, consultant_nickname = $2 WHERE consultant_id = $3`,
                newName, newNickname, c.consultant_id
            );
            fixed++;
        }
    }

    log(`  ✅ Fixed ${fixed} consultant gender-name mismatches`);
}

async function fix3_studentGenderNameMismatch() {
    log("Fix 3: Fixing student gender-name mismatches...");

    const femaleNamesList = KNOWN_FEMALE_NAMES.map(n => `'${n}'`).join(",");
    const maleNamesList = KNOWN_MALE_NAMES.map(n => `'${n}'`).join(",");

    // Fix นาย with female names → change prefix to นางสาว and gender
    const r1 = await prisma.$executeRawUnsafe(`
    UPDATE student_profile sp
    SET student_prefix = 'นางสาว',
        gender_category_id = (SELECT gender_category_id FROM gender_category WHERE code = 'FEMALE')
    WHERE sp.student_prefix = 'นาย'
      AND sp.student_first_name_th IN (${femaleNamesList})
  `);

    // Fix นางสาว with male names → change prefix to นาย and gender
    const r2 = await prisma.$executeRawUnsafe(`
    UPDATE student_profile sp
    SET student_prefix = 'นาย',
        gender_category_id = (SELECT gender_category_id FROM gender_category WHERE code = 'MALE')
    WHERE sp.student_prefix = 'นางสาว'
      AND sp.student_first_name_th IN (${maleNamesList})
  `);

    log(`  ✅ Fixed ${r1} male→female, ${r2} female→male student prefix mismatches`);
}

async function fix4_ratingVariation() {
    log("Fix 4: Adding per-criterion rating variation...");

    // Get criterion IDs
    const criteria = await prisma.$queryRawUnsafe<
        { evaluation_criterion_id: number; evaluation_criterion_topic_th: string }[]
    >(`SELECT evaluation_criterion_id, evaluation_criterion_topic_th FROM evaluation_criterion ORDER BY evaluation_criterion_id`);

    if (criteria.length !== 4) {
        log(`  ⚠️ Expected 4 criteria, found ${criteria.length}. Skipping.`);
        return;
    }

    // Criterion 1: "การรับฟังและเข้าใจปัญหา" → bias UP (+1 for ~15%)
    log("  - Adjusting criterion 1 (การรับฟัง) UP...");
    await prisma.$executeRawUnsafe(`
    UPDATE feedback_rating
    SET feedback_rating_score = LEAST(5, feedback_rating_score + 1)
    WHERE evaluation_criterion_id = $1
      AND feedback_rating_score < 5
      AND random() < 0.15
  `, criteria[0].evaluation_criterion_id);

    // Criterion 2: "ความชัดเจนในการให้คำแนะนำ" → bias DOWN (-1 for ~12%)
    log("  - Adjusting criterion 2 (ความชัดเจน) DOWN...");
    await prisma.$executeRawUnsafe(`
    UPDATE feedback_rating
    SET feedback_rating_score = GREATEST(1, feedback_rating_score - 1)
    WHERE evaluation_criterion_id = $1
      AND feedback_rating_score > 1
      AND random() < 0.12
  `, criteria[1].evaluation_criterion_id);

    // Criterion 3: "ความเป็นส่วนตัว" → bias UP (+1 for ~20%)
    log("  - Adjusting criterion 3 (ความเป็นส่วนตัว) UP...");
    await prisma.$executeRawUnsafe(`
    UPDATE feedback_rating
    SET feedback_rating_score = LEAST(5, feedback_rating_score + 1)
    WHERE evaluation_criterion_id = $1
      AND feedback_rating_score < 5
      AND random() < 0.20
  `, criteria[2].evaluation_criterion_id);

    // Criterion 4: "ความพึงพอใจโดยรวม" → slight bias DOWN (-1 for ~8%)
    log("  - Adjusting criterion 4 (ความพึงพอใจโดยรวม) DOWN...");
    await prisma.$executeRawUnsafe(`
    UPDATE feedback_rating
    SET feedback_rating_score = GREATEST(1, feedback_rating_score - 1)
    WHERE evaluation_criterion_id = $1
      AND feedback_rating_score > 1
      AND random() < 0.08
  `, criteria[3].evaluation_criterion_id);

    log("  ✅ Rating per-criterion variation applied");
}

async function fix5_feedbackComments() {
    log("Fix 5: Expanding feedback comment templates...");

    // Build CASE WHEN with random assignment using hashing
    const cases = FEEDBACK_COMMENTS.map((text, i) => {
        return `WHEN ${i} THEN '${text.replace(/'/g, "''")}'`;
    }).join("\n      ");

    await prisma.$executeRawUnsafe(`
    UPDATE feedback_comment
    SET feedback_comment_text = CASE (abs(hashtext(feedback_id::text || 'comment')) % ${FEEDBACK_COMMENTS.length})
      ${cases}
    END
    WHERE feedback_comment_text IS NOT NULL
  `);

    log(`  ✅ Updated feedback comments with ${FEEDBACK_COMMENTS.length} templates`);
}

async function fix6_bookingOutcomeNotes() {
    log("Fix 6: Expanding booking outcome notes...");

    const cases = OUTCOME_NOTES.map((text, i) => {
        return `WHEN ${i} THEN '${text.replace(/'/g, "''")}'`;
    }).join("\n      ");

    await prisma.$executeRawUnsafe(`
    UPDATE booking_outcome
    SET booking_outcome_consultant_note = CASE (abs(hashtext(booking_id::text || 'note')) % ${OUTCOME_NOTES.length})
      ${cases}
    END
  `);

    log(`  ✅ Updated outcome notes with ${OUTCOME_NOTES.length} templates`);
}

async function fix7_bookingDetailText() {
    log("Fix 7: Expanding booking detail texts...");

    const cases = BOOKING_DETAILS.map((text, i) => {
        return `WHEN ${i} THEN '${text.replace(/'/g, "''")}'`;
    }).join("\n      ");

    // Only update non-cancellation booking details
    await prisma.$executeRawUnsafe(`
    UPDATE booking
    SET booking_detail_text = CASE (abs(hashtext(booking_id::text || 'detail')) % ${BOOKING_DETAILS.length})
      ${cases}
    END
    WHERE booking_status IN ('COMPLETED', 'ASSIGNED', 'IN_PROGRESS', 'PENDING_ASSIGNMENT')
  `);

    log(`  ✅ Updated booking details with ${BOOKING_DETAILS.length} templates`);
}

async function fix8_attendanceDistribution() {
    log("Fix 8: Adding realistic attendance variety...");

    // Mark ~5% as NO_SHOW
    const noShowResult = await prisma.$executeRawUnsafe(`
    UPDATE booking_attendance
    SET booking_attendance_status = 'NO_SHOW',
        booking_attendance_checked_in_at = NULL
    WHERE booking_attendance_status = 'CHECKED_IN'
      AND random() < 0.05
  `);
    log(`  - Set ${noShowResult} as NO_SHOW`);

    // Mark ~8% of remaining CHECKED_IN as LATE with random late minutes
    const lateResult = await prisma.$executeRawUnsafe(`
    UPDATE booking_attendance
    SET booking_attendance_status = 'LATE',
        booking_attendance_late_minutes = floor(random() * 25 + 5)::int
    WHERE booking_attendance_status = 'CHECKED_IN'
      AND random() < 0.084
  `);
    log(`  - Set ${lateResult} as LATE`);

    log("  ✅ Attendance distribution updated");
}

async function fix9_populateSeasons() {
    log("Fix 9: Populating season table...");

    await prisma.$executeRawUnsafe(`
    INSERT INTO season (season_code, season_name_th, season_name_en, month_start, month_end, sort_order)
    VALUES
      ('HOT',  'ฤดูร้อน',  'Summer',    3,  5, 1),
      ('RAIN', 'ฤดูฝน',   'Rainy',     6, 10, 2),
      ('COOL', 'ฤดูหนาว', 'Winter',   11,  2, 3)
    ON CONFLICT (season_code) DO NOTHING
  `);

    // Update booking.season_id based on month (extract from time_slot start)
    await prisma.$executeRawUnsafe(`
    UPDATE booking b
    SET season_id = s.season_id
    FROM time_slot ts, season s
    WHERE ts.university_id = b.university_id
      AND ts.time_slot_id = b.time_slot_id
      AND (
        (s.season_code = 'HOT' AND EXTRACT(MONTH FROM ts.time_slot_start_datetime) IN (3,4,5))
        OR (s.season_code = 'RAIN' AND EXTRACT(MONTH FROM ts.time_slot_start_datetime) IN (6,7,8,9,10))
        OR (s.season_code = 'COOL' AND EXTRACT(MONTH FROM ts.time_slot_start_datetime) IN (11,12,1,2))
      )
  `);

    log("  ✅ Season table populated and bookings linked");
}

async function fix10_cancellationReasonBalance() {
    log("Fix 10: Rebalancing cancellation reasons...");

    // Get all cancellation reason IDs
    const reasons = await prisma.$queryRawUnsafe<
        { cancellation_reason_id: number; cancellation_reason_code: string }[]
    >(`SELECT cancellation_reason_id, cancellation_reason_code FROM cancellation_reason`);

    if (reasons.length < 3) {
        log("  ⚠️ Not enough reasons to rebalance. Skipping.");
        return;
    }

    // Redistribute: change ~40% of "เปลี่ยนวัน" to other reasons
    const mainReasonId = reasons.find(r => r.cancellation_reason_code === "RESCHEDULE")?.cancellation_reason_id
        ?? reasons[0].cancellation_reason_id;

    const otherReasons = reasons.filter(r => r.cancellation_reason_id !== mainReasonId);

    for (const reason of otherReasons) {
        const pct = 0.10; // each other reason gets ~10% of the main
        await prisma.$executeRawUnsafe(`
      UPDATE booking_cancellation
      SET cancellation_reason_id = $1
      WHERE cancellation_reason_id = $2
        AND random() < $3
    `, reason.cancellation_reason_id, mainReasonId, pct);
    }

    log("  ✅ Cancellation reason distribution rebalanced");
}

async function fix11_englishSpecializations() {
    log("Fix 11: Converting English specializations to Thai...");

    await prisma.$executeRawUnsafe(`
    UPDATE consultant_specialization
    SET consultant_specialization_topic = 'แนะแนวการเรียน/วิชาการ'
    WHERE consultant_specialization_topic = 'Academic Counseling'
  `);

    await prisma.$executeRawUnsafe(`
    UPDATE consultant_specialization
    SET consultant_specialization_topic = 'การจัดการความเครียด'
    WHERE consultant_specialization_topic = 'Stress Management'
  `);

    log("  ✅ English specializations translated to Thai");
}

async function fix12_outcomeNextStep() {
    log("Fix 12: Expanding outcome next_step templates...");

    const cases = NEXT_STEPS.map((text, i) => {
        return `WHEN ${i} THEN '${text.replace(/'/g, "''")}'`;
    }).join("\n      ");

    await prisma.$executeRawUnsafe(`
    UPDATE booking_outcome
    SET booking_outcome_next_step = CASE (abs(hashtext(booking_id::text || 'nextstep')) % ${NEXT_STEPS.length})
      ${cases}
    END
    WHERE booking_outcome_next_step IS NOT NULL
  `);

    log(`  ✅ Updated next_step with ${NEXT_STEPS.length} templates`);
}

async function fix13_studentBehaviorStatus() {
    log("Fix 13: Backfilling student behavior status for NO_SHOW students...");

    // Insert behavior status for students that had NO_SHOW (will exist after fix8)
    await prisma.$executeRawUnsafe(`
    INSERT INTO student_behavior_status (
      university_id, student_id,
      student_trust_term_code, student_trust_late_cancel_count,
      student_trust_no_show_count, student_trust_updated_at
    )
    SELECT DISTINCT b.university_id, b.student_id,
           '2568-1',
           0,
           count(*) OVER (PARTITION BY b.university_id, b.student_id),
           NOW()
    FROM booking b
    JOIN booking_attendance ba ON ba.university_id = b.university_id AND ba.booking_id = b.booking_id
    WHERE ba.booking_attendance_status = 'NO_SHOW'
    ON CONFLICT (university_id, student_id) DO UPDATE
    SET student_trust_no_show_count = EXCLUDED.student_trust_no_show_count,
        student_trust_updated_at = NOW()
  `);

    // Also add LATE students
    await prisma.$executeRawUnsafe(`
    INSERT INTO student_behavior_status (
      university_id, student_id,
      student_trust_term_code, student_trust_late_cancel_count,
      student_trust_no_show_count, student_trust_updated_at
    )
    SELECT DISTINCT b.university_id, b.student_id,
           '2568-1',
           count(*) OVER (PARTITION BY b.university_id, b.student_id),
           0,
           NOW()
    FROM booking b
    JOIN booking_attendance ba ON ba.university_id = b.university_id AND ba.booking_id = b.booking_id
    WHERE ba.booking_attendance_status = 'LATE'
    ON CONFLICT (university_id, student_id) DO UPDATE
    SET student_trust_late_cancel_count = student_behavior_status.student_trust_late_cancel_count + EXCLUDED.student_trust_late_cancel_count,
        student_trust_updated_at = NOW()
  `);

    const count = await prisma.$queryRawUnsafe<{ count: bigint }[]>(
        `SELECT count(*) FROM student_behavior_status`
    );
    log(`  ✅ student_behavior_status now has ${count[0].count} rows`);
}

// ═══════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════

async function main() {
    log("╔══════════════════════════════════════════════════════╗");
    log("║  DATA REALISM FIX — Starting all 13 fixes           ║");
    log("╚══════════════════════════════════════════════════════╝");

    const start = Date.now();

    try {
        // --- Small, fast fixes first ---
        await fix1_consultantHeadNames();
        await fix2_consultantGenderNameMismatch();
        await fix3_studentGenderNameMismatch();
        await fix11_englishSpecializations();

        // --- Populate season table ---
        await fix9_populateSeasons();

        // --- Large batch updates ---
        await fix4_ratingVariation();
        await fix5_feedbackComments();
        await fix6_bookingOutcomeNotes();
        await fix7_bookingDetailText();
        await fix8_attendanceDistribution();
        await fix10_cancellationReasonBalance();
        await fix12_outcomeNextStep();

        // --- Depends on fix8 ---
        await fix13_studentBehaviorStatus();

        const elapsed = ((Date.now() - start) / 1000).toFixed(1);
        log("╔══════════════════════════════════════════════════════╗");
        log(`║  ALL 13 FIXES COMPLETE — ${elapsed}s                   ║`);
        log("╚══════════════════════════════════════════════════════╝");
    } catch (err) {
        console.error("❌ Error:", err);
        throw err;
    } finally {
        await prisma.$disconnect();
    }
}

main();
