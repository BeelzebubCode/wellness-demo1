'use client';

export default function AuthLikeBackground() {
  return (
    <>
      {/* background blobs (copy จากหน้า login) */}
      <div className="pointer-events-none absolute -top-24 -left-24 h-64 w-64 rounded-full bg-teal-100 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 -right-20 h-72 w-72 rounded-full bg-emerald-100 blur-3xl" />
      <div className="pointer-events-none absolute top-10 right-10 h-28 w-28 rounded-full bg-teal-200/40" />
    </>
  );
}
