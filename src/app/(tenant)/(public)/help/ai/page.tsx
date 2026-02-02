import type { Metadata } from "next";
import { AiChatPage } from "@/features/ai";

export const metadata: Metadata = {
  title: "AI Help Center",
  description: "ผู้ช่วยการใช้งานระบบ NU Wellness",
};

export default function Page() {
  return <AiChatPage />;
}
