import { PRGrid } from "@/components/public/pr/PRGrid";
import type { PRItem } from "@/features/pr/types";

const MOCK: PRItem[] = [
  {
    id: "1",
    slug: "nu-cultural-exchange-2026",
    title:
      "เปิดรับสมัครแล้ว! โครงการสุดพิเศษสำหรับนิสิต NU ร่วมเป็น Buddies",
    excerpt:
      "เชิญชวนนิสิตเข้าร่วมโครงการแลกเปลี่ยนวัฒนธรรม 2026 และเป็นเพื่อนพานิสิตต่างชาติ",
    coverImage: "/images/pr/pr-1.png",
    publishedAt: "2025-12-29",
  },
  {
    id: "2",
    slug: "citcoms-training-jan-2569",
    title: "หลักสูตรอบรมคอมพิวเตอร์ ประจำเดือน มกราคม 2569",
    excerpt: "หลักสูตรใหม่ เดือนมกราคม 2569 พร้อมรายละเอียดการสมัครและกำหนดการ",
    coverImage: "/images/pr/pr-2.png",
    publishedAt: "2025-12-23",
  },
  {
    id: "3",
    slug: "nu-mooc-extended",
    title: "ขยายเวลารับสมัคร เข้าร่วมโครงการเป็นภายใน วันที่ 19 มกราคม 2569",
    excerpt: "ขยายเวลารับสมัครอาจารย์ เข้าร่วมพัฒนาบทเรียนออนไลน์ (NU MOOC)",
    coverImage: "/images/pr/pr-3.png",
    publishedAt: "2025-12-23",
  },
];

export default function PublicPRPage() {
  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <PRGrid items={MOCK} />
    </main>
  );
}
