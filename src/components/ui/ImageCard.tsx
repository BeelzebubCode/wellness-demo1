// ==========================================
// 📌 UI Component: ImageCard
// ==========================================

'use client';

import Image from 'next/image';

interface ImageCardProps {
  src?: string;
  alt?: string;
  height?: number; // ปรับความสูงได้ตามต้องการ
}

export function ImageCard({
  src,
  alt = 'image',
  height = 500,
}: ImageCardProps) {
  return (
    <div
      className="
        bg-white 
        rounded-2xl 
        shadow-sm 
        border border-gray-200 
        overflow-hidden
        flex 
        items-center 
        justify-center
      "
      style={{ height }}
    >
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      ) : (
        <div className="text-gray-400 text-sm">ไม่มีรูปภาพ</div>
      )}
    </div>
  );
}
