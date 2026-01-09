import Image from "next/image";
import { notFound } from "next/navigation";
import type { PRItem } from "@/features/pr/types";

const MOCK: PRItem[] = [
  {
    id: "1",
    slug: "nu-cultural-exchange-2026",
    title: "เปิดรับสมัครแล้ว! โครงการสุดพิเศษสำหรับนิสิต NU ร่วมเป็น Buddies",
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

function formatThaiDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("th-TH", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export default function PRDetailPage({ params }: { params: { slug: string } }) {
  const item = MOCK.find((x) => x.slug === params.slug);
  if (!item) return notFound();

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <p className="text-sm text-slate-500">{formatThaiDate(item.publishedAt)}</p>
      <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900">
        {item.title}
      </h1>

      {item.coverImage && (
        <div className="relative mt-6 aspect-[16/9] rounded-2xl overflow-hidden border border-slate-200 bg-slate-100">
          <Image
            src={item.coverImage}
            alt={item.title}
            fill
            className="object-cover"
            sizes="100vw"
            priority
          />
        </div>
      )}

      <div className="mt-6 text-slate-700 leading-relaxed">
        <p>{item.excerpt}</p>
        <p className="mt-4 text-sm text-slate-500">
          (ตรงนี้ค่อยใส่รายละเอียดจริงจาก API/DB ได้)
        </p>
      </div>
    </main>
  );
}
