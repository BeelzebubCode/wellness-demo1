import AiKbDocPage from "@/components/super-admin/ai-kb/AiKbDocPage";

export default function Page({ params }: { params: { id: string } }) {
  return <AiKbDocPage docId={Number(params.id)} />;
}
