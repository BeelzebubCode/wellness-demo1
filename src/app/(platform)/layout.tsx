// ✅ ลบ useRoleAuth ออก — super-admin/layout.tsx + ministry/layout.tsx จัดการ auth guard เองแล้ว
// เหลือแค่ pass-through layout เพื่อลดการเรียก API ซ้ำ

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
