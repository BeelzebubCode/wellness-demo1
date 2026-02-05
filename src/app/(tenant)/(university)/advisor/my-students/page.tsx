import { MyStudentsPage } from "@/features/dashboard/advisor/components/MyStudentsPage";

export const metadata = {
  title: "นิสิตในที่ปรึกษา | Wellness Center",
  description: "รายชื่อนิสิตในความดูแลของอาจารย์ที่ปรึกษา",
};

export default function Page() {
  return <MyStudentsPage />;
}
