//C:\wellness-demo1\src\app\(tenant)\(university)\advisor\my-students\[studentId]\page.tsx
import { StudentDetailView } from "@/features/dashboard/advisor/components/StudentDetailView";

export const metadata = {
  title: "ข้อมูลนิสิต | Wellness Center",
  description: "รายละเอียดข้อมูลและการรับคำปรึกษาของนิสิต",
};

interface PageProps {
  params: {
    studentId: string;
  };
}

export default function Page({ params }: PageProps) {
  return <StudentDetailView studentId={parseInt(params.studentId)} />;
}
