// ✅ ลบ useRoleAuth ออก — role-specific child layouts จัดการ auth guard เองแล้ว
// เหลือแค่ pass-through layout เพื่อลดการเรียก API ซ้ำ

export default function UniversityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
