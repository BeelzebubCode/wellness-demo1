// src/app/(platform)/ministry/universities/[code]/page.tsx
import { UniversityDetailDashboard } from "@/features/dashboard/ministry/components/UniversityDetailDashboard";

interface UniversityDetailPageProps {
  params: {
    code: string;
  };
}

export default function UniversityDetailPage({ params }: UniversityDetailPageProps) {
  return <UniversityDetailDashboard universityCode={params.code} />;
}
