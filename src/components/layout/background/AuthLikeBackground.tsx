'use client';

export default function AuthLikeBackground() {
  return (
    <>
      {/* Mint ใหญ่ ด้านบน */}
      <div
        className="
          pointer-events-none absolute
          -top-32 -left-32
          h-[420px] w-[420px]
          rounded-full blur-[120px]
          opacity-80
        "
        style={{ background: 'rgb(var(--accent))' }}
      />

      {/* Aqua กลางจอ */}
      <div
        className="
          pointer-events-none absolute
          top-1/3 right-[-120px]
          h-[360px] w-[360px]
          rounded-full blur-[140px]
          opacity-70
        "
        style={{ background: 'rgb(var(--primary))' }}
      />

      {/* highlight เล็ก */}
      <div
        className="
          pointer-events-none absolute
          bottom-24 left-1/3
          h-40 w-40
          rounded-full blur-3xl
          opacity-60
        "
        style={{ background: 'rgb(var(--accent))' }}
      />
    </>
  );
}
