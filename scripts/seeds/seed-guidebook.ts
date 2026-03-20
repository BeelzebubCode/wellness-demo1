// scripts/seeds/seed-guidebook.ts — Seed guidebook with Lucide SVG icons
// Run: npx tsx scripts/seeds/seed-guidebook.ts
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Lucide SVG icons (24x24, stroke-width=2)
const icon = {
  calendar: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>`,
  users: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  check: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>`,
  x: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>`,
  star: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
  shield: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/></svg>`,
  alert: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>`,
  info: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>`,
  bulb: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>`,
  clip: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>`,
  cog: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>`,
  bot: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>`,
  help: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>`,
  lock: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
  flow: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`,
  building: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>`,
};

const warn = (text: string) => `<div class="callout callout-warning">${icon.alert}<div>${text}</div></div>`;
const tip = (text: string) => `<div class="callout callout-info">${icon.bulb}<div>${text}</div></div>`;
const success = (text: string) => `<div class="callout callout-success">${icon.info}<div>${text}</div></div>`;
const h3 = (svg: string, text: string) => `<h3>${svg} ${text}</h3>`;

interface Doc { document_slug: string; document_title: string; document_content: string; document_order: number; document_is_active: boolean; }

const documents: Doc[] = [
  {
    document_slug: 'system-overview', document_title: 'ภาพรวมระบบ Wellness Booking', document_order: 1, document_is_active: true,
    document_content: `
<h2>ระบบจองคิวปรึกษาสุขภาวะ</h2>
<p>ระบบ <strong>Wellness Booking</strong> คือแพลตฟอร์มดิจิทัลสำหรับการจองคิวให้คำปรึกษาด้านสุขภาวะของนิสิต/นักศึกษาในมหาวิทยาลัย ครอบคลุมตั้งแต่การจอง การมอบหมายผู้ให้คำปรึกษา การบันทึกผล ไปจนถึงการประเมินความเสี่ยง</p>
${h3(icon.star, 'ฟีเจอร์หลัก')}
<ul>
<li><strong>จองคิวอัตโนมัติ</strong> — นิสิตเลือกวัน เวลา และหมวดปัญหาได้ด้วยตนเอง</li>
<li><strong>ระบบมอบหมายงาน</strong> — หัวหน้าที่ปรึกษาจัดสรร Consultant ตามเวรและความเชี่ยวชาญ</li>
<li><strong>บันทึกผลการปรึกษา</strong> — Consultant บันทึก note, risk level, และ next step</li>
<li><strong>ระบบสะสมแต้ม</strong> — นิสิตได้รับแต้มเมื่อทำ feedback หลังปรึกษา</li>
<li><strong>ระบบลงโทษ/ยกเว้นโทษ</strong> — จัดการกรณีไม่มาตามนัดหรือยกเลิกกะทันหัน</li>
<li><strong>AI Chatbot</strong> — ตอบคำถามอัตโนมัติจาก Knowledge Base</li>
<li><strong>Dashboard &amp; Analytics</strong> — รายงานสำหรับผู้บริหาร, คณบดี, กระทรวง</li>
<li><strong>ระบบยืมตัว Consultant</strong> — ขอยืม Consultant ข้ามมหาวิทยาลัย</li>
</ul>
${h3(icon.users, 'บทบาทผู้ใช้ (Roles)')}
<table><thead><tr><th>บทบาท</th><th>ภาษาอังกฤษ</th><th>หน้าที่หลัก</th></tr></thead><tbody>
<tr><td>นิสิต</td><td>Student</td><td>จองคิว, ให้ feedback, ยื่นคำร้องยกเว้นโทษ</td></tr>
<tr><td>ผู้ให้คำปรึกษา</td><td>Consultant</td><td>รับเคส, บันทึกผล, จัดตารางเวร</td></tr>
<tr><td>หัวหน้าผู้ให้คำปรึกษา</td><td>Head Consultant</td><td>มอบหมายงาน, จัดเวร, อนุมัติยกเว้นโทษ</td></tr>
<tr><td>อาจารย์ที่ปรึกษา</td><td>Advisor</td><td>ดูข้อมูลนิสิตในที่ปรึกษา</td></tr>
<tr><td>คณบดี</td><td>Dean</td><td>Dashboard &amp; AI Insight ระดับคณะ</td></tr>
<tr><td>หัวหน้าภาค</td><td>Head Department</td><td>Dashboard ระดับภาควิชา</td></tr>
<tr><td>อธิการบดี</td><td>Rector</td><td>Dashboard ภาพรวมมหาวิทยาลัย</td></tr>
<tr><td>ผู้ดูแลระบบ</td><td>Super Admin</td><td>จัดการระบบ, AI KB, เอกสาร</td></tr>
<tr><td>กระทรวง</td><td>Ministry</td><td>Dashboard ภาพรวมทุกมหาวิทยาลัย</td></tr>
</tbody></table>
${h3(icon.flow, 'Flow การทำงาน')}
<ol class="step-list">
<li>นิสิตเข้าสู่ระบบ → เลือก <strong>จองคิว</strong> → เลือกวัน/เวลา/หมวดปัญหา</li>
<li>ระบบสร้าง Booking สถานะ <code>PENDING_ASSIGNMENT</code></li>
<li>Head Consultant มอบหมาย Consultant → สถานะเปลี่ยนเป็น <code>ASSIGNED</code></li>
<li>ถึงเวลานัด → Consultant เริ่มให้คำปรึกษา → <code>IN_PROGRESS</code></li>
<li>เสร็จสิ้น → Consultant บันทึกผล → <code>COMPLETED</code></li>
<li>นิสิตทำ Feedback ให้คะแนน → ได้รับแต้มสะสม</li>
</ol>`
  },
  {
    document_slug: 'student-guide', document_title: 'คู่มือสำหรับนิสิต/นักศึกษา', document_order: 2, document_is_active: true,
    document_content: `
<h2>คู่มือสำหรับนิสิต/นักศึกษา</h2>
<p>คู่มือนี้อธิบายวิธีใช้งานระบบ Wellness Booking สำหรับนิสิตทุกขั้นตอน</p>
${h3(icon.calendar, 'การจองคิวปรึกษา')}
<ol class="step-list">
<li>เข้าสู่ระบบด้วยบัญชีมหาวิทยาลัย</li>
<li>คลิก <strong>"จองคิว"</strong> ที่เมนูหลัก</li>
<li>เลือก <strong>หมวดปัญหา</strong> เช่น ความเครียด, ปัญหาการเรียน, สุขภาพจิต, ความสัมพันธ์, ครอบครัว, อาชีพ, การเงิน</li>
<li>เลือก <strong>วันที่และเวลา</strong> จาก Time Slot ที่ว่าง</li>
<li>เลือก <strong>รูปแบบ:</strong> Online (Google Meet / LINE Call / Zoom) หรือ Onsite (มาพบที่ห้องให้คำปรึกษา)</li>
<li>กรอกรายละเอียดเพิ่มเติม → กดยืนยัน</li>
<li>ลงนามยินยอม (Digital Signature) → จองเสร็จสมบูรณ์</li>
</ol>
${h3(icon.clip, 'การดูนัดหมายของฉัน')}
<p>ที่เมนู <strong>"นัดหมายของฉัน"</strong> จะเห็นรายการนัดหมายทั้งหมด:</p>
<table><thead><tr><th>สี</th><th>สถานะ</th><th>ความหมาย</th></tr></thead><tbody>
<tr><td><span class="badge badge-yellow">เหลือง</span></td><td>PENDING_ASSIGNMENT</td><td>รอมอบหมาย</td></tr>
<tr><td><span class="badge badge-blue">ฟ้า</span></td><td>ASSIGNED</td><td>ได้รับมอบหมายแล้ว</td></tr>
<tr><td><span class="badge badge-green">เขียว</span></td><td>COMPLETED</td><td>เสร็จสิ้น</td></tr>
<tr><td><span class="badge badge-red">แดง</span></td><td>CANCELLED</td><td>ถูกยกเลิก</td></tr>
</tbody></table>
${h3(icon.x, 'การยกเลิกนัดหมาย')}
${warn('หากยกเลิกน้อยกว่า 24 ชั่วโมงก่อนเวลานัด จะถือว่า <strong>"ยกเลิกกะทันหัน" (Late Cancel)</strong> ซึ่งจะมีผลต่อคะแนนความไว้วางใจ')}
<ul>
<li>ไปที่ "นัดหมายของฉัน" → เลือกนัดหมาย → กด <strong>"ยกเลิกนัดหมาย"</strong></li>
<li>เลือกเหตุผลการยกเลิก → กดยืนยัน</li>
</ul>
${h3(icon.star, 'การให้ Feedback และแต้มสะสม')}
<p>หลังปรึกษาเสร็จ ระบบจะให้คุณประเมินผล:</p>
<ul>
<li>ให้คะแนน 1-5 ดาว ในแต่ละหัวข้อ</li>
<li>เลือกแบบ <strong>ไม่ระบุตัวตน (Anonymous)</strong> ได้</li>
<li>เขียนความคิดเห็นเพิ่มเติม (ไม่บังคับ)</li>
<li>กดส่ง → <strong>ได้รับ +10 แต้มสะสมอัตโนมัติ</strong></li>
</ul>
${h3(icon.shield, 'การยื่นคำร้องยกเว้นโทษ')}
<p>หากถูกลงโทษแต่มีเหตุจำเป็น:</p>
<ol class="step-list">
<li>ไปที่เมนู <strong>"คำร้องยกเว้นโทษ"</strong></li>
<li>เลือกเหตุผล เช่น เหตุฉุกเฉิน, ป่วย, อุบัติเหตุ</li>
<li>กรอกรายละเอียด + แนบหลักฐาน</li>
<li>กดส่ง → รอหัวหน้าผู้ให้คำปรึกษาพิจารณา</li>
</ol>
${success('หากอนุมัติ → แต้มที่ถูกหักจะถูกคืน และล็อกจะถูกปลดทันที')}`
  },
  {
    document_slug: 'consultant-guide', document_title: 'คู่มือสำหรับผู้ให้คำปรึกษา', document_order: 3, document_is_active: true,
    document_content: `
<h2>คู่มือสำหรับผู้ให้คำปรึกษา (Consultant)</h2>
<p>คู่มือนี้อธิบายวิธีรับเคส บันทึกผล และจัดตารางเวร</p>
${h3(icon.clip, 'การรับเคส (My Jobs)')}
<ol class="step-list">
<li>เข้าสู่ระบบ → ไปที่เมนู <strong>"งานของฉัน" (My Jobs)</strong></li>
<li>ดูรายการนัดหมายที่ได้รับมอบหมาย พร้อมข้อมูลนิสิต หมวดปัญหา และรูปแบบบริการ</li>
<li>ส่งข้อมูล Session ให้นิสิต: <strong>Online</strong> → กรอกลิงก์ Meet/Zoom, <strong>Onsite</strong> → กรอกสถานที่</li>
</ol>
${h3(icon.check, 'การเช็คอิน (Attendance)')}
<table><thead><tr><th>สถานะ</th><th>ความหมาย</th><th>ผลกระทบ</th></tr></thead><tbody>
<tr><td><code>CHECKED_IN</code></td><td>มาตามนัด ตรงเวลา</td><td>ไม่มี</td></tr>
<tr><td><code>LATE</code></td><td>มาสาย</td><td>บันทึกจำนวนนาที</td></tr>
<tr><td><code>NO_SHOW</code></td><td>ไม่มาตามนัด</td><td>ระบบลงโทษอัตโนมัติ</td></tr>
</tbody></table>
${h3(icon.clip, 'การบันทึกผล (Outcome)')}
<p>หลังให้คำปรึกษาเสร็จ ต้องบันทึกผลทุกครั้ง:</p>
<ul>
<li><strong>Consultant Note</strong> — สรุปเนื้อหาที่ปรึกษา</li>
<li><strong>Risk Level</strong> — ระดับ 1-5 (ต่ำมาก → สูงมาก)</li>
<li><strong>Next Step</strong> — แผนติดตามต่อ (ถ้ามี)</li>
</ul>
<table><thead><tr><th>Level</th><th>ชื่อ</th><th>ความหมาย</th></tr></thead><tbody>
<tr><td>1</td><td>ต่ำมาก</td><td>ไม่มีปัญหาเฉพาะ</td></tr>
<tr><td>2</td><td>ต่ำ</td><td>ปัญหาเล็กน้อย</td></tr>
<tr><td>3</td><td>ปานกลาง</td><td>ต้องติดตามต่อ</td></tr>
<tr><td>4</td><td>สูง</td><td>ต้องดูแลใกล้ชิด</td></tr>
<tr><td>5</td><td>สูงมาก</td><td>ต้องส่งต่อผู้เชี่ยวชาญ</td></tr>
</tbody></table>
${h3(icon.calendar, 'ตารางเวรและประวัติ')}
<ul>
<li><strong>ตารางเวร (Schedule)</strong> — ดูเวรของตนเอง แต่ละวัน/สัปดาห์</li>
<li><strong>ประวัติ (History)</strong> — บันทึกย้อนหลังทั้งหมด กรองตามวันที่/หมวด/สถานะ</li>
<li><strong>Shifts</strong> — ดูกะเวรที่ได้รับมอบหมาย</li>
</ul>`
  },
  {
    document_slug: 'head-consultant-guide', document_title: 'คู่มือสำหรับหัวหน้าผู้ให้คำปรึกษา', document_order: 4, document_is_active: true,
    document_content: `
<h2>คู่มือสำหรับหัวหน้าผู้ให้คำปรึกษา</h2>
<p>Head Consultant เป็นผู้จัดการระบบระดับมหาวิทยาลัย</p>
${h3(icon.users, 'การมอบหมายงาน (Booking Assignment)')}
<ol class="step-list">
<li>ไปที่ <strong>"จัดการนัดหมาย" (Bookings)</strong> → ดูรายการ <code>PENDING_ASSIGNMENT</code></li>
<li>คลิกนัดหมาย → กด <strong>"มอบหมาย"</strong></li>
<li>เลือก Consultant ที่เหมาะสม — ระบบแสดงตารางเวร, จำนวนเคส, ความเชี่ยวชาญ</li>
<li>เขียน note (ถ้ามี) → กดยืนยัน</li>
</ol>
${tip('<strong>Auto-Assignment:</strong> หากไม่มอบหมายภายในเวลาที่กำหนด ระบบจะมอบหมายอัตโนมัติให้ Consultant ที่มีเวรและมีเคสน้อยที่สุด')}
${h3(icon.calendar, 'การจัดตารางเวร')}
<ul>
<li>ดูภาพรวม Time Slot ทั้งสัปดาห์/เดือน</li>
<li>จัดเวรให้ Consultant แต่ละช่วงเวลา</li>
<li>จัดการ Shift Team — จัดกลุ่มผู้ปฏิบัติงานตามช่วงเวลา</li>
</ul>
${h3(icon.shield, 'การอนุมัติคำร้องยกเว้นโทษ')}
<ol class="step-list">
<li>ไปที่ <strong>"คำร้องยกเว้นโทษ"</strong> → ดูรายการ <code>PENDING_REVIEW</code></li>
<li>ตรวจสอบเหตุผลและหลักฐานของนิสิต</li>
<li><strong>อนุมัติ (Approve)</strong> → ระบบคืนแต้ม + ปลดล็อกอัตโนมัติ</li>
<li><strong>ปฏิเสธ (Reject)</strong> → โทษยังคงอยู่</li>
</ol>
${h3(icon.users, 'ระบบยืมตัว Consultant')}
<p>เมื่อ Consultant ไม่เพียงพอ สามารถขอยืมจากมหาวิทยาลัยอื่น:</p>
<ol class="step-list">
<li>ไปที่ <strong>"ยืมตัวผู้ให้คำปรึกษา"</strong></li>
<li>สร้างคำขอ → ระบุเหตุผล, ช่วงเวลา, จำนวนที่ต้องการ</li>
<li>ส่งคำขอ → รอ Super Admin อนุมัติ</li>
<li>เมื่ออนุมัติ → Consultant ปรากฏในรายชื่อมอบหมายได้</li>
</ol>`
  },
  {
    document_slug: 'management-guide', document_title: 'คู่มือสำหรับผู้บริหาร', document_order: 5, document_is_active: true,
    document_content: `
<h2>คู่มือสำหรับผู้บริหาร</h2>
<p>ผู้บริหารแต่ละระดับมีเมนูและข้อมูลที่แตกต่างกันตามขอบเขตความรับผิดชอบ</p>
${h3(icon.clip, 'อาจารย์ที่ปรึกษา (Advisor)')}
<ul>
<li><strong>"นิสิตในที่ปรึกษา"</strong> — ดูรายชื่อนิสิต สถิติการจอง และ Risk Level</li>
<li>กรองตาม Season เพื่อเปรียบเทียบช่วงเวลา</li>
</ul>
${warn('Advisor เห็นเฉพาะ <strong>สถิติภาพรวม</strong> ไม่สามารถอ่านรายละเอียดเนื้อหาการปรึกษาได้ เพื่อรักษาความเป็นส่วนตัวของนิสิต')}
${h3(icon.building, 'คณบดี (Dean) / หัวหน้าภาค (Head Department)')}
<ul>
<li><strong>Dashboard</strong> — ภาพรวมการจองในคณะ/ภาค</li>
<li><strong>AI Insight</strong> — การวิเคราะห์แนวโน้มและข้อเสนอแนะจาก AI</li>
<li><strong>Subject Group</strong> (Dean) — สถิติแยกตามสาขาวิชา</li>
<li>จำนวนนิสิตที่มี Risk Level สูง, แนวโน้มเปรียบเทียบตาม Season</li>
</ul>
${h3(icon.building, 'อธิการบดี (Rector)')}
<ul>
<li><strong>Dashboard</strong> — สถิติภาพรวมทุกคณะ</li>
<li><strong>AI Insight</strong> — วิเคราะห์ภาพรวมสุขภาวะมหาวิทยาลัย</li>
<li><strong>Faculties</strong> — เปรียบเทียบข้อมูลระหว่างคณะ</li>
</ul>
${h3(icon.building, 'กระทรวง (Ministry)')}
<ul>
<li><strong>Dashboard</strong> — จำนวน Booking ทุกมหาวิทยาลัย</li>
<li><strong>Heat Map</strong> — แผนที่ความร้อนตามภูมิภาค</li>
<li><strong>AI Insight</strong> — วิเคราะห์ระดับประเทศ</li>
<li><strong>Universities</strong> — เจาะลึกแต่ละมหาวิทยาลัย</li>
</ul>`
  },
  {
    document_slug: 'cancellation-policy', document_title: 'นโยบายยกเลิกนัดหมายและบทลงโทษ', document_order: 6, document_is_active: true,
    document_content: `
<h2>นโยบายการยกเลิกนัดหมายและบทลงโทษ</h2>
<p>เพื่อรักษาคุณภาพบริการและความเป็นธรรมต่อทุกฝ่าย ระบบมีนโยบายดังนี้</p>
${h3(icon.clip, 'ประเภทการดำเนินการทางวินัย')}
<table><thead><tr><th>รหัส</th><th>ชื่อ</th><th>ทิศทาง</th><th>ผลกระทบ</th></tr></thead><tbody>
<tr><td><code>LATE_CANCEL</code></td><td>ยกเลิกนัดสาย</td><td><span class="badge badge-red">ลงโทษ</span></td><td>หักแต้ม + ล็อก (ทุก 3 ครั้ง)</td></tr>
<tr><td><code>NO_SHOW</code></td><td>ไม่มาตามนัด</td><td><span class="badge badge-red">ลงโทษ</span></td><td>หักแต้ม + ล็อกทันที</td></tr>
<tr><td><code>EXCEPTION_APPROVED</code></td><td>อนุมัติข้อยกเว้น</td><td><span class="badge badge-green">ปลดโทษ</span></td><td>คืนแต้ม + ปลดล็อก</td></tr>
<tr><td><code>MANUAL_UNLOCK</code></td><td>ปลดล็อกด้วยตนเอง</td><td><span class="badge badge-green">ปลดโทษ</span></td><td>ปลดล็อก (ไม่คืนแต้ม)</td></tr>
</tbody></table>
${h3(icon.x, 'ยกเลิกกะทันหัน (Late Cancel)')}
<ul>
<li><strong>เงื่อนไข:</strong> ยกเลิกน้อยกว่า 24 ชั่วโมงก่อนเวลานัด</li>
<li><strong>สะสม 3 ครั้ง:</strong> ล็อกการจอง 7 วัน + หักแต้ม 20 คะแนน</li>
<li><strong>ทุก 3 ครั้งถัดไป:</strong> ล็อกเพิ่มอีก 7 วัน + หักแต้มอีก 20 คะแนน</li>
</ul>
${h3(icon.x, 'ไม่มาตามนัด (No Show)')}
<ul>
<li><strong>ครั้งที่ 1:</strong> ล็อกการจอง <strong>7 วัน</strong> + หักแต้ม <strong>30 คะแนน</strong></li>
<li><strong>ครั้งที่ 2+:</strong> ล็อกการจอง <strong>14 วัน</strong> + หักแต้ม <strong>30 คะแนน</strong></li>
</ul>
${h3(icon.shield, 'การปลดล็อก')}
<p>มี 2 วิธี:</p>
<ul>
<li><strong>ยื่นคำร้องยกเว้นโทษ</strong> — ระบุเหตุจำเป็นพร้อมหลักฐาน → หากอนุมัติ คืนแต้ม + ปลดล็อกทันที</li>
<li><strong>รอล็อกหมดอายุ</strong> — หลังครบ 7 หรือ 14 วัน ระบบปลดล็อกอัตโนมัติ</li>
</ul>
${success('เข้าปรึกษาตามนัดทุกครั้ง + ทำ Feedback = ได้แต้มสะสม ไม่ถูกลงโทษ ได้ประโยชน์ทั้งแต้มและสุขภาพจิต')}`
  },
  {
    document_slug: 'super-admin-guide', document_title: 'คู่มือสำหรับ Super Admin', document_order: 7, document_is_active: true,
    document_content: `
<h2>คู่มือสำหรับ Super Admin</h2>
<p>Super Admin คือผู้ดูแลระบบระดับแพลตฟอร์ม สามารถจัดการทุกอย่างในระบบ</p>
${h3(icon.clip, 'จัดการเอกสาร (Docs)')}
<ul>
<li>สร้าง/แก้ไข/ลบ เอกสาร Guidebook</li>
<li>ตั้ง slug (URL) สำหรับเข้าถึงเอกสาร</li>
<li>เปิด/ปิดการแสดงผลเอกสาร และจัดลำดับ</li>
</ul>
${h3(icon.bot, 'จัดการ AI Knowledge Base')}
<ul>
<li>สร้าง/แก้ไข เอกสาร Knowledge Base สำหรับ AI Chatbot</li>
<li>จัดการเวอร์ชัน (ร่าง → เผยแพร่)</li>
<li>กำหนดสิทธิ์เข้าถึงตาม Role</li>
<li>ตรวจสอบสถานะ Index ของเอกสาร</li>
</ul>
${h3(icon.help, 'AI Feedback')}
<p>ดู Feedback จากผู้ใช้เกี่ยวกับ AI Chatbot เพื่อปรับปรุง Knowledge Base</p>
${h3(icon.users, 'จัดการคำขอยืมตัว (Borrow Requests)')}
<p>อนุมัติ/ปฏิเสธคำขอยืม Consultant ข้ามมหาวิทยาลัย — ตรวจสอบเหตุผล ช่วงเวลา และความพร้อม</p>
${h3(icon.cog, 'การตั้งค่า')}
<ul>
<li><strong>Channels</strong> — จัดการช่องทาง Online (LINE Call, Meet, Zoom)</li>
<li><strong>Problem Categories</strong> — เพิ่ม/แก้ไข/ปิดใช้งานหมวดปัญหา</li>
</ul>`
  },
  {
    document_slug: 'ai-chatbot-guide', document_title: 'คู่มือ AI Chatbot', document_order: 8, document_is_active: true,
    document_content: `
<h2>คู่มือ AI Chatbot</h2>
<p>ระบบมี AI Chatbot ที่ตอบคำถามเกี่ยวกับสุขภาวะและการใช้งานระบบได้อัตโนมัติ</p>
${h3(icon.bot, 'วิธีใช้งาน')}
<ol class="step-list">
<li>คลิกไอคอนแชทที่มุมขวาล่างของหน้าจอ</li>
<li>พิมพ์คำถามเป็นภาษาไทยหรืออังกฤษ</li>
<li>AI จะตอบกลับโดยอ้างอิงจาก Knowledge Base ของระบบ</li>
</ol>
${h3(icon.clip, 'สิ่งที่ AI ตอบได้')}
<ul>
<li>วิธีจองคิว / ยกเลิกนัดหมาย</li>
<li>นโยบายการยกเลิกและบทลงโทษ</li>
<li>วิธียื่นคำร้อง Exception</li>
<li>คำถามทั่วไปเกี่ยวกับระบบ</li>
<li>ข้อมูลเบื้องต้นเกี่ยวกับสุขภาวะจิตใจ</li>
</ul>
${h3(icon.star, 'การให้ Feedback แก่ AI')}
<p>หลังจาก AI ตอบ คุณสามารถกดให้คะแนนได้ เพื่อช่วยให้ทีม Admin ปรับปรุง Knowledge Base</p>
${warn('AI Chatbot <strong>ไม่ใช่นักจิตวิทยา</strong> หากมีปัญหาสุขภาพจิตที่ต้องการความช่วยเหลือ กรุณา<strong>จองคิวพบผู้เชี่ยวชาญ</strong> หรือโทรสายด่วนสุขภาพจิต <strong>1323</strong>')}`
  },
  {
    document_slug: 'faq', document_title: 'คำถามที่พบบ่อย (FAQ)', document_order: 9, document_is_active: true,
    document_content: `
<h2>คำถามที่พบบ่อย (FAQ)</h2>
${h3(icon.lock, 'การเข้าสู่ระบบ')}
<details><summary><strong>ลืมรหัสผ่านทำอย่างไร?</strong></summary><p>ติดต่อแอดมินที่ศูนย์ให้คำปรึกษาของมหาวิทยาลัยเพื่อรีเซ็ตรหัสผ่าน</p></details>
<details><summary><strong>เข้าสู่ระบบไม่ได้ ขึ้น "Unauthorized"</strong></summary><p>ตรวจสอบว่าบัญชีถูกเปิดใช้งานแล้ว หากยังไม่ได้ ให้ติดต่อแอดมิน</p></details>
${h3(icon.calendar, 'การจองคิว')}
<details><summary><strong>จองคิวได้ล่วงหน้ากี่วัน?</strong></summary><p>ดูจาก Time Slot ที่เปิดให้บริการ ปกติล่วงหน้าไม่เกิน 2 สัปดาห์</p></details>
<details><summary><strong>จองมากกว่า 1 คิวพร้อมกันได้ไหม?</strong></summary><p>ได้ แต่ต้องเป็นคนละวัน/เวลา ไม่สามารถจองซ้อนได้</p></details>
<details><summary><strong>ถูกล็อก จองคิวไม่ได้ ทำอย่างไร?</strong></summary><p>มี 2 ทาง: (1) รอจนครบกำหนดล็อก (7-14 วัน) (2) ยื่นคำร้องยกเว้นโทษพร้อมหลักฐาน</p></details>
${h3(icon.shield, 'การปรึกษา')}
<details><summary><strong>ข้อมูลการปรึกษาเป็นความลับหรือไม่?</strong></summary><p><strong>ใช่</strong> เฉพาะ Consultant และ Head Consultant เท่านั้นที่เข้าถึงได้ อาจารย์ที่ปรึกษาและผู้บริหารเห็นเฉพาะสถิติภาพรวม</p></details>
<details><summary><strong>เลือก Consultant ที่ต้องการได้ไหม?</strong></summary><p>ไม่สามารถเลือกโดยตรง แต่แจ้งความต้องการพิเศษไว้ในช่องรายละเอียดตอนจองได้</p></details>
${h3(icon.star, 'แต้มสะสม')}
<details><summary><strong>แต้มสะสมใช้ทำอะไรได้?</strong></summary><p>แสดงถึงความน่าเชื่อถือและการมีส่วนร่วม ในอนาคตอาจแลกสิทธิพิเศษได้</p></details>
<details><summary><strong>แต้มติดลบได้ไหม?</strong></summary><p>ได้ หากถูกหักแต้มจากบทลงโทษจนแต้มรวมเป็นลบ</p></details>
${h3(icon.help, 'ช่องทางติดต่อ')}
<p>หากมีปัญหาที่ไม่อยู่ใน FAQ ติดต่อศูนย์ให้คำปรึกษามหาวิทยาลัยของท่าน หรือสายด่วนสุขภาพจิต <strong>1323</strong> (24 ชั่วโมง)</p>`
  },
  {
    document_slug: 'privacy-policy', document_title: 'นโยบายความเป็นส่วนตัว', document_order: 10, document_is_active: true,
    document_content: `
<h2>นโยบายความเป็นส่วนตัว (Privacy Policy)</h2>
<p>ระบบ Wellness Booking ให้ความสำคัญกับความเป็นส่วนตัวของผู้ใช้งานทุกท่าน</p>
${h3(icon.clip, 'ข้อมูลที่เราเก็บรวบรวม')}
<ul>
<li><strong>ข้อมูลบัญชี</strong> — ชื่อ-สกุล, อีเมลมหาวิทยาลัย, รหัสนิสิต</li>
<li><strong>ข้อมูลการจอง</strong> — หมวดปัญหา, วันเวลา, รูปแบบบริการ</li>
<li><strong>บันทึกการปรึกษา</strong> — Consultant Note, Risk Level, Next Step</li>
<li><strong>ข้อมูล Feedback</strong> — คะแนนและความคิดเห็น</li>
</ul>
${h3(icon.lock, 'การเข้าถึงข้อมูล')}
<table><thead><tr><th>บทบาท</th><th>ข้อมูลที่เข้าถึงได้</th></tr></thead><tbody>
<tr><td>นิสิต</td><td>ข้อมูลตนเองเท่านั้น</td></tr>
<tr><td>Consultant</td><td>เคสที่ได้รับมอบหมาย</td></tr>
<tr><td>Head Consultant</td><td>เคสทั้งหมดของมหาวิทยาลัย</td></tr>
<tr><td>Advisor</td><td>สถิติภาพรวม (ไม่เห็นเนื้อหาการปรึกษา)</td></tr>
<tr><td>Dean / Rector</td><td>สถิติรวม ไม่ระบุตัวบุคคล</td></tr>
<tr><td>Ministry</td><td>สถิติระดับมหาวิทยาลัย ไม่ระบุตัวบุคคล</td></tr>
</tbody></table>
${h3(icon.shield, 'มาตรการรักษาความปลอดภัย')}
<ul>
<li>รหัสผ่านเข้ารหัสด้วย bcrypt</li>
<li>Session จัดการผ่าน JWT ที่มีอายุจำกัด</li>
<li>Feedback แบบ Anonymous ไม่แสดงชื่อผู้ให้</li>
<li>ข้อมูลจัดเก็บในฐานข้อมูลที่ backup ประจำวัน</li>
</ul>
<p>หากต้องการลบข้อมูลหรือสอบถามเรื่องข้อมูลส่วนตัว กรุณาติดต่อผู้ดูแลระบบของมหาวิทยาลัย</p>`
  },
];

async function main() {
  console.log('📚 Seeding Guidebook Documents...\n');
  for (const doc of documents) {
    await prisma.guidebookDocument.upsert({
      where: { document_slug: doc.document_slug },
      create: doc,
      update: { document_title: doc.document_title, document_content: doc.document_content, document_order: doc.document_order, document_is_active: doc.document_is_active },
    });
    console.log(`  ✅ ${doc.document_slug}`);
  }
  console.log(`\n🎉 Seeded ${documents.length} guidebook documents!`);
}

main()
  .catch((e) => { console.error('❌ Error:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
