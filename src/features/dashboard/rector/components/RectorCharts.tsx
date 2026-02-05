// features/dashboard/rector/components/RectorCharts.tsx
"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import { Line, Bar, Doughnut } from "react-chartjs-2";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui";
import { RectorStatsData } from "../hooks/useRectorStats";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface Props {
  data: RectorStatsData;
}

export function RectorCharts({ data }: Props) {
  return (
    <>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>แนวโน้มการเข้าใช้บริการ</CardTitle>
            <CardDescription>สถิติสะสมรายเดือนในปีการศึกษา 2567</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center">
              <Line options={{ responsive: true, maintainAspectRatio: false }} data={data.mentalHealth} />
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>สัดส่วนระดับความเสี่ยง</CardTitle>
            <CardDescription>จากการประเมินแบบสอบถามคัดกรอง</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center p-4">
              <Doughnut options={{ responsive: true, maintainAspectRatio: false }} data={data.riskLevels} />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>สถิติรายคณะ</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <Bar options={{ responsive: true, maintainAspectRatio: false }} data={data.facultyStats} />
          </div>
        </CardContent>
      </Card>
    </>
  );
}
